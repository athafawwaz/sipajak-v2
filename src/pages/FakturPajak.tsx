import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Upload,
  Download,
  Trash2,
  Edit3,
  FileText,
  CheckCircle,
  Clock,
  ArrowUpDown,
  Search,
  AlertTriangle,
  FileSpreadsheet,
  Inbox,
  XCircle,
  CheckCircle2,
  ShieldCheck,
  Eye,
} from 'lucide-react';

import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import StatCard from '../components/ui/StatCard';
import Pagination from '../components/ui/Pagination';
import { useFakturStore } from '../store/fakturStore';
import { useToastStore } from '../store/toastStore';
import { useAuthStore } from '../store/authStore';
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from '../utils/formatCurrency';
import { exportToExcel, parseImportFile } from '../utils/exportExcel';
import type { FakturPajak, DokumenPDF } from '../types';
import { cn } from '../utils/cn';
import DokumenUploader from '../components/faktur-keluaran/DokumenUploader';
import VendorSearchInput from '../components/master-vendor/VendorSearchInput';


// --- Zod Schema ---
const fakturSchema = z.object({
  tanggalFaktur: z.string().min(1, 'Tanggal Faktur wajib diisi'),
  npwpVendor: z.string().min(1, 'NPWP Vendor wajib diisi'),
  noMVP: z.string().min(1, 'No MVP wajib diisi'),
  nomorFakturPajak: z
    .string()
    .min(1, 'Nomor Faktur Pajak wajib diisi')
    .regex(/^\d{16}$/, 'Harus tepat 16 digit angka'),
  kodeFakturSAP: z.enum(['BV', 'BZ'], { message: 'Kode Faktur SAP wajib dipilih' }),
  namaPerusahaan: z.string().min(1, 'Nama Perusahaan wajib diisi'),
  nilaiDPP: z.number().optional(),
  nilaiPPN: z.number().min(1, 'Nilai PPN wajib diisi'),
  badge: z.string().min(1, 'Wajib diisi'),
  nama: z.string().min(2, 'Wajib diisi'),
  unitKerja: z.string().min(2, 'Wajib diisi'),
  noExtKantor: z.string().min(1, 'Wajib diisi'),
  noWhatsapp: z.string().regex(/^(08|628|\+628)\d{8,11}$/, 'Format nomor tidak valid'),
  email: z.string().email('Format email tidak valid'),
  keterangan: z.string().optional(),
});

type FakturFormData = z.infer<typeof fakturSchema>;

// --- Column Helper ---
const columnHelper = createColumnHelper<FakturPajak>();

// --- Component ---
const FakturPajakPage: React.FC = () => {
  const {
    data,
    isLoading,
    addFaktur,
    updateFaktur,
    deleteFaktur,
    deleteMultiple,
    importData,
    setLoading,
    approveFaktur,
    rejectFaktur,
    bulkApprove,
  } = useFakturStore();
  const addToast = useToastStore((s) => s.addToast);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  // Determine current view from URL
  const isTindakLanjutPage = location.pathname.includes('/tindak-lanjut');
  const isKeuangan = user?.role === 'keuangan';

  // State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFaktur, setEditingFaktur] = useState<FakturPajak | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<Partial<FakturPajak>[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Approval state
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [approvalFaktur, setApprovalFaktur] = useState<FakturPajak | null>(null);
  const [isBulkApproveConfirmOpen, setIsBulkApproveConfirmOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailFaktur, setDetailFaktur] = useState<FakturPajak | null>(null);

  // --- Filtered Data ---
  const filteredData = useMemo(() => {
    if (isTindakLanjutPage) {
      // "Tindak Lanjut" shows Approved and Rejected
      return data.filter((d) => d.status === 'Sudah Approve' || d.status === 'Ditolak');
    }
    // "Baru" only shows Pending
    return data.filter((d) => d.status === 'Pending');
  }, [data, isTindakLanjutPage]);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setGlobalFilter(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Simulate initial load
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, [setLoading]);

  // --- Summary stats ---
  const stats = useMemo(() => {
    const totalFaktur = filteredData.length;
    const sudahApprove = filteredData.filter((d) => d.status === 'Sudah Approve').length;
    const pending = filteredData.filter((d) => d.status === 'Pending').length;
    const ditolak = filteredData.filter((d) => d.status === 'Ditolak').length;
    const totalPPN = filteredData.reduce((sum, d) => sum + d.nilaiPPN, 0);
    return { totalFaktur, sudahApprove, pending, ditolak, totalPPN };
  }, [filteredData]);

  // --- Status badge ---
  const StatusBadge = useCallback(({ status }: { status: FakturPajak['status'] }) => {
    const variant = status === 'Sudah Approve' ? 'success' : status === 'Pending' ? 'warning' : 'danger';
    return <Badge variant={variant}>{status}</Badge>;
  }, []);

  // --- Code badge ---
  const CodeBadge = useCallback(({ code }: { code: 'BV' | 'BZ' }) => {
    const variant = code === 'BV' ? 'info' : 'purple';
    return <Badge variant={variant}>{code}</Badge>;
  }, []);

  // --- Table columns ---
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30 cursor-pointer"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30 cursor-pointer"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
        size: 40,
      }),
      columnHelper.accessor('no', {
        header: 'No',
        cell: (info) => <span className="text-gray-500 font-medium">{info.getValue()}</span>,
        size: 50,
      }),
      columnHelper.accessor('tanggalPengajuan', {
        header: 'Tgl Pengajuan',
        cell: (info) => info.getValue(),
        size: 110,
      }),
      columnHelper.accessor('tanggalFaktur', {
        header: 'Tgl Faktur',
        cell: (info) => info.getValue(),
        size: 110,
      }),
      columnHelper.accessor('noMVP', {
        header: 'No MVP',
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
        size: 130,
      }),
      columnHelper.accessor('nomorFakturPajak', {
        header: 'Nomor Faktur Pajak',
        cell: (info) => <span className="font-medium tracking-wider">{info.getValue()}</span>,
        size: 180,
      }),
      columnHelper.accessor('kodeFakturSAP', {
        header: 'Kode SAP',
        cell: (info) => <CodeBadge code={info.getValue()} />,
        size: 90,
      }),
      columnHelper.accessor('namaPerusahaan', {
        header: 'Nama Vendor',
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
        size: 180,
      }),
      columnHelper.accessor('npwpVendor', {
        header: 'NPWP Vendor',
        cell: (info) => <span className="font-mono tracking-wider text-xs">{info.getValue()}</span>,
        size: 180,
      }),
      columnHelper.accessor('nilaiDPP', {
        header: 'Nilai DPP',
        cell: (info) => (
          <span className="font-medium text-gray-900 tabular-nums">{info.getValue() ? formatCurrency(info.getValue()!) : '-'}</span>
        ),
        size: 160,
      }),
      columnHelper.accessor('nilaiPPN', {
        header: 'Nilai PPN',
        cell: (info) => (
          <span className="font-medium text-gray-900 tabular-nums">{formatCurrency(info.getValue())}</span>
        ),
        size: 160,
      }),
      columnHelper.accessor('badge', {
        header: 'Badge',
        cell: (info) => <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{info.getValue()}</span>,
        size: 90,
      }),
      columnHelper.accessor('nama', {
        header: 'Nama',
        cell: (info) => <span className="font-medium text-gray-900 whitespace-nowrap">{info.getValue()}</span>,
        size: 150,
      }),
      columnHelper.accessor('unitKerja', {
        header: 'Unit Kerja',
        cell: (info) => (
          <div className="max-w-[200px] truncate text-xs" title={info.getValue()}>
            {info.getValue()}
          </div>
        ),
        size: 180,
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => <StatusBadge status={info.getValue()} />,
        size: 130,
      }),
      columnHelper.accessor('keterangan', {
        header: 'Keterangan',
        cell: (info) => (
          <span className="text-gray-500 text-xs">{info.getValue() || '-'}</span>
        ),
        size: 150,
      }),
      columnHelper.accessor('tanggalApprove', {
        header: 'Tgl Approve',
        cell: (info) => (
          <span className="text-gray-500">{info.getValue() || '-'}</span>
        ),
        size: 110,
      }),
      columnHelper.display({
        id: 'dokumen',
        header: 'PDF',
        cell: () => (
          <div className="flex justify-center">
            <a
              href="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center p-1.5 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
              title="Lihat PDF"
            >
              <FileText className="w-4 h-4" />
            </a>
          </div>
        ),
        size: 70,
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => {
          const faktur = row.original;
          const isPending = faktur.status === 'Pending';
          return (
            <div className="flex items-center gap-1">
              {/* Detail button */}
              <button
                onClick={() => handleDetail(faktur)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                title="Lihat Detail"
              >
                <Eye className="w-3 h-3" />
              </button>

              {/* Approve button — only for Pending */}
              {isPending && (
                <button
                  onClick={() => handleApprovalClick(faktur, 'approve')}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-600 border border-emerald-200 rounded-md hover:bg-emerald-50 transition-colors"
                  title="Approve"
                >
                  <CheckCircle2 className="w-3 h-3" />
                </button>
              )}

              {/* Reject button — only for Pending */}
              {isPending && (
                <button
                  onClick={() => handleApprovalClick(faktur, 'reject')}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
                  title="Tolak"
                >
                  <XCircle className="w-3 h-3" />
                </button>
              )}

              {/* Edit button */}
              <button
                onClick={() => handleEdit(faktur)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
                title="Edit"
              >
                <Edit3 className="w-3 h-3" />
              </button>

              {/* Delete button */}
              <button
                onClick={() => handleDeleteConfirm(faktur.id)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
                title="Hapus"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          );
        },
        size: 220,
      }),
    ],
    [StatusBadge, CodeBadge, isKeuangan]
  );

  // --- Table instance ---
  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, columnFilters, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
    getRowId: (row) => row.id,
  });

  // --- Handlers ---
  const handleEdit = useCallback((faktur: FakturPajak) => {
    setEditingFaktur(faktur);
    setIsEditModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback((id: string) => {
    setDeletingId(id);
    setIsDeleteConfirmOpen(true);
  }, []);

  const handleDelete = useCallback(() => {
    if (deletingId) {
      deleteFaktur(deletingId);
      addToast('Faktur berhasil dihapus', 'success');
      setIsDeleteConfirmOpen(false);
      setDeletingId(null);
    }
  }, [deletingId, deleteFaktur, addToast]);

  const handleBulkDelete = useCallback(() => {
    const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
    if (selectedIds.length > 0) {
      deleteMultiple(selectedIds);
      setRowSelection({});
      addToast(`${selectedIds.length} faktur berhasil dihapus`, 'success');
    }
    setIsBulkDeleteConfirmOpen(false);
  }, [rowSelection, deleteMultiple, addToast]);

  const handleExport = useCallback(() => {
    exportToExcel(data, `faktur-pajak-${new Date().toISOString().slice(0, 10)}`);
    addToast('Data berhasil di-export ke Excel', 'success');
  }, [data, addToast]);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const parsed = await parseImportFile(file);
        setImportPreviewData(parsed);
        setIsImportModalOpen(true);
      } catch {
        addToast('Gagal membaca file. Pastikan format CSV/XLSX valid.', 'error');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [addToast]
  );

  const handleImportConfirm = useCallback(() => {
    importData(importPreviewData);
    addToast(`${importPreviewData.length} data berhasil diimport`, 'success');
    setIsImportModalOpen(false);
    setImportPreviewData([]);
  }, [importPreviewData, importData, addToast]);

  // --- Approval handlers ---
  const handleApprovalClick = useCallback((faktur: FakturPajak, action: 'approve' | 'reject') => {
    setApprovalFaktur(faktur);
    setApprovalAction(action);
    setIsApprovalModalOpen(true);
  }, []);

  const handleApprovalConfirm = useCallback(
    (reason?: string) => {
      if (!approvalFaktur) return;
      const approvedBy = user?.name || 'Unknown';

      if (approvalAction === 'approve') {
        approveFaktur(approvalFaktur.id, approvedBy);
        addToast(`Faktur ${approvalFaktur.nomorFakturPajak} berhasil di-approve`, 'success');
      } else {
        rejectFaktur(approvalFaktur.id, approvedBy, reason || '');
        addToast(`Faktur ${approvalFaktur.nomorFakturPajak} ditolak`, 'warning');
      }

      setIsApprovalModalOpen(false);
      setApprovalFaktur(null);
    },
    [approvalFaktur, approvalAction, approveFaktur, rejectFaktur, addToast, user]
  );

  const handleBulkApproveConfirm = useCallback(() => {
    const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
    const pendingIds = selectedIds.filter((id) => data.find((d) => d.id === id)?.status === 'Pending');
    if (pendingIds.length > 0) {
      bulkApprove(pendingIds, user?.name || 'Unknown');
      setRowSelection({});
      addToast(`${pendingIds.length} faktur berhasil di-approve`, 'success');
    } else {
      addToast('Tidak ada faktur Pending yang dipilih', 'warning');
    }
    setIsBulkApproveConfirmOpen(false);
  }, [rowSelection, data, bulkApprove, addToast, user]);

  const handleDetail = useCallback((faktur: FakturPajak) => {
    setDetailFaktur(faktur);
    setIsDetailModalOpen(true);
  }, []);

  const selectedCount = Object.values(rowSelection).filter(Boolean).length;
  const selectedPendingCount = useMemo(() => {
    const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
    return selectedIds.filter((id) => data.find((d) => d.id === id)?.status === 'Pending').length;
  }, [rowSelection, data]);

  // --- Row status background helper ---
  const getRowStatusClass = (status: FakturPajak['status']) => {
    switch (status) {
      case 'Sudah Approve':
        return 'bg-emerald-50/40';
      case 'Pending':
        return 'bg-amber-50/30';
      case 'Ditolak':
        return 'bg-red-50/30';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* --- Summary Cards --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Faktur"
          value={stats.totalFaktur}
          icon={<FileText className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Sudah Approve"
          value={stats.sudahApprove}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          icon={<Clock className="w-5 h-5" />}
          color="yellow"
        />
        <StatCard
          label="Ditolak"
          value={stats.ditolak}
          icon={<XCircle className="w-5 h-5" />}
          color="red"
        />
      </div>

      {/* --- Table Card --- */}
      <div className="card">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              {!isTindakLanjutPage && (
                <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsAddModalOpen(true)}>
                  Input Faktur
                </Button>
              )}
              {/* <Button
                size="sm"
                variant="outline"
                leftIcon={<Upload className="w-4 h-4" />}
                onClick={() => fileInputRef.current?.click()}
              >
                Upload File
              </Button> */}
              <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileUpload} />
              <Button size="sm" variant="outline" leftIcon={<Download className="w-4 h-4" />} onClick={handleExport}>
                Export Excel
              </Button>

              {/* Bulk Approve button */}
              {selectedPendingCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<ShieldCheck className="w-4 h-4" />}
                  onClick={() => setIsBulkApproveConfirmOpen(true)}
                  className="!text-emerald-600 !border-emerald-300 hover:!bg-emerald-50"
                >
                  Approve ({selectedPendingCount})
                </Button>
              )}

              {selectedCount > 0 && (
                <Button
                  size="sm"
                  variant="danger"
                  leftIcon={<Trash2 className="w-4 h-4" />}
                  onClick={() => setIsBulkDeleteConfirmOpen(true)}
                >
                  Hapus ({selectedCount})
                </Button>
              )}
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari data..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <React.Fragment key={headerGroup.id}>
                  <tr className="bg-gray-50/80">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap"
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={cn(
                              'flex items-center gap-1',
                              header.column.getCanSort() && 'cursor-pointer select-none hover:text-gray-900'
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanSort() && (
                              <ArrowUpDown className="w-3 h-3 text-gray-400" />
                            )}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                  {/* Column filters */}
                  <tr className="bg-gray-50/40 border-b border-gray-100">
                    {headerGroup.headers.map((header) => (
                      <th key={`filter-${header.id}`} className="px-4 py-1.5">
                        {header.column.getCanFilter() ? (
                          <input
                            type="text"
                            value={(header.column.getFilterValue() as string) ?? ''}
                            onChange={(e) => header.column.setFilterValue(e.target.value)}
                            placeholder="Filter..."
                            className="w-full px-2 py-1 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30 bg-white"
                          />
                        ) : null}
                      </th>
                    ))}
                  </tr>
                </React.Fragment>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                // Skeleton loading
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`}>
                    {columns.map((_, colIdx) => (
                      <td key={`skeleton-${idx}-${colIdx}`} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={columns.length} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                        <Inbox className="w-8 h-8 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Data tidak ditemukan</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {globalFilter
                            ? `Tidak ada data yang sesuai dengan pencarian "${globalFilter}"`
                            : isTindakLanjutPage
                            ? 'Belum ada data tindak lanjut faktur pajak.'
                            : 'Belum ada data faktur pajak. Klik "Input Faktur" untuk menambahkan.'}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      'hover:bg-blue-50/40 transition-colors',
                      row.getIsSelected() && 'bg-primary/5',
                      !row.getIsSelected() && getRowStatusClass(row.original.status)
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-gray-100">
          <Pagination
            currentPage={table.getState().pagination.pageIndex + 1}
            totalPages={table.getPageCount()}
            pageSize={table.getState().pagination.pageSize}
            totalItems={table.getFilteredRowModel().rows.length}
            onPageChange={(page) => table.setPageIndex(page - 1)}
            onPageSizeChange={(size) => table.setPageSize(size)}
          />
        </div>
      </div>

      {/* --- Add Modal --- */}
      <FakturModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Input Faktur Pajak Baru"
        onSubmit={(formData) => {
          addFaktur({
            ...formData,
            status: 'Pending',
            tanggalApprove: '',
          });
          setIsAddModalOpen(false);
          addToast('Faktur berhasil ditambahkan', 'success');
        }}
      />

      {/* --- Edit Modal --- */}
      <FakturModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingFaktur(null);
        }}
        title="Edit Faktur Pajak"
        initialData={editingFaktur}
        onSubmit={(formData) => {
          if (editingFaktur) {
            updateFaktur(editingFaktur.id, formData);
            setIsEditModalOpen(false);
            setEditingFaktur(null);
            addToast('Faktur berhasil diperbarui', 'success');
          }
        }}
      />

      {/* --- Approval Modal --- */}
      <ApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => {
          setIsApprovalModalOpen(false);
          setApprovalFaktur(null);
        }}
        faktur={approvalFaktur}
        action={approvalAction}
        onConfirm={handleApprovalConfirm}
        userName={user?.name || 'Unknown'}
      />

      {/* --- Detail Modal --- */}
      <DetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailFaktur(null);
        }}
        faktur={detailFaktur}
      />

      {/* --- Delete Confirm --- */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Faktur"
        message="Apakah Anda yakin ingin menghapus faktur ini? Tindakan ini tidak dapat dibatalkan."
      />

      {/* --- Bulk Delete Confirm --- */}
      <ConfirmDialog
        isOpen={isBulkDeleteConfirmOpen}
        onClose={() => setIsBulkDeleteConfirmOpen(false)}
        onConfirm={handleBulkDelete}
        title="Hapus Data Terpilih"
        message={`Apakah Anda yakin ingin menghapus ${selectedCount} faktur yang dipilih? Tindakan ini tidak dapat dibatalkan.`}
      />

      {/* --- Bulk Approve Confirm --- */}
      <ConfirmDialog
        isOpen={isBulkApproveConfirmOpen}
        onClose={() => setIsBulkApproveConfirmOpen(false)}
        onConfirm={handleBulkApproveConfirm}
        title="Approve Massal"
        message={`Apakah Anda yakin ingin meng-approve ${selectedPendingCount} faktur yang dipilih?`}
        variant="success"
      />

      {/* --- Import Preview Modal --- */}
      <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Preview Data Import" size="xl">
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <FileSpreadsheet className="w-5 h-5 text-blue-500" />
            <p className="text-sm text-blue-700">{importPreviewData.length} baris data siap diimport</p>
          </div>
          <div className="max-h-80 overflow-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Terima/Pengajuan</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Tanggal Faktur</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">No MVP</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">No Faktur</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Nama Vendor</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">NPWP Vendor</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Nilai PPN</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {importPreviewData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-3 py-2">{row.tanggalPengajuan}</td>
                    <td className="px-3 py-2">{row.tanggalFaktur}</td>
                    <td className="px-3 py-2">{row.noMVP}</td>
                    <td className="px-3 py-2 font-mono text-xs">{row.nomorFakturPajak}</td>
                    <td className="px-3 py-2">{row.namaPerusahaan}</td>
                    <td className="px-3 py-2 font-mono text-xs">{row.npwpVendor}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(row.nilaiPPN || 0)}</td>
                    <td className="px-3 py-2">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsImportModalOpen(false)}>Batal</Button>
            <Button onClick={handleImportConfirm} leftIcon={<Upload className="w-4 h-4" />}>Import Data</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ============================================================
// FakturModal — Add / Edit form (status removed, auto "Pending")
// ============================================================
interface FakturModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  initialData?: FakturPajak | null;
  onSubmit: (data: any) => void;
}

const FakturModal: React.FC<FakturModalProps> = ({ isOpen, onClose, title, initialData, onSubmit }) => {
  const { user } = useAuthStore();
  const [ppnDisplay, setPpnDisplay] = useState('');
  const [dppDisplay, setDppDisplay] = useState('');
  const [dokumen, setDokumen] = useState<DokumenPDF[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FakturFormData>({
    resolver: zodResolver(fakturSchema),
    defaultValues: {
      tanggalFaktur: '',
      npwpVendor: '',
      noMVP: '',
      nomorFakturPajak: '',
      kodeFakturSAP: 'BV',
      namaPerusahaan: '',
      nilaiDPP: undefined,
      nilaiPPN: 0,
      keterangan: '',
      badge: user?.badge || '',
      nama: user?.name || '',
      unitKerja: user?.unitKerja || '',
      noExtKantor: '1234',
      noWhatsapp: user?.hp || '081234567890',
      email: user?.email || 'user@pusri.co.id',
    },
  });

  useEffect(() => {
    if (isOpen && initialData) {
      // Convert DD/MM/YYYY to YYYY-MM-DD for date input
      const convertDate = (d: string) => {
        if (!d) return '';
        const parts = d.split('/');
        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
        return d;
      };
      reset({
        tanggalFaktur: convertDate(initialData.tanggalFaktur),
        npwpVendor: initialData.npwpVendor || '',
        noMVP: initialData.noMVP,
        nomorFakturPajak: initialData.nomorFakturPajak,
        kodeFakturSAP: initialData.kodeFakturSAP,
        namaPerusahaan: initialData.namaPerusahaan,
        nilaiDPP: initialData.nilaiDPP,
        nilaiPPN: initialData.nilaiPPN,
        keterangan: initialData.keterangan || '',
        badge: initialData.badge,
        nama: initialData.nama,
        unitKerja: initialData.unitKerja,
        noExtKantor: initialData.noExtKantor,
        noWhatsapp: initialData.noWhatsapp,
        email: initialData.email,
      });
      setPpnDisplay(formatCurrencyInput(initialData.nilaiPPN));
      if (initialData.nilaiDPP) setDppDisplay(formatCurrencyInput(initialData.nilaiDPP));
      else setDppDisplay('');
      setDokumen(initialData.dokumen || []);
    } else if (isOpen) {
      reset();
      setPpnDisplay('');
      setDppDisplay('');
      setDokumen([]);
    }
  }, [isOpen, initialData, reset]);

  const onFormSubmit = (formData: FakturFormData) => {
    // Convert YYYY-MM-DD back to DD/MM/YYYY
    const convertDateBack = (d: string) => {
      if (!d) return '';
      const parts = d.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return d;
    };

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const tanggalPengajuan = initialData?.tanggalPengajuan || `${dd}/${mm}/${yyyy}`;

    onSubmit({
      ...formData,
      tanggalFaktur: convertDateBack(formData.tanggalFaktur),
      tanggalPengajuan,
      dokumen,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Section 1 — Identitas Faktur */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800">📋 Identitas Faktur</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tanggal Faktur *</label>
                <input
                  type="date"
                  className={cn(
                    'w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
                    errors.tanggalFaktur ? 'border-red-300' : 'border-gray-300'
                  )}
                  {...register('tanggalFaktur')}
                />
                {errors.tanggalFaktur && <p className="mt-1 text-xs text-red-600">{errors.tanggalFaktur.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">No MVP *</label>
                <input
                  type="text"
                  placeholder="MVP-XXXXXXX"
                  className={cn(
                    'w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
                    errors.noMVP ? 'border-red-300' : 'border-gray-300'
                  )}
                  {...register('noMVP')}
                />
                {errors.noMVP && <p className="mt-1 text-xs text-red-600">{errors.noMVP.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nomor Faktur Pajak *</label>
                <input
                  type="text"
                  placeholder="16 digit angka"
                  maxLength={16}
                  className={cn(
                    'w-full rounded-lg border px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
                    errors.nomorFakturPajak ? 'border-red-300' : 'border-gray-300'
                  )}
                  {...register('nomorFakturPajak')}
                />
                {errors.nomorFakturPajak && <p className="mt-1 text-xs text-red-600">{errors.nomorFakturPajak.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Kode Faktur SAP *</label>
                <select
                  className={cn(
                    'w-full rounded-lg border px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
                    errors.kodeFakturSAP ? 'border-red-300' : 'border-gray-300'
                  )}
                  {...register('kodeFakturSAP')}
                >
                  <option value="BV">BV</option>
                  <option value="BZ">BZ</option>
                </select>
                {errors.kodeFakturSAP && <p className="mt-1 text-xs text-red-600">{errors.kodeFakturSAP.message}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 — Detail Transaksi */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-blue-50 px-4 py-2.5 border-b border-blue-200">
            <h3 className="text-sm font-semibold text-blue-800">💰 Detail Transaksi</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nama Vendor *</label>
                <Controller
                  name="namaPerusahaan"
                  control={control}
                  render={({ field }) => (
                    <VendorSearchInput
                      value={field.value}
                      onChange={field.onChange}
                      onVendorSelect={(vendor) => {
                        setValue('npwpVendor', vendor.npwp, { shouldValidate: true });
                      }}
                      placeholder="Cari vendor atau ketik manual"
                      className={cn(
                        'w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
                        errors.namaPerusahaan ? 'border-red-300' : 'border-gray-300'
                      )}
                    />
                  )}
                />
                {errors.namaPerusahaan && <p className="mt-1 text-xs text-red-600">{errors.namaPerusahaan.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">NPWP Vendor *</label>
                <input
                  type="text"
                  placeholder="00.000.000.0-000.000"
                  className={cn(
                    'w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
                    errors.npwpVendor ? 'border-red-300' : 'border-gray-300'
                  )}
                  {...register('npwpVendor')}
                />
                {errors.npwpVendor && <p className="mt-1 text-xs text-red-600">{errors.npwpVendor.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nilai DPP (Rp)</label>
                <Controller
                  name="nilaiDPP"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={dppDisplay}
                      onChange={(e) => {
                        const num = parseCurrencyInput(e.target.value);
                        const ppn = Math.round(num * 0.11);
                        setDppDisplay(formatCurrencyInput(num));
                        setPpnDisplay(formatCurrencyInput(ppn));
                        field.onChange(num);
                        setValue('nilaiPPN', ppn, { shouldValidate: true });
                      }}
                      className={cn(
                        'w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
                        errors.nilaiDPP ? 'border-red-300' : 'border-gray-300'
                      )}
                    />
                  )}
                />
                {errors.nilaiDPP && <p className="mt-1 text-xs text-red-600">{errors.nilaiDPP.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nilai PPN (Rp) *</label>
                <Controller
                  name="nilaiPPN"
                  control={control}
                  render={() => (
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={ppnDisplay}
                      readOnly
                      className={cn(
                        'w-full rounded-lg border px-3.5 py-2.5 text-sm bg-gray-50 text-gray-600 cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
                        errors.nilaiPPN ? 'border-red-300' : 'border-gray-300'
                      )}
                    />
                  )}
                />
                {errors.nilaiPPN && <p className="mt-1 text-xs text-red-600">{errors.nilaiPPN.message}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3 — Data Penyampai */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-amber-50 px-4 py-2.5 border-b border-amber-200">
            <h3 className="text-sm font-semibold text-amber-800">👤 Data Penyampai Faktur Pajak</h3>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Badge *</label>
              <input type="text" placeholder="1100XXX" className={cn('w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all', errors.badge ? 'border-red-300' : 'border-gray-300')} {...register('badge')} />
              {errors.badge && <p className="mt-1 text-xs text-red-600">{errors.badge.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nama *</label>
              <input type="text" placeholder="Nama lengkap" className={cn('w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all', errors.nama ? 'border-red-300' : 'border-gray-300')} {...register('nama')} />
              {errors.nama && <p className="mt-1 text-xs text-red-600">{errors.nama.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Unit Kerja *</label>
              <input type="text" placeholder="Unit kerja" className={cn('w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all', errors.unitKerja ? 'border-red-300' : 'border-gray-300')} {...register('unitKerja')} />
              {errors.unitKerja && <p className="mt-1 text-xs text-red-600">{errors.unitKerja.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">No. Ext Kantor *</label>
              <input type="text" placeholder="XXXX" className={cn('w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all', errors.noExtKantor ? 'border-red-300' : 'border-gray-300')} {...register('noExtKantor')} />
              {errors.noExtKantor && <p className="mt-1 text-xs text-red-600">{errors.noExtKantor.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">No. WhatsApp *</label>
              <input type="text" placeholder="08XXXXXXXXXX" className={cn('w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all', errors.noWhatsapp ? 'border-red-300' : 'border-gray-300')} {...register('noWhatsapp')} />
              {errors.noWhatsapp && <p className="mt-1 text-xs text-red-600">{errors.noWhatsapp.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" placeholder="email@pusri.co.id" className={cn('w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all', errors.email ? 'border-red-300' : 'border-gray-300')} {...register('email')} />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>
          </div>
        </div>

        {/* Section 4 — Dokumen Pendukung */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800">📎 Dokumen Pendukung</h3>
          </div>
          <div className="p-4">
            <DokumenUploader value={dokumen} onChange={setDokumen} maxFiles={5} maxSizeMB={10} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
            Simpan
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ============================================================
// ApprovalModal — Approve / Reject with detail & reason
// ============================================================
interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  faktur: FakturPajak | null;
  action: 'approve' | 'reject';
  onConfirm: (reason?: string) => void;
  userName: string;
}

const ApprovalModal: React.FC<ApprovalModalProps> = ({ isOpen, onClose, faktur, action, onConfirm, userName }) => {
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setReasonError('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (action === 'reject' && !reason.trim()) {
      setReasonError('Alasan penolakan wajib diisi');
      return;
    }
    onConfirm(reason);
  };

  if (!faktur) return null;

  const isApprove = action === 'approve';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isApprove ? 'Konfirmasi Approve' : 'Konfirmasi Penolakan'} size="md">
      <div className="space-y-5">
        {/* Header Icon */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center',
              isApprove ? 'bg-emerald-100' : 'bg-red-100'
            )}
          >
            {isApprove ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {isApprove ? 'Approve Faktur Pajak' : 'Tolak Faktur Pajak'}
            </p>
            <p className="text-xs text-gray-500">
              {isApprove
                ? 'Faktur akan disetujui dan statusnya berubah menjadi "Sudah Approve"'
                : 'Faktur akan ditolak dan statusnya berubah menjadi "Ditolak"'}
            </p>
          </div>
        </div>

        {/* Faktur Detail Card */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-100">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">No Faktur Pajak</p>
              <p className="font-mono font-medium text-gray-900">{faktur.nomorFakturPajak}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">No MVP</p>
              <p className="font-medium text-gray-900">{faktur.noMVP}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Nama Vendor</p>
              <p className="font-medium text-gray-900">{faktur.namaPerusahaan}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">NPWP Vendor</p>
              <p className="font-mono text-gray-900 tracking-wider text-xs pt-1">{faktur.npwpVendor}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Nilai PPN</p>
              <p className="font-semibold text-gray-900">{formatCurrency(faktur.nilaiPPN)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Tgl Terima/Pengajuan</p>
              <p className="text-gray-900">{faktur.tanggalPengajuan}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Tanggal Faktur</p>
              <p className="text-gray-900">{faktur.tanggalFaktur}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Verifikator</p>
              <p className="text-gray-900">{faktur.verifikator || '-'}</p>
            </div>
          </div>
        </div>

        {/* Approved By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {isApprove ? 'Disetujui oleh' : 'Ditolak oleh'}
          </label>
          <input
            type="text"
            value={userName}
            disabled
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-600"
          />
        </div>

        {/* Rejection Reason — only for reject */}
        {!isApprove && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Alasan Penolakan <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim()) setReasonError('');
              }}
              placeholder="Tuliskan alasan penolakan faktur ini..."
              className={cn(
                'w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all resize-none',
                reasonError
                  ? 'border-red-300 focus:ring-red-300/30 focus:border-red-400'
                  : 'border-gray-300 focus:ring-primary/30 focus:border-primary'
              )}
            />
            {reasonError && <p className="mt-1 text-xs text-red-600">{reasonError}</p>}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          {isApprove ? (
            <Button
              onClick={handleConfirm}
              className="!bg-emerald-600 hover:!bg-emerald-700 !text-white"
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Ya, Approve
            </Button>
          ) : (
            <Button variant="danger" onClick={handleConfirm} leftIcon={<XCircle className="w-4 h-4" />}>
              Ya, Tolak
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

// ============================================================
// DetailModal — View faktur detail (read-only)
// ============================================================
interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  faktur: FakturPajak | null;
}

const DetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, faktur }) => {
  if (!faktur) return null;

  const statusVariant = faktur.status === 'Sudah Approve' ? 'success' : faktur.status === 'Pending' ? 'warning' : 'danger';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detail Faktur Pajak" size="lg">
      <div className="space-y-5">
        {/* Status Banner */}
        <div
          className={cn(
            'flex items-center gap-3 p-4 rounded-lg border',
            faktur.status === 'Sudah Approve' && 'bg-emerald-50 border-emerald-200',
            faktur.status === 'Pending' && 'bg-amber-50 border-amber-200',
            faktur.status === 'Ditolak' && 'bg-red-50 border-red-200'
          )}
        >
          {faktur.status === 'Sudah Approve' && <CheckCircle className="w-5 h-5 text-emerald-600" />}
          {faktur.status === 'Pending' && <Clock className="w-5 h-5 text-amber-600" />}
          {faktur.status === 'Ditolak' && <XCircle className="w-5 h-5 text-red-600" />}
          <div>
            <p className="text-sm font-semibold">
              Status: <Badge variant={statusVariant}>{faktur.status}</Badge>
            </p>
            {faktur.approvedBy && (
              <p className="text-xs text-gray-600 mt-0.5">
                {faktur.status === 'Sudah Approve' ? 'Disetujui' : 'Ditolak'} oleh: <strong>{faktur.approvedBy}</strong>
                {faktur.tanggalApprove && ` pada ${faktur.tanggalApprove}`}
              </p>
            )}
          </div>
        </div>

        {/* Rejection Reason */}
        {faktur.status === 'Ditolak' && faktur.rejectionReason && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs font-semibold text-red-700 mb-1">Alasan Penolakan:</p>
            <p className="text-sm text-red-800">{faktur.rejectionReason}</p>
          </div>
        )}

        {/* Detail Grid */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <DetailField label="No Faktur Pajak" value={faktur.nomorFakturPajak} mono />
            <DetailField label="No MVP" value={faktur.noMVP} />
            <DetailField label="Tgl Terima/Pengajuan" value={faktur.tanggalPengajuan} />
            <DetailField label="Tanggal Faktur" value={faktur.tanggalFaktur} />
            <DetailField label="Kode Faktur SAP" value={faktur.kodeFakturSAP} />
            <DetailField label="Nama Vendor" value={faktur.namaPerusahaan} />
            <DetailField label="NPWP Vendor" value={faktur.npwpVendor} mono />
            <DetailField label="Nilai PPN" value={formatCurrency(faktur.nilaiPPN)} bold />
            <DetailField label="Badge (Nama)" value={`${faktur.badge} (${faktur.nama})`} />
            <DetailField label="Unit Kerja" value={faktur.unitKerja} />
            <DetailField label="Kontak" value={`${faktur.email} / ${faktur.noWhatsapp}`} />
            <DetailField label="No Ext Kantor" value={faktur.noExtKantor || '-'} />
            <DetailField label="Verifikator" value={faktur.verifikator || '-'} />
            <DetailField label="Tanggal Approve" value={faktur.tanggalApprove || '-'} />
            {faktur.keterangan && (
              <div className="md:col-span-2">
                <DetailField label="Keterangan" value={faktur.keterangan} />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-gray-100">
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Helper for detail fields
const DetailField: React.FC<{ label: string; value: string; mono?: boolean; bold?: boolean }> = ({
  label,
  value,
  mono,
  bold,
}) => (
  <div>
    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
    <p
      className={cn(
        'text-gray-900',
        mono && 'font-mono tracking-wider text-xs',
        bold && 'font-semibold'
      )}
    >
      {value}
    </p>
  </div>
);

// ============================================================
// ConfirmDialog — with support for success variant
// ============================================================
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  variant?: 'danger' | 'success';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, onClose, onConfirm, title, message, variant = 'danger' }) => {
  const isSuccess = variant === 'success';
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
              isSuccess ? 'bg-emerald-100' : 'bg-red-100'
            )}
          >
            {isSuccess ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            )}
          </div>
          <p className="text-sm text-gray-600 pt-2">{message}</p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          {isSuccess ? (
            <Button
              onClick={onConfirm}
              className="!bg-emerald-600 hover:!bg-emerald-700 !text-white"
            >
              Ya, Approve
            </Button>
          ) : (
            <Button variant="danger" onClick={onConfirm}>
              Ya, Hapus
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default FakturPajakPage;
