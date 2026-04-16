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
  Settings,
  ArrowUpDown,
  Inbox,
  AlertTriangle,
  Shield,
  ToggleLeft,
  ToggleRight,
  Eye,
  Hash,
  FileText,
} from 'lucide-react';

import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import StatCard from '../components/ui/StatCard';
import Pagination from '../components/ui/Pagination';
import { useUnitKerjaStore, ALL_MENU_ITEMS } from '../store/unitKerjaStore';
import { useToastStore } from '../store/toastStore';
import type { UnitKerja, MenuKey } from '../types';
import { cn } from '../utils/cn';

// --- Zod Schema ---
const unitKerjaSchema = z.object({
  kode: z
    .string()
    .min(1, 'Kode wajib diisi')
    .regex(/^[A-Z0-9-]+$/, 'Kode hanya boleh huruf besar, angka, dan tanda strip'),
  nama: z.string().min(1, 'Nama wajib diisi'),
  deskripsi: z.string().optional(),
});

type UnitKerjaFormData = z.infer<typeof unitKerjaSchema>;

// --- Column Helper ---
const columnHelper = createColumnHelper<UnitKerja>();

// --- Component ---
const MasterUnitKerja: React.FC = () => {
  const { data, isLoading, addUnitKerja, updateUnitKerja, deleteUnitKerja, setLoading } =
    useUnitKerjaStore();
  const addToast = useToastStore((s) => s.addToast);

  // State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitKerja | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [permissionUnit, setPermissionUnit] = useState<UnitKerja | null>(null);
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
    const totalMenus = ALL_MENU_ITEMS.length;
    const totalActivePermissions = data.reduce(
      (sum, uk) => sum + uk.menuPermissions.filter((p) => p.enabled).length,
      0
    );
    return { totalUnit, totalMenus, totalActivePermissions };
  }, [data]);

  // --- Table columns ---
  const columns = useMemo(
    () => [
      columnHelper.accessor('kode', {
        header: 'Kode',
        cell: (info) => (
          <span className="font-mono text-xs font-semibold text-primary bg-primary/5 px-2 py-1 rounded">
            {info.getValue()}
          </span>
        ),
        size: 120,
      }),
      columnHelper.accessor('nama', {
        header: 'Nama Unit Kerja',
        cell: (info) => <span className="font-medium text-gray-900">{info.getValue()}</span>,
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
        id: 'menuAccess',
        header: 'Akses Menu',
        cell: ({ row }) => {
          const enabledCount = row.original.menuPermissions.filter((p) => p.enabled).length;
          const totalCount = row.original.menuPermissions.length;
          return (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      enabledCount === totalCount
                        ? 'bg-emerald-500'
                        : enabledCount > 0
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    )}
                    style={{ width: `${(enabledCount / totalCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {enabledCount}/{totalCount}
                </span>
              </div>
            </div>
          );
        },
        size: 140,
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
              onClick={() => handlePermissions(row.original)}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-600 border border-purple-200 rounded-md hover:bg-purple-50 transition-colors"
              title="Atur Akses Menu"
            >
              <Settings className="w-3 h-3" />
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
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
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

  const handlePermissions = useCallback((unit: UnitKerja) => {
    setPermissionUnit(unit);
    setIsPermissionModalOpen(true);
  }, []);

  const handleDetail = useCallback((unit: UnitKerja) => {
    setDetailUnit(unit);
    setIsDetailModalOpen(true);
  }, []);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Unit Kerja"
          value={stats.totalUnit}
          icon={<Building2 className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Total Menu"
          value={stats.totalMenus}
          icon={<FileText className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          label="Total Akses Aktif"
          value={stats.totalActivePermissions}
          icon={<Shield className="w-5 h-5" />}
          color="yellow"
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
                <tr key={headerGroup.id} className="bg-gray-50/80">
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
                        <p className="text-sm font-medium text-gray-600">Data tidak ditemukan</p>
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
            menuPermissions: ALL_MENU_ITEMS.map((item) => ({
              key: item.key,
              label: item.label,
              enabled: false,
            })),
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

      {/* Permission Modal */}
      <PermissionModal
        isOpen={isPermissionModalOpen}
        onClose={() => {
          setIsPermissionModalOpen(false);
          setPermissionUnit(null);
        }}
        unitKerja={permissionUnit}
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
        message="Apakah Anda yakin ingin menghapus unit kerja ini? Semua konfigurasi akses menu akan ikut terhapus."
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
    defaultValues: { kode: '', nama: '', deskripsi: '' },
  });

  useEffect(() => {
    if (isOpen && initialData) {
      reset({
        kode: initialData.kode,
        nama: initialData.nama,
        deskripsi: initialData.deskripsi || '',
      });
    } else if (isOpen) {
      reset({ kode: '', nama: '', deskripsi: '' });
    }
  }, [isOpen, initialData, reset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Kode */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
            <Hash className="w-3.5 h-3.5 text-gray-400" />
            Kode Unit Kerja *
          </label>
          <input
            type="text"
            placeholder="DEP-XXX"
            className={cn(
              'w-full rounded-lg border px-3.5 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
              errors.kode ? 'border-red-300' : 'border-gray-300'
            )}
            {...register('kode')}
          />
          {errors.kode && <p className="mt-1 text-xs text-red-600">{errors.kode.message}</p>}
        </div>

        {/* Nama */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
            <Building2 className="w-3.5 h-3.5 text-gray-400" />
            Nama Unit Kerja *
          </label>
          <input
            type="text"
            placeholder="Nama unit kerja"
            className={cn(
              'w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
              errors.nama ? 'border-red-300' : 'border-gray-300'
            )}
            {...register('nama')}
          />
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
// PermissionModal — Toggle menu access per unit kerja
// ============================================================
interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  unitKerja: UnitKerja | null;
}

const PermissionModal: React.FC<PermissionModalProps> = ({ isOpen, onClose, unitKerja }) => {
  const { toggleMenuPermission } = useUnitKerjaStore();
  const addToast = useToastStore((s) => s.addToast);

  // Re-read from store to reflect latest toggled state
  const currentUnit = useUnitKerjaStore((s) =>
    unitKerja ? s.data.find((u) => u.id === unitKerja.id) : undefined
  );

  if (!unitKerja || !currentUnit) return null;

  const handleToggle = (menuKey: MenuKey) => {
    toggleMenuPermission(currentUnit.id, menuKey);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pengaturan Akses Menu" size="md">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-100">
          <div className="p-2.5 rounded-lg bg-purple-100">
            <Settings className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-purple-900">{currentUnit.nama}</p>
            <p className="text-xs text-purple-600">{currentUnit.kode}</p>
          </div>
        </div>

        {/* Menu Toggle List */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
            Submenu yang dapat diakses
          </p>
          {currentUnit.menuPermissions.map((perm) => (
            <div
              key={perm.key}
              className={cn(
                'flex items-center justify-between p-3.5 rounded-lg border transition-all cursor-pointer',
                perm.enabled
                  ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              )}
              onClick={() => handleToggle(perm.key)}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    perm.enabled ? 'bg-emerald-100' : 'bg-gray-100'
                  )}
                >
                  <Shield
                    className={cn(
                      'w-4 h-4',
                      perm.enabled ? 'text-emerald-600' : 'text-gray-400'
                    )}
                  />
                </div>
                <div>
                  <p
                    className={cn(
                      'text-sm font-medium',
                      perm.enabled ? 'text-emerald-900' : 'text-gray-600'
                    )}
                  >
                    {perm.label}
                  </p>
                  <p className="text-[11px] text-gray-400">/{perm.key}</p>
                </div>
              </div>

              <div>
                {perm.enabled ? (
                  <ToggleRight className="w-7 h-7 text-emerald-500" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-gray-300" />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={() => {
              addToast(`Akses menu ${currentUnit.nama} berhasil diperbarui`, 'success');
              onClose();
            }}
          >
            Selesai
          </Button>
        </div>
      </div>
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
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Kode</p>
              <p className="font-mono font-semibold text-gray-900">{unitKerja.kode}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Nama</p>
              <p className="font-medium text-gray-900">{unitKerja.nama}</p>
            </div>
            {unitKerja.deskripsi && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-0.5">Deskripsi</p>
                <p className="text-gray-700">{unitKerja.deskripsi}</p>
              </div>
            )}
          </div>
        </div>

        {/* Menu Access Summary */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
            Akses Menu
          </p>
          <div className="grid grid-cols-1 gap-2">
            {unitKerja.menuPermissions.map((perm) => (
              <div
                key={perm.key}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100"
              >
                <span className="text-sm text-gray-700">{perm.label}</span>
                <Badge variant={perm.enabled ? 'success' : 'danger'}>
                  {perm.enabled ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </div>
            ))}
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
