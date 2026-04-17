import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnDef,
} from '@tanstack/react-table';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Download,
  Trash2,
  Edit3,
  Search,
  ArrowUpDown,
  Inbox,
  AlertTriangle,
  FileSpreadsheet,
  DollarSign,
  CheckCircle2,
  Clock,
  Eye,
  XCircle,
  ShieldCheck,
  FileText,
} from 'lucide-react';

import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import StatCard from '../components/ui/StatCard';
import Pagination from '../components/ui/Pagination';
import { useFakturSetorStore } from '../store/fakturSetorStore';
import { useToastStore } from '../store/toastStore';
import { useAuthStore } from '../store/authStore';
import type { FakturPajakSetor, DokumenPDF } from '../types';
import { cn } from '../utils/cn';
import DokumenUploader from '../components/faktur-keluaran/DokumenUploader';
import VendorSearchInput from '../components/master-vendor/VendorSearchInput';

// ============================================================
// HELPERS
// ============================================================
const formatCurrency = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

const parseCurrency = (val: string) => {
  const num = Number(val.replace(/[^\d]/g, ''));
  return isNaN(num) ? 0 : num;
};

// ============================================================
// ZOD SCHEMA
// ============================================================
const fakturPajakSetorSchema = z.object({
  tipeFA: z.enum(['TA', 'Non TA']),
  nomorFakturPajak: z
    .string()
    .length(16, 'Harus tepat 16 digit')
    .regex(/^\d+$/, 'Hanya boleh angka'),
  tanggalFaktur: z.string().min(1, 'Wajib diisi'),
  npwpVendor: z.string().min(1, 'Wajib diisi'),
  namaVendor: z.string().min(1, 'Wajib diisi'),
  alamat: z.string().min(5, 'Alamat terlalu pendek'),
  dpp: z.number().positive('Harus lebih dari 0'),
  ppn: z.number().positive('Harus lebih dari 0'),
  noAkunPerkiraanBiaya: z.string().optional(),
  noBP: z.string().optional(),
  badge: z.string().min(1, 'Wajib diisi'),
  nama: z.string().min(2, 'Wajib diisi'),
  unitKerja: z.string().min(2, 'Wajib diisi'),
  noExtKantor: z.string().min(1, 'Wajib diisi'),
  noWhatsapp: z.string().regex(/^(08|628|\+628)\d{8,11}$/, 'Format nomor tidak valid'),
  email: z.string().email('Format email tidak valid'),
  noSELKamish: z.string().optional(),
  noVirtuSAP: z.string().optional(),
  status: z.enum(['Sudah Approve', 'Pending', 'Ditolak']).optional(),
  keterangan: z.string().optional(),
});

type FakturSetorFormData = z.infer<typeof fakturPajakSetorSchema>;

// ============================================================
// COLUMN HELPER
// ============================================================
const columnHelper = createColumnHelper<FakturPajakSetor>();

// ============================================================
// MAIN COMPONENT
// ============================================================
const FakturPajakSetorPage: React.FC = () => {
  const { data, isLoading, addFaktur, updateFaktur, deleteFaktur, deleteMultiple, setLoading, approveFaktur, rejectFaktur, bulkApprove } =
    useFakturSetorStore();
  const addToast = useToastStore((s) => s.addToast);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  // Determine current view from URL
  const isTindakLanjutPage = location.pathname.includes('/tindak-lanjut');

  // State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FakturPajakSetor | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  // Approval state
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [approvalFaktur, setApprovalFaktur] = useState<FakturPajakSetor | null>(null);
  const [isBulkApproveConfirmOpen, setIsBulkApproveConfirmOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailFaktur, setDetailFaktur] = useState<FakturPajakSetor | null>(null);


  // Search debounce
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setGlobalFilter(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Simulate loading
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, [setLoading]);

  // Stats
  const stats = useMemo(() => {
    const displayData = isTindakLanjutPage 
      ? data.filter(d => d.status === 'Sudah Approve' || d.status === 'Ditolak') 
      : data.filter(d => d.status === 'Pending');
    const totalFaktur = displayData.length;
    const sudahApprove = displayData.filter((d) => d.status === 'Sudah Approve').length;
    const pending = displayData.filter((d) => d.status === 'Pending').length;
    const totalDppPpn = displayData.reduce((sum, d) => sum + d.dpp + d.ppn, 0);
    return { totalFaktur, sudahApprove, pending, totalDppPpn };
  }, [data, isTindakLanjutPage]);

  // Filtered data (column filters + status based on submenu)
  const filteredData = useMemo(() => {
    let result = isTindakLanjutPage 
      ? data.filter(d => d.status === 'Sudah Approve' || d.status === 'Ditolak') 
      : data.filter(d => d.status === 'Pending');
    
    Object.entries(columnFilters).forEach(([key, value]) => {
      if (!value) return;
      const lowerVal = value.toLowerCase();
      result = result.filter((row) => {
        const cellValue = String(((row as unknown) as Record<string, unknown>)[key] ?? '').toLowerCase();
        return cellValue.includes(lowerVal);
      });
    });
    return result;
  }, [data, isTindakLanjutPage, columnFilters]);

  // Columns with grouped headers
  const columns = useMemo<ColumnDef<FakturPajakSetor, any>[]>(
    () => [
      // Checkbox
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="rounded border-gray-300"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="rounded border-gray-300"
          />
        ),
        size: 40,
        enableSorting: false,
      },
      // --- IDENTITAS FAKTUR (ungrouped) ---
      columnHelper.accessor('no', {
        header: 'No',
        cell: (info) => <span className="text-gray-500 font-medium">{info.getValue()}</span>,
        size: 50,
        enableColumnFilter: false,
      }),
      columnHelper.accessor('tipeFA', {
        header: 'Tipe',
        cell: (info) => {
          const val = info.getValue();
          return (
            <span
              className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide',
                val === 'TA'
                  ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300'
                  : 'bg-orange-100 text-orange-700 ring-1 ring-orange-300'
              )}
            >
              {val}
            </span>
          );
        },
        size: 85,
      }),
      columnHelper.accessor('tanggalPenyampaian', {
        header: 'Tgl Penyampaian',
        cell: (info) => <span className="whitespace-nowrap">{info.getValue()}</span>,
        size: 130,
      }),
      columnHelper.accessor('nomorFakturPajak', {
        header: 'Nomor Faktur Pajak',
        cell: (info) => (
          <span className="font-medium text-primary">{info.getValue()}</span>
        ),
        size: 170,
      }),
      columnHelper.accessor('tanggalFaktur', {
        id: 'tanggalFaktur',
        header: 'Tgl Faktur',
        cell: (info) => (
          <span className="whitespace-nowrap px-2 py-1 rounded bg-yellow-50 text-yellow-800 font-medium text-xs">
            {info.getValue()}
          </span>
        ),
        size: 110,
      }),
      // --- DATA FAKTUR PAJAK ---
      columnHelper.accessor('npwpVendor', {
        header: 'NPWP Vendor',
        cell: (info) => <span className="font-medium">{info.getValue() || '-'}</span>,
        size: 150,
      }),
      columnHelper.accessor('namaVendor', {
        header: 'Nama Vendor',
        cell: (info) => <span className="font-medium text-gray-900 whitespace-nowrap">{info.getValue() || '-'}</span>,
        size: 200,
      }),
      columnHelper.accessor('alamat', {
        header: 'Alamat',
        cell: (info) => (
          <div className="max-w-[200px] truncate" title={info.getValue()}>
            {info.getValue()}
          </div>
        ),
        size: 200,
      }),
      columnHelper.accessor('dpp', {
        header: 'DPP',
        cell: (info) => (
          <span className="font-mono text-xs font-medium text-right block">
            {formatCurrency(info.getValue())}
          </span>
        ),
        size: 150,
      }),
      columnHelper.accessor('ppn', {
        header: 'PPN',
        cell: (info) => (
          <span className="font-mono text-xs font-medium text-right block">
            {formatCurrency(info.getValue())}
          </span>
        ),
        size: 150,
      }),

      // --- DATA PENYAMPAI ---
      columnHelper.accessor('badge', {
        header: 'Badge',
        cell: (info) => (
          <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{info.getValue()}</span>
        ),
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
        size: 200,
      }),
      columnHelper.accessor('noExtKantor', {
        header: 'No. Ext',
        cell: (info) => <span className="text-xs">{info.getValue()}</span>,
        size: 80,
      }),
      columnHelper.accessor('noWhatsapp', {
        header: 'No. WA',
        cell: (info) => <span className="text-xs">{info.getValue()}</span>,
        size: 130,
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        cell: (info) => (
          <div className="max-w-[170px] truncate text-[11px] text-gray-500" title={info.getValue()}>
            {info.getValue()}
          </div>
        ),
        size: 170,
      }),

      // --- STATUS ---
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const v = info.getValue();
          const variant = v === 'Sudah Approve' ? 'success' : v === 'Pending' ? 'warning' : 'danger';
          return <Badge variant={variant}>{v}</Badge>;
        },
        size: 130,
      }),
      ...(isTindakLanjutPage
        ? [
            columnHelper.accessor('tanggalApprove', {
              header: 'Tgl Approve',
              cell: (info) => <span className="whitespace-nowrap text-xs text-gray-500">{info.getValue() || '-'}</span>,
              size: 110,
            }),
          ]
        : []),
      // --- DOKUMEN ---
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
      // --- AKSI ---
      columnHelper.display({
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => {
          const isPending = row.original.status === 'Pending';
          return (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleDetail(row.original)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                title="Lihat Detail"
              >
                <Eye className="w-3 h-3" />
              </button>
              {isPending && (
                <>
                  <button
                    onClick={() => handleApprovalClick(row.original, 'approve')}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-600 border border-emerald-200 rounded-md hover:bg-emerald-50 transition-colors"
                    title="Approve"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleApprovalClick(row.original, 'reject')}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
                    title="Tolak"
                  >
                    <XCircle className="w-3 h-3" />
                  </button>
                </>
              )}
              <button
                onClick={() => handleEdit(row.original)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
                title="Edit"
              >
                <Edit3 className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleDeleteConfirm(row.original.id)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
                title="Hapus"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          );
        },
        size: 160,
      }),
    ],
    [isTindakLanjutPage]
  );

  // Table instance
  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id,
    enableRowSelection: true,
    globalFilterFn: (row, _columnId, filterValue) => {
      const search = filterValue.toLowerCase();
      const d = row.original;
      return (
        d.nomorFakturPajak.toLowerCase().includes(search) ||
        d.nama.toLowerCase().includes(search) ||
        d.alamat.toLowerCase().includes(search) ||
        d.unitKerja.toLowerCase().includes(search)
      );
    },
  });

  // Handlers
  const handleEdit = useCallback((item: FakturPajakSetor) => {
    setEditingItem(item);
    setIsFormModalOpen(true);
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
    const selectedIds = Object.keys(rowSelection).filter((k) => rowSelection[k]);
    if (selectedIds.length > 0) {
      deleteMultiple(selectedIds);
      setRowSelection({});
      addToast(`${selectedIds.length} faktur berhasil dihapus`, 'success');
    }
    setIsBulkDeleteConfirmOpen(false);
  }, [rowSelection, deleteMultiple, addToast]);

  const handleApprovalClick = useCallback((faktur: FakturPajakSetor, action: 'approve' | 'reject') => {
    setApprovalFaktur(faktur);
    setApprovalAction(action);
    setIsApprovalModalOpen(true);
  }, []);

  const handleApprovalConfirm = useCallback((reason?: string) => {
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
  }, [approvalFaktur, approvalAction, approveFaktur, rejectFaktur, addToast, user]);

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

  const handleDetail = useCallback((faktur: FakturPajakSetor) => {
    setDetailFaktur(faktur);
    setIsDetailModalOpen(true);
  }, []);

  const selectedCount = Object.keys(rowSelection).filter((k) => rowSelection[k]).length;
  const selectedPendingCount = useMemo(() => {
    const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
    return selectedIds.filter((id) => data.find((d) => d.id === id)?.status === 'Pending').length;
  }, [rowSelection, data]);

  const columnGroupHeaders = [
    { label: '', colSpan: 6, className: '' }, // checkbox + No + Tipe + Tgl Pembayaran + No Faktur + Tgl Faktur
    { label: 'DATA FAKTUR PAJAK', colSpan: 5, className: 'bg-blue-50 text-blue-800 border-x border-blue-200' }, // NPWP Vendor + Nama Vendor + Alamat + DPP + PPN
    { label: 'DATA PENYAMPAI FAKTUR PAJAK', colSpan: 6, className: 'bg-amber-50 text-amber-800 border-x border-amber-200' },
    { label: '', colSpan: 4, className: '' }, // Status + Tgl Approve + PDF + Actions
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Faktur Setor"
          value={stats.totalFaktur}
          icon={<FileSpreadsheet className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Sudah Approve"
          value={stats.sudahApprove}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          label="Pending"
          value={stats.pending}
          icon={<Clock className="w-5 h-5" />}
          color="yellow"
        />
        <StatCard
          label="Total DPP + PPN"
          value={formatCurrency(stats.totalDppPpn)}
          icon={<DollarSign className="w-5 h-5" />}
          color="gray"
        />
      </div>

      {/* Table Card */}
      <div className="card">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {!isTindakLanjutPage && (
                <Button
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => {
                    setEditingItem(null);
                    setIsFormModalOpen(true);
                  }}
                >
                  Input Faktur Setor
                </Button>
              )}
              {/* <Button size="sm" variant="outline" leftIcon={<Upload className="w-4 h-4" />}>
                Upload File
              </Button> */}
              <Button size="sm" variant="outline" leftIcon={<Download className="w-4 h-4" />}>
                Export Excel
              </Button>
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

        {/* Table with horizontal scroll */}
        <div className="overflow-x-auto">
          <table className="w-max min-w-full">
            {/* Group Header Row */}
            <thead>
              <tr className="border-b border-gray-200">
                {columnGroupHeaders.map((g, idx) => (
                  <th
                    key={idx}
                    colSpan={g.colSpan}
                    className={cn(
                      'px-3 py-2 text-center text-[10px] font-bold uppercase tracking-widest',
                      g.className || 'bg-gray-50'
                    )}
                  >
                    {g.label}
                  </th>
                ))}
              </tr>

              {/* Column Header Row */}
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-gray-50/80 border-b border-gray-200">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap"
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
                          {header.column.getCanSort() && <ArrowUpDown className="w-3 h-3 text-gray-400" />}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}

              {/* Column Filter Row */}
              <tr className="bg-white border-b border-gray-100">
                {table.getAllLeafColumns().map((col) => (
                  <th key={col.id} className="px-3 py-1.5">
                    {col.id !== 'select' && col.id !== 'actions' && col.id !== 'no' ? (
                      <input
                        type="text"
                        placeholder="Filter..."
                        value={columnFilters[col.id] || ''}
                        onChange={(e) =>
                          setColumnFilters((prev) => ({ ...prev, [col.id]: e.target.value }))
                        }
                        className="w-full px-2 py-1 text-xs rounded border border-gray-200 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary"
                      />
                    ) : null}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`}>
                    {columns.map((_, colIdx) => (
                      <td key={`s-${idx}-${colIdx}`} className="px-3 py-3">
                        <div
                          className="h-4 bg-gray-200 rounded animate-pulse"
                          style={{ width: `${50 + Math.random() * 50}%` }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                        <Inbox className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">Data tidak ditemukan</p>
                      <p className="text-xs text-gray-400">
                        {globalFilter
                          ? `Tidak ada data sesuai pencarian "${globalFilter}"`
                          : isTindakLanjutPage
                          ? 'Belum ada data tindak lanjut faktur pajak setor.'
                          : 'Belum ada data. Klik "Input Faktur Setor" untuk menambahkan.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      'transition-colors',
                      row.original.status === 'Ditolak'
                        ? 'bg-red-50/60 hover:bg-red-50'
                        : row.original.status === 'Sudah Approve'
                        ? 'hover:bg-green-50/40'
                        : 'hover:bg-blue-50/40'
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn(
                          'px-3 py-2.5 text-sm text-gray-700 whitespace-nowrap',
                          cell.column.id === 'tanggalFaktur' && 'bg-yellow-50/60'
                        )}
                      >
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

      {/* Form Modal */}
      <FakturSetorFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingItem(null);
        }}
        initialData={editingItem}
        onSubmit={(formData) => {
          if (editingItem) {
            updateFaktur(editingItem.id, formData);
            addToast('Faktur berhasil diperbarui', 'success');
          } else {
            addFaktur(formData as Omit<FakturPajakSetor, 'id' | 'no' | 'createdAt' | 'updatedAt'>);
            addToast('Faktur berhasil ditambahkan', 'success');
          }
          setIsFormModalOpen(false);
          setEditingItem(null);
        }}
      />

      {/* Approval Modal */}
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

      {/* Detail Modal */}
      <DetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailFaktur(null);
        }}
        faktur={detailFaktur}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Faktur"
        message="Apakah Anda yakin ingin menghapus faktur ini?"
      />

      {/* Bulk Delete Confirm */}
      <ConfirmDialog
        isOpen={isBulkDeleteConfirmOpen}
        onClose={() => setIsBulkDeleteConfirmOpen(false)}
        onConfirm={handleBulkDelete}
        title="Hapus Data Terpilih"
        message={`Apakah Anda yakin ingin menghapus ${selectedCount} faktur yang dipilih?`}
      />

      {/* Bulk Approve Confirm */}
      <ConfirmDialog
        isOpen={isBulkApproveConfirmOpen}
        onClose={() => setIsBulkApproveConfirmOpen(false)}
        onConfirm={handleBulkApproveConfirm}
        title="Approve Massal"
        message={`Apakah Anda yakin ingin meng-approve ${selectedPendingCount} faktur yang dipilih?`}
        variant="success"
      />
    </div>
  );
};

// ============================================================
interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: FakturPajakSetor | null;
  onSubmit: (data: any) => void;
}

const FakturSetorFormModal: React.FC<FormModalProps> = ({ isOpen, onClose, initialData, onSubmit }) => {
  const { user } = useAuthStore();
  const [dokumen, setDokumen] = useState<DokumenPDF[]>([]);
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FakturSetorFormData>({
    resolver: zodResolver(fakturPajakSetorSchema),
    defaultValues: {
      tipeFA: 'TA',
      npwpVendor: '',
      namaVendor: '',
      nomorFakturPajak: '',
      tanggalFaktur: '',
      alamat: '',
      dpp: 0,
      ppn: 0,
      noAkunPerkiraanBiaya: '',
      noBP: '',
      badge: user?.badge || '',
      nama: user?.name || '',
      unitKerja: user?.unitKerja || '',
      noExtKantor: '1234',
      noWhatsapp: user?.hp || '081234567890',
      email: user?.email || 'user@pusri.co.id',
      noSELKamish: '',
      noVirtuSAP: '',
      status: 'Pending',
      keterangan: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          tipeFA: initialData.tipeFA,
          npwpVendor: initialData.npwpVendor || '',
          namaVendor: initialData.namaVendor || '',
          nomorFakturPajak: initialData.nomorFakturPajak,
          tanggalFaktur: initialData.tanggalFaktur,
          alamat: initialData.alamat,
          dpp: initialData.dpp,
          ppn: initialData.ppn,
          noAkunPerkiraanBiaya: initialData.noAkunPerkiraanBiaya,
          noBP: initialData.noBP,
          badge: initialData.badge,
          nama: initialData.nama,
          unitKerja: initialData.unitKerja,
          noExtKantor: initialData.noExtKantor,
          noWhatsapp: initialData.noWhatsapp,
          email: initialData.email,
          noSELKamish: initialData.noSELKamish || '',
          noVirtuSAP: initialData.noVirtuSAP || '',
          status: initialData.status,
          keterangan: initialData.keterangan || '',
        });
        setDokumen(initialData.dokumen || []);
      } else {
        reset({
          tipeFA: 'TA',
          npwpVendor: '',
          namaVendor: '',
          nomorFakturPajak: '',
          tanggalFaktur: '',
          alamat: '',
          dpp: 0,
          ppn: 0,
          noAkunPerkiraanBiaya: '',
          noBP: '',
          badge: user?.badge || '',
          nama: user?.name || '',
          unitKerja: user?.unitKerja || '',
          noExtKantor: '1234',
          noWhatsapp: user?.hp || '081234567890',
          email: user?.email || 'user@pusri.co.id',
          noSELKamish: '',
          noVirtuSAP: '',
          status: 'Pending',
          keterangan: '',
        });
        setDokumen([]);
      }
    }
  }, [isOpen, initialData, reset]);

  const inputClass = (hasError?: boolean) =>
    cn(
      'w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
      hasError ? 'border-red-300' : 'border-gray-300'
    );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Faktur Pajak Setor' : 'Input Faktur Pajak Setor'}
      size="xl"
    >
      <form onSubmit={handleSubmit((data) => {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        const tanggalPenyampaian = initialData?.tanggalPenyampaian || `${dd}/${mm}/${yyyy}`;
        const status = initialData?.status || 'Pending';
        onSubmit({...data, dokumen, tanggalPenyampaian, status});
      })} className="space-y-6">
        {/* Section 1 — Identitas Faktur */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800">📋 Identitas Faktur</h3>
          </div>
          <div className="p-4 space-y-4">
            {/* Tipe TA / Non TA */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Tipe Faktur *</label>
              <div className="flex items-center gap-4">
                <label
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-all text-sm font-medium',
                    watch('tipeFA') === 'TA'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  )}
                >
                  <input type="radio" value="TA" {...register('tipeFA')} className="accent-indigo-600 w-4 h-4" />
                  TA
                </label>
                <label
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-all text-sm font-medium',
                    watch('tipeFA') === 'Non TA'
                      ? 'border-orange-500 bg-orange-50 text-orange-700 ring-2 ring-orange-200'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  )}
                >
                  <input type="radio" value="Non TA" {...register('tipeFA')} className="accent-orange-600 w-4 h-4" />
                  Non TA
                </label>
              </div>
              {errors.tipeFA && <p className="mt-1 text-xs text-red-600">{errors.tipeFA.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nomor Faktur Pajak * <span className="text-gray-400">(16 digit)</span></label>
              <input type="text" placeholder="0000000000000000" className={cn(inputClass(!!errors.nomorFakturPajak), 'font-mono')} maxLength={16} {...register('nomorFakturPajak')} />
              {errors.nomorFakturPajak && <p className="mt-1 text-xs text-red-600">{errors.nomorFakturPajak.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tgl Faktur *</label>
              <input type="date" className={cn(inputClass(!!errors.tanggalFaktur), 'bg-yellow-50')} {...register('tanggalFaktur')} />
              {errors.tanggalFaktur && <p className="mt-1 text-xs text-red-600">{errors.tanggalFaktur.message}</p>}
            </div>
            </div>
          </div>
        </div>

        {/* Section 2 — Data Faktur Pajak */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-blue-50 px-4 py-2.5 border-b border-blue-200">
            <h3 className="text-sm font-semibold text-blue-800">💰 Data Faktur Pajak</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">NPWP Vendor *</label>
                <input type="text" placeholder="00.000.000.0-000.000" className={cn(inputClass(!!errors.npwpVendor), 'font-mono')} {...register('npwpVendor')} />
                {errors.npwpVendor && <p className="mt-1 text-xs text-red-600">{errors.npwpVendor.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nama Vendor *</label>
                <Controller
                  name="namaVendor"
                  control={control}
                  render={({ field }) => (
                    <VendorSearchInput
                      value={field.value}
                      onChange={field.onChange}
                      onVendorSelect={(vendor) => {
                        setValue('npwpVendor', vendor.npwp, { shouldValidate: true });
                        setValue('alamat', vendor.alamat, { shouldValidate: true });
                        setValue('noBP', vendor.noBP || '', { shouldValidate: true });
                      }}
                      placeholder="Cari vendor atau ketik manual"
                      className={inputClass(!!errors.namaVendor)}
                    />
                  )}
                />
                {errors.namaVendor && <p className="mt-1 text-xs text-red-600">{errors.namaVendor.message}</p>}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Alamat *</label>
              <textarea rows={2} placeholder="Alamat lengkap" className={cn(inputClass(!!errors.alamat), 'resize-none')} {...register('alamat')} />
              {errors.alamat && <p className="mt-1 text-xs text-red-600">{errors.alamat.message}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">DPP (Dasar Pengenaan Pajak) *</label>
                <Controller
                  name="dpp"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="text"
                      placeholder="0"
                      className={inputClass(!!errors.dpp)}
                      value={field.value ? formatCurrency(field.value).replace('Rp', '').trim() : ''}
                      onChange={(e) => {
                        const dppValue = parseCurrency(e.target.value);
                        field.onChange(dppValue);
                        setValue('ppn', Math.round(dppValue * 0.11), { shouldValidate: true });
                      }}
                    />
                  )}
                />
                {errors.dpp && <p className="mt-1 text-xs text-red-600">{errors.dpp.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">PPN 11% (Pajak Pertambahan Nilai) *</label>
                <Controller
                  name="ppn"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="text"
                      placeholder="0"
                      readOnly
                      className={cn(inputClass(!!errors.ppn), 'bg-gray-50 text-gray-600 cursor-not-allowed')}
                      value={field.value ? formatCurrency(field.value).replace('Rp', '').trim() : ''}
                    />
                  )}
                />
                {errors.ppn && <p className="mt-1 text-xs text-red-600">{errors.ppn.message}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3 — No Akun & BP */}
        {/* <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-emerald-50 px-4 py-2.5 border-b border-emerald-200">
            <h3 className="text-sm font-semibold text-emerald-800">🔢 No Akun & BP</h3>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">No. Akun Perkiraan Biaya *</label>
              <input type="text" placeholder="6XXXX.XX" className={inputClass(!!errors.noAkunPerkiraanBiaya)} {...register('noAkunPerkiraanBiaya')} />
              {errors.noAkunPerkiraanBiaya && <p className="mt-1 text-xs text-red-600">{errors.noAkunPerkiraanBiaya.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">No. BP / Perseroti *</label>
              <input type="text" placeholder="BP-XXXXXXX" className={inputClass(!!errors.noBP)} {...register('noBP')} />
              {errors.noBP && <p className="mt-1 text-xs text-red-600">{errors.noBP.message}</p>}
            </div>
          </div>
        </div> */}

        {/* Section 4 — Data Penyampai */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-amber-50 px-4 py-2.5 border-b border-amber-200">
            <h3 className="text-sm font-semibold text-amber-800">👤 Data Penyampai Faktur Pajak</h3>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Badge *</label>
              <input type="text" placeholder="1100XXX" className={inputClass(!!errors.badge)} {...register('badge')} />
              {errors.badge && <p className="mt-1 text-xs text-red-600">{errors.badge.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nama *</label>
              <input type="text" placeholder="Nama lengkap" className={inputClass(!!errors.nama)} {...register('nama')} />
              {errors.nama && <p className="mt-1 text-xs text-red-600">{errors.nama.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Unit Kerja *</label>
              <input type="text" placeholder="Unit kerja" className={inputClass(!!errors.unitKerja)} {...register('unitKerja')} />
              {errors.unitKerja && <p className="mt-1 text-xs text-red-600">{errors.unitKerja.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">No. Ext Kantor *</label>
              <input type="text" placeholder="XXXX" className={inputClass(!!errors.noExtKantor)} {...register('noExtKantor')} />
              {errors.noExtKantor && <p className="mt-1 text-xs text-red-600">{errors.noExtKantor.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">No. WhatsApp *</label>
              <input type="text" placeholder="08XXXXXXXXXX" className={inputClass(!!errors.noWhatsapp)} {...register('noWhatsapp')} />
              {errors.noWhatsapp && <p className="mt-1 text-xs text-red-600">{errors.noWhatsapp.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" placeholder="email@pusri.co.id" className={inputClass(!!errors.email)} {...register('email')} />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>
          </div>
        </div>

        {/* Section 5 — Nomor Referensi */}
        {/* <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800">🔗 Nomor Referensi</h3>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">No. SEL Kamish <span className="text-gray-400">(opsional)</span></label>
              <input type="text" placeholder="SEL-XXXX/KMS/YYYY" className={inputClass()} {...register('noSELKamish')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">No. Virtu SAP <span className="text-gray-400">(opsional)</span></label>
              <input type="text" placeholder="SAP-XXXXXXX" className={inputClass()} {...register('noVirtuSAP')} />
            </div>
          </div>
        </div> */}

        {/* Section 6 — Status & Keterangan */}
        {/* <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800">📝 Status & Keterangan</h3>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status *</label>
              <select className={inputClass(!!errors.status)} {...register('status')}>
                <option value="Pending">Pending</option>
                <option value="Sudah Approve">Sudah Approve</option>
                <option value="Ditolak">Ditolak</option>
              </select>
              {errors.status && <p className="mt-1 text-xs text-red-600">{errors.status.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Keterangan <span className="text-gray-400">(opsional)</span></label>
              <textarea rows={2} placeholder="Catatan tambahan" className={cn(inputClass(), 'resize-none')} {...register('keterangan')} />
            </div>
          </div>
        </div> */}

        {/* Section 7 — Dokumen Pendukung */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800">📎 Dokumen Pendukung</h3>
          </div>
          <div className="p-4">
            <DokumenUploader value={dokumen} onChange={setDokumen} maxFiles={5} maxSizeMB={10} />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
            {initialData ? 'Simpan Perubahan' : 'Simpan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ============================================================
// ApprovalModal
// ============================================================
interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  faktur: FakturPajakSetor | null;
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
              {isApprove ? 'Approve Faktur Pajak Setor' : 'Tolak Faktur Pajak Setor'}
            </p>
            <p className="text-xs text-gray-500">
              {isApprove
                ? 'Faktur akan disetujui dan statusnya berubah menjadi "Sudah Approve"'
                : 'Faktur akan ditolak dan statusnya berubah menjadi "Ditolak"'}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-100">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">No Faktur Pajak</p>
              <p className="font-mono font-medium text-gray-900">{faktur.nomorFakturPajak}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Nama</p>
              <p className="font-medium text-gray-900">{faktur.nama}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">DPP</p>
              <p className="font-semibold text-gray-900">{formatCurrency(faktur.dpp)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Nilai PPN</p>
              <p className="font-semibold text-gray-900">{formatCurrency(faktur.ppn)}</p>
            </div>
          </div>
        </div>

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
// DetailModal
// ============================================================
interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  faktur: FakturPajakSetor | null;
}

const DetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, faktur }) => {
  if (!faktur) return null;

  const statusVariant = faktur.status === 'Sudah Approve' ? 'success' : faktur.status === 'Pending' ? 'warning' : 'danger';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detail Faktur Pajak Setor" size="lg">
      <div className="space-y-5">
        <div
          className={cn(
            'flex items-center gap-3 p-4 rounded-lg border',
            faktur.status === 'Sudah Approve' && 'bg-emerald-50 border-emerald-200',
            faktur.status === 'Pending' && 'bg-amber-50 border-amber-200',
            faktur.status === 'Ditolak' && 'bg-red-50 border-red-200'
          )}
        >
          {faktur.status === 'Sudah Approve' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
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

        {faktur.status === 'Ditolak' && faktur.rejectionReason && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs font-semibold text-red-700 mb-1">Alasan Penolakan:</p>
            <p className="text-sm text-red-800">{faktur.rejectionReason}</p>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <DetailField label="Tipe FA" value={faktur.tipeFA} bold />
            <DetailField label="No Faktur Pajak" value={faktur.nomorFakturPajak} mono />
            <DetailField label="Tanggal Penyampaian" value={faktur.tanggalPenyampaian} />
            <DetailField label="Tanggal Faktur" value={faktur.tanggalFaktur} />
            <div className="md:col-span-2">
              <DetailField label="Alamat" value={faktur.alamat} />
            </div>
            <DetailField label="DPP" value={formatCurrency(faktur.dpp)} bold />
            <DetailField label="PPN" value={formatCurrency(faktur.ppn)} bold />
            <DetailField label="No Akun Perkiraan Biaya" value={faktur.noAkunPerkiraanBiaya || '-'} />
            <DetailField label="No BP" value={faktur.noBP || '-'} />
            <DetailField label="Badge (Nama)" value={`${faktur.badge} (${faktur.nama})`} />
            <DetailField label="Unit Kerja" value={faktur.unitKerja} />
            <DetailField label="Kontak" value={`${faktur.email} / ${faktur.noWhatsapp}`} />
            <DetailField label="No Ext Kantor" value={faktur.noExtKantor || '-'} />
            <DetailField label="No SEL Kamish" value={faktur.noSELKamish || '-'} />
            <DetailField label="No Virtu SAP" value={faktur.noVirtuSAP || '-'} />
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
// CONFIRM DIALOG
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

export default FakturPajakSetorPage;
