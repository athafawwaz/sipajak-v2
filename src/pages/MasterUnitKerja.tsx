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
  Building2,
  ArrowUpDown,
  Inbox,
  AlertTriangle,
  Eye,
} from 'lucide-react';

import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import StatCard from '../components/ui/StatCard';
import Pagination from '../components/ui/Pagination';
import { useUnitKerjaStore } from '../store/unitKerjaStore';
import { useToastStore } from '../store/toastStore';
import type { UnitKerja } from '../types';
import { cn } from '../utils/cn';

// --- Zod Schema ---
const unitKerjaSchema = z.object({
  nama: z.string().min(1, 'Nama wajib diisi'),
  deskripsi: z.string().optional(),
});

type UnitKerjaFormData = z.infer<typeof unitKerjaSchema>;

// --- Dummy Available Units ---
const AVAILABLE_UNITS = [
  'DEPARTEMEN TEKNOLOGI INFORMASI',
  'DEPARTEMEN KEUANGAN',
  'DEPARTEMEN SDM',
  'DEPARTEMEN PRODUKSI',
  'DEPARTEMEN PEMASARAN',
  'DIVISI OPERASI (OPERASI P-VI)',
  'DEPARTEMEN PENGADAAN',
  'DEPARTEMEN HUKUM',
  'DEPARTEMEN AUDIT INTERNAL',
];

// --- Column Helper ---
const columnHelper = createColumnHelper<UnitKerja>();

// --- Component ---
const MasterUnitKerja: React.FC = () => {
  const { data, isLoading, addUnitKerja, updateUnitKerja, deleteUnitKerja, setLoading } =
    useUnitKerjaStore();
  const addToast = useToastStore((s) => s.addToast);

  // State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitKerja | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailUnit, setDetailUnit] = useState<UnitKerja | null>(null);

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

  // --- Stats ---
  const stats = useMemo(() => {
    const totalUnit = data.length;
    return { totalUnit };
  }, [data]);

  // --- Table columns ---
  const columns = useMemo(
    () => [

      columnHelper.accessor('nama', {
        header: 'Nama Unit Kerja',
        cell: (info) => <span className="text-gray-900">{info.getValue()}</span>,
        size: 250,
      }),
      columnHelper.accessor('deskripsi', {
        header: 'Deskripsi',
        cell: (info) => (
          <span className="text-gray-500 text-sm">{info.getValue() || '-'}</span>
        ),
        size: 300,
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
        size: 200,
      }),
    ],
    []
  );

  // --- Table instance ---
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

  // --- Handlers ---
  const handleEdit = useCallback((unit: UnitKerja) => {
    setEditingUnit(unit);
    setIsEditModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback((id: string) => {
    setDeletingId(id);
    setIsDeleteConfirmOpen(true);
  }, []);

  const handleDelete = useCallback(() => {
    if (deletingId) {
      deleteUnitKerja(deletingId);
      addToast('Unit kerja berhasil dihapus', 'success');
      setIsDeleteConfirmOpen(false);
      setDeletingId(null);
    }
  }, [deletingId, deleteUnitKerja, addToast]);



  const handleDetail = useCallback((unit: UnitKerja) => {
    setDetailUnit(unit);
    setIsDetailModalOpen(true);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 border-l-4 border-primary pl-3">Master Data unit kerja</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola data unit kerja dan pengaturan akses menu Faktur Pajak</p>
        </div>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Unit Kerja"
          value={stats.totalUnit}
          icon={<Building2 className="w-5 h-5" />}
          color="blue"
        />

      </div>

      {/* Table Card */}
      <div className="card">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setIsAddModalOpen(true)}
              >
                Tambah Unit Kerja
              </Button>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari unit kerja..."
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
                        className="px-4 py-3 text-left text-xs font-normal text-gray-600 uppercase tracking-wider whitespace-nowrap"
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={cn(
                              'flex items-center gap-1',
                              header.column.getCanSort() &&
                                'cursor-pointer select-none hover:text-gray-900'
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
                        <div
                          className="h-4 bg-gray-200 rounded animate-pulse"
                          style={{ width: `${60 + Math.random() * 40}%` }}
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
                      <div>
                        <p className="text-sm font-normal text-gray-600">Data tidak ditemukan</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {globalFilter
                            ? `Tidak ada data yang sesuai dengan pencarian "${globalFilter}"`
                            : 'Belum ada data unit kerja. Klik "Tambah Unit Kerja" untuk menambahkan.'}
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

      {/* Add Modal */}
      <UnitKerjaModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Unit Kerja Baru"
        onSubmit={(formData) => {
          addUnitKerja({
            ...formData,
          });
          setIsAddModalOpen(false);
          addToast('Unit kerja berhasil ditambahkan', 'success');
        }}
      />

      {/* Edit Modal */}
      <UnitKerjaModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingUnit(null);
        }}
        title="Edit Unit Kerja"
        initialData={editingUnit}
        onSubmit={(formData) => {
          if (editingUnit) {
            updateUnitKerja(editingUnit.id, formData);
            setIsEditModalOpen(false);
            setEditingUnit(null);
            addToast('Unit kerja berhasil diperbarui', 'success');
          }
        }}
      />



      {/* Detail Modal */}
      <DetailUnitModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailUnit(null);
        }}
        unitKerja={detailUnit}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Unit Kerja"
        message="Apakah Anda yakin ingin menghapus unit kerja ini?"
      />
    </div>
  );
};

// ============================================================
// UnitKerjaModal — Add / Edit form
// ============================================================
interface UnitKerjaModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  initialData?: UnitKerja | null;
  onSubmit: (data: UnitKerjaFormData) => void;
}

const UnitKerjaModal: React.FC<UnitKerjaModalProps> = ({
  isOpen,
  onClose,
  title,
  initialData,
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UnitKerjaFormData>({
    resolver: zodResolver(unitKerjaSchema),
    defaultValues: { nama: '', deskripsi: '' },
  });

  useEffect(() => {
    if (isOpen && initialData) {
      reset({
        nama: initialData.nama,
        deskripsi: initialData.deskripsi || '',
      });
    } else if (isOpen) {
      reset({ nama: '', deskripsi: '' });
    }
  }, [isOpen, initialData, reset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">


        {/* Nama */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
            <Building2 className="w-3.5 h-3.5 text-gray-400" />
            Nama Unit Kerja *
          </label>
          <select
            className={cn(
              'w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none bg-white',
              errors.nama ? 'border-red-300' : 'border-gray-300'
            )}
            {...register('nama')}
          >
            <option value="">Pilih Unit Kerja</option>
            {AVAILABLE_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
          {errors.nama && <p className="mt-1 text-xs text-red-600">{errors.nama.message}</p>}
        </div>

        {/* Deskripsi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Deskripsi
          </label>
          <textarea
            rows={3}
            placeholder="Deskripsi singkat unit kerja (opsional)"
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
            {...register('deskripsi')}
          />
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
// DetailUnitModal — Read-only detail view
// ============================================================
interface DetailUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  unitKerja: UnitKerja | null;
}

const DetailUnitModal: React.FC<DetailUnitModalProps> = ({ isOpen, onClose, unitKerja }) => {
  if (!unitKerja) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detail Unit Kerja" size="md">
      <div className="space-y-5">
        {/* Unit Info */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="col-span-2">
              <p className="text-xs text-gray-500 mb-0.5">Nama Unit Kerja</p>
              <p className="font-normal text-gray-900">{unitKerja.nama}</p>
            </div>
            {unitKerja.deskripsi && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-0.5">Deskripsi</p>
                <p className="text-gray-700">{unitKerja.deskripsi}</p>
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

// ============================================================
// ConfirmDialog
// ============================================================
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-sm text-gray-600 pt-2">{message}</p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Ya, Hapus
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default MasterUnitKerja;
