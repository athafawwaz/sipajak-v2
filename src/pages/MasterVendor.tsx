import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Edit3,
  Trash2,
  Search,
  ArrowUpDown,
  Inbox,
  Eye,
  Truck,
  Building2,
  BadgeCheck,
  AlertTriangle,
  FileCheck2,
  FileX2,
} from 'lucide-react';

import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import StatCard from '../components/ui/StatCard';
import Pagination from '../components/ui/Pagination';
import { useMasterVendorStore } from '../store/masterVendorStore';
import { useToastStore } from '../store/toastStore';
import type { MasterVendor, VendorType } from '../types';
import { cn } from '../utils/cn';

const vendorSchema = z.object({
  kodeVendor: z.string().min(1, 'Kode vendor wajib diisi'),
  namaVendor: z.string().min(1, 'Nama vendor wajib diisi'),
  npwp: z.string().min(1, 'NPWP wajib diisi'),
  alamat: z.string().min(1, 'Alamat wajib diisi'),
  tipeVendor: z.enum(['PKP', 'Non PKP']),
  noBP: z.string().optional(),
  pic: z.string().min(1, 'PIC wajib diisi'),
  noTelp: z.string().min(1, 'No. telepon wajib diisi'),
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  status: z.enum(['Aktif', 'Nonaktif']),
});

type VendorFormData = z.infer<typeof vendorSchema>;

const columnHelper = createColumnHelper<MasterVendor>();

const vendorTypeBadgeVariant: Record<VendorType, 'success' | 'warning'> = {
  PKP: 'success',
  'Non PKP': 'warning',
};

const MasterVendorPage: React.FC = () => {
  const { data, isLoading, addVendor, updateVendor, deleteVendor, setLoading } = useMasterVendorStore();
  const addToast = useToastStore((s) => s.addToast);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<MasterVendor | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailVendor, setDetailVendor] = useState<MasterVendor | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setGlobalFilter(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, [setLoading]);

  const stats = useMemo(() => {
    const totalVendor = data.length;
    const pkp = data.filter((vendor) => vendor.tipeVendor === 'PKP').length;
    const nonPkp = data.filter((vendor) => vendor.tipeVendor === 'Non PKP').length;
    const aktif = data.filter((vendor) => vendor.status === 'Aktif').length;

    return { totalVendor, pkp, nonPkp, aktif };
  }, [data]);

  const VendorTypeBadge = useCallback(({ tipeVendor }: { tipeVendor: VendorType }) => {
    return <Badge variant={vendorTypeBadgeVariant[tipeVendor]}>{tipeVendor}</Badge>;
  }, []);

  const StatusBadge = useCallback(({ status }: { status: MasterVendor['status'] }) => {
    return <Badge variant={status === 'Aktif' ? 'success' : 'danger'}>{status}</Badge>;
  }, []);

  const columns = useMemo(
    () => [
      columnHelper.accessor('kodeVendor', {
        header: 'Kode Vendor',
        cell: (info) => (
          <span className="text-xs font-normal text-primary bg-primary/5 px-2 py-1 rounded">
            {info.getValue()}
          </span>
        ),
        size: 130,
      }),
      columnHelper.accessor('namaVendor', {
        header: 'Nama Vendor',
        cell: (info) => <span className="text-gray-900">{info.getValue()}</span>,
        size: 230,
      }),
      columnHelper.accessor('npwp', {
        header: 'NPWP',
        cell: (info) => <span className="text-xs text-gray-700">{info.getValue()}</span>,
        size: 180,
      }),
      columnHelper.accessor('tipeVendor', {
        header: 'Tipe',
        cell: (info) => <VendorTypeBadge tipeVendor={info.getValue()} />,
        size: 120,
      }),
      columnHelper.accessor('noBP', {
        header: 'No BP',
        cell: (info) => <span className="text-xs text-gray-600">{info.getValue() || '-'}</span>,
        size: 120,
      }),
      columnHelper.accessor('pic', {
        header: 'PIC',
        cell: (info) => <span className="text-gray-700">{info.getValue()}</span>,
        size: 160,
      }),
      columnHelper.accessor('noTelp', {
        header: 'No. Telepon',
        cell: (info) => <span className="text-xs text-gray-600">{info.getValue()}</span>,
        size: 150,
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        cell: (info) => <span className="text-gray-600">{info.getValue()}</span>,
        size: 220,
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => <StatusBadge status={info.getValue()} />,
        size: 110,
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleDetail(row.original)}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
              title="Lihat Detail"
            >
              <Eye className="w-3 h-3" />
            </button>
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
        ),
        size: 140,
      }),
    ],
    [StatusBadge, VendorTypeBadge]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id,
  });

  const handleEdit = useCallback((vendor: MasterVendor) => {
    setEditingVendor(vendor);
    setIsEditModalOpen(true);
  }, []);

  const handleDetail = useCallback((vendor: MasterVendor) => {
    setDetailVendor(vendor);
    setIsDetailModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback((id: string) => {
    setDeletingId(id);
    setIsDeleteConfirmOpen(true);
  }, []);

  const handleDelete = useCallback(() => {
    if (!deletingId) return;

    deleteVendor(deletingId);
    addToast('Vendor berhasil dihapus', 'success');
    setIsDeleteConfirmOpen(false);
    setDeletingId(null);
  }, [deletingId, deleteVendor, addToast]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 border-l-4 border-primary pl-3">Master Data Vendor</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola direktori vendor, status PKP, dan informasi kontak penagihan</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Vendor" value={stats.totalVendor} icon={<Truck className="w-5 h-5" />} color="blue" />
        <StatCard label="Vendor PKP" value={stats.pkp} icon={<FileCheck2 className="w-5 h-5" />} color="green" />
        <StatCard label="Vendor Non PKP" value={stats.nonPkp} icon={<FileX2 className="w-5 h-5" />} color="yellow" />
        <StatCard label="Vendor Aktif" value={stats.aktif} icon={<BadgeCheck className="w-5 h-5" />} color="gray" />
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsAddModalOpen(true)}>
                Tambah Vendor
              </Button>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari vendor..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <React.Fragment key={headerGroup.id}>
                  <tr className="bg-gray-50/80">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-xs font-normal text-gray-600 uppercase tracking-wider whitespace-nowrap"
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
                <tr>
                  <td colSpan={columns.length} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                        <Inbox className="w-8 h-8 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-normal text-gray-600">Data tidak ditemukan</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {globalFilter
                            ? `Tidak ada data yang sesuai dengan pencarian "${globalFilter}"`
                            : 'Belum ada data vendor. Klik "Tambah Vendor" untuk menambahkan.'}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-blue-50/40 transition-colors">
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

      <VendorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Vendor Baru"
        onSubmit={(formData) => {
          addVendor(formData);
          setIsAddModalOpen(false);
          addToast('Vendor berhasil ditambahkan', 'success');
        }}
      />

      <VendorModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingVendor(null);
        }}
        title="Edit Vendor"
        initialData={editingVendor}
        onSubmit={(formData) => {
          if (!editingVendor) return;
          updateVendor(editingVendor.id, formData);
          setIsEditModalOpen(false);
          setEditingVendor(null);
          addToast('Vendor berhasil diperbarui', 'success');
        }}
      />

      <DetailVendorModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailVendor(null);
        }}
        vendor={detailVendor}
      />

      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Vendor"
        message="Apakah Anda yakin ingin menghapus vendor ini?"
      />
    </div>
  );
};

interface VendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  initialData?: MasterVendor | null;
  onSubmit: (data: VendorFormData) => void;
}

const VendorModal: React.FC<VendorModalProps> = ({ isOpen, onClose, title, initialData, onSubmit }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      kodeVendor: '',
      namaVendor: '',
      npwp: '',
      alamat: '',
      tipeVendor: 'PKP',
      noBP: '',
      pic: '',
      noTelp: '',
      email: '',
      status: 'Aktif',
    },
  });

  useEffect(() => {
    if (isOpen && initialData) {
      reset({
        kodeVendor: initialData.kodeVendor,
        namaVendor: initialData.namaVendor,
        npwp: initialData.npwp,
        alamat: initialData.alamat,
        tipeVendor: initialData.tipeVendor,
        noBP: initialData.noBP || '',
        pic: initialData.pic,
        noTelp: initialData.noTelp,
        email: initialData.email,
        status: initialData.status,
      });
    } else if (isOpen) {
      reset({
        kodeVendor: '',
        namaVendor: '',
        npwp: '',
        alamat: '',
        tipeVendor: 'PKP',
        noBP: '',
        pic: '',
        noTelp: '',
        email: '',
        status: 'Aktif',
      });
    }
  }, [isOpen, initialData, reset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Kode Vendor *" error={errors.kodeVendor?.message}>
            <input className={inputClass(!!errors.kodeVendor)} placeholder="VND-001" {...register('kodeVendor')} />
          </FormField>

          <FormField label="Nama Vendor *" error={errors.namaVendor?.message}>
            <input className={inputClass(!!errors.namaVendor)} placeholder="Nama vendor" {...register('namaVendor')} />
          </FormField>

          <FormField label="NPWP *" error={errors.npwp?.message}>
            <input className={inputClass(!!errors.npwp)} placeholder="00.000.000.0-000.000" {...register('npwp')} />
          </FormField>

          <FormField label="Tipe Vendor *" error={errors.tipeVendor?.message}>
            <select className={inputClass(!!errors.tipeVendor)} {...register('tipeVendor')}>
              <option value="PKP">PKP</option>
              <option value="Non PKP">Non PKP</option>
            </select>
          </FormField>

          <FormField label="No BP" error={errors.noBP?.message}>
            <input className={inputClass(!!errors.noBP)} placeholder="BP-100120" {...register('noBP')} />
          </FormField>

          <FormField label="Status *" error={errors.status?.message}>
            <select className={inputClass(!!errors.status)} {...register('status')}>
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </FormField>

          <FormField label="PIC *" error={errors.pic?.message}>
            <input className={inputClass(!!errors.pic)} placeholder="Nama PIC" {...register('pic')} />
          </FormField>

          <FormField label="No. Telepon *" error={errors.noTelp?.message}>
            <input className={inputClass(!!errors.noTelp)} placeholder="021-123456" {...register('noTelp')} />
          </FormField>

          <FormField label="Email *" error={errors.email?.message}>
            <input type="email" className={inputClass(!!errors.email)} placeholder="billing@vendor.co.id" {...register('email')} />
          </FormField>

          <div className="md:col-span-2">
            <FormField label="Alamat *" error={errors.alamat?.message}>
              <textarea
                rows={3}
                className={cn(inputClass(!!errors.alamat), 'resize-none')}
                placeholder="Alamat lengkap vendor"
                {...register('alamat')}
              />
            </FormField>
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

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({ label, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
    {children}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

const inputClass = (hasError: boolean) =>
  cn(
    'w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
    hasError ? 'border-red-300' : 'border-gray-300'
  );

interface DetailVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: MasterVendor | null;
}

const DetailVendorModal: React.FC<DetailVendorModalProps> = ({ isOpen, onClose, vendor }) => {
  if (!vendor) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detail Vendor" size="lg">
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="p-2.5 rounded-lg bg-blue-100">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-normal text-blue-950">{vendor.namaVendor}</p>
            <p className="text-xs text-blue-700">
              {vendor.kodeVendor} - {vendor.tipeVendor}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <DetailField label="Kode Vendor" value={vendor.kodeVendor} />
          <DetailField label="Nama Vendor" value={vendor.namaVendor} bold />
          <DetailField label="NPWP" value={vendor.npwp} />
          <DetailField label="Tipe Vendor" value={vendor.tipeVendor} />
          <DetailField label="No BP" value={vendor.noBP || '-'} />
          <DetailField label="Status" value={vendor.status} />
          <DetailField label="PIC" value={vendor.pic} />
          <DetailField label="No. Telepon" value={vendor.noTelp} />
          <DetailField label="Email" value={vendor.email} />
          <div className="md:col-span-2">
            <DetailField label="Alamat" value={vendor.alamat} />
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

interface DetailFieldProps {
  label: string;
  value: string;
  bold?: boolean;
}

const DetailField: React.FC<DetailFieldProps> = ({ label, value, bold }) => (
  <div className="rounded-lg border border-gray-100 bg-gray-50/70 p-3">
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className={cn('text-sm text-gray-900 break-words', bold && 'font-normal')}>
      {value || '-'}
    </p>
  </div>
);

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, onClose, onConfirm, title, message }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-red-700">{message}</p>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Hapus
        </Button>
      </div>
    </div>
  </Modal>
);

export default MasterVendorPage;
