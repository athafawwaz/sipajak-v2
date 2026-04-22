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
  Users,
  UserCheck,
  ShieldCheck,
  Wallet,
  AlertTriangle,
  BadgeCheck,
} from 'lucide-react';

import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import StatCard from '../components/ui/StatCard';
import Pagination from '../components/ui/Pagination';
import { useMasterUserStore } from '../store/masterUserStore';
import { useToastStore } from '../store/toastStore';
import type { MasterUser, UserRole } from '../types';
import { cn } from '../utils/cn';

const userSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  jabatan: z.string().min(1, 'Jabatan wajib diisi'),
  unitKerja: z.string().min(1, 'Unit kerja wajib diisi'),
  noTelp: z.string().min(1, 'No. telepon wajib diisi'),
  role: z.enum(['requester', 'vp', 'keuangan', 'admin']),
  badge: z
    .string()
    .min(1, 'Badge wajib diisi')
    .regex(/^6\d{6}$/, 'Badge Pusri diawali angka 6 dan total 7 digit'),
  hp: z.string().min(1, 'No. HP wajib diisi'),
  status: z.enum(['Aktif', 'Nonaktif']),
});

type UserFormData = z.infer<typeof userSchema>;

const columnHelper = createColumnHelper<MasterUser>();

const roleLabels: Record<UserRole, string> = {
  requester: 'User Unit Kerja',
  vp: 'VP',
  keuangan: 'Keuangan',
  admin: 'Admin',
};

const roleBadgeVariant: Record<UserRole, 'info' | 'purple' | 'success' | 'default'> = {
  requester: 'info',
  vp: 'purple',
  keuangan: 'success',
  admin: 'default',
};

const MasterUserPage: React.FC = () => {
  const { data, isLoading, addUser, updateUser, deleteUser, setLoading } = useMasterUserStore();
  const addToast = useToastStore((s) => s.addToast);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<MasterUser | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<MasterUser | null>(null);
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
    const totalUser = data.length;
    const requester = data.filter((user) => user.role === 'requester').length;
    const vp = data.filter((user) => user.role === 'vp').length;
    const keuangan = data.filter((user) => user.role === 'keuangan').length;
    return { totalUser, requester, vp, keuangan };
  }, [data]);

  const RoleBadge = useCallback(({ role }: { role: UserRole }) => {
    return <Badge variant={roleBadgeVariant[role]}>{roleLabels[role]}</Badge>;
  }, []);

  const StatusBadge = useCallback(({ status }: { status: MasterUser['status'] }) => {
    return <Badge variant={status === 'Aktif' ? 'success' : 'danger'}>{status}</Badge>;
  }, []);

  const columns = useMemo(
    () => [
      columnHelper.accessor('badge', {
        header: 'Badge',
        cell: (info) => (
          <span className="text-xs font-normal text-primary bg-primary/5 px-2 py-1 rounded">
            {info.getValue()}
          </span>
        ),
        size: 110,
      }),
      columnHelper.accessor('name', {
        header: 'Nama User',
        cell: (info) => <span className="text-gray-900">{info.getValue()}</span>,
        size: 190,
      }),
      columnHelper.accessor('role', {
        header: 'Role',
        cell: (info) => <RoleBadge role={info.getValue()} />,
        size: 150,
      }),
      columnHelper.accessor('jabatan', {
        header: 'Jabatan',
        cell: (info) => <span className="text-gray-600">{info.getValue()}</span>,
        size: 210,
      }),
      columnHelper.accessor('unitKerja', {
        header: 'Unit Kerja',
        cell: (info) => <span className="text-gray-600">{info.getValue()}</span>,
        size: 260,
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        cell: (info) => <span className="text-gray-600">{info.getValue()}</span>,
        size: 220,
      }),
      columnHelper.accessor('hp', {
        header: 'No. HP',
        cell: (info) => <span className="text-xs text-gray-600">{info.getValue()}</span>,
        size: 130,
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
    [RoleBadge, StatusBadge]
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

  const handleEdit = useCallback((user: MasterUser) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  }, []);

  const handleDetail = useCallback((user: MasterUser) => {
    setDetailUser(user);
    setIsDetailModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback((id: string) => {
    setDeletingId(id);
    setIsDeleteConfirmOpen(true);
  }, []);

  const handleDelete = useCallback(() => {
    if (!deletingId) return;

    deleteUser(deletingId);
    addToast('User berhasil dihapus', 'success');
    setIsDeleteConfirmOpen(false);
    setDeletingId(null);
  }, [deletingId, deleteUser, addToast]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 border-l-4 border-primary pl-3">Master Data User</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola data pengguna sistem, peranan (role), dan status aktifasi</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total User" value={stats.totalUser} icon={<Users className="w-5 h-5" />} color="blue" />
        <StatCard label="User Unit Kerja" value={stats.requester} icon={<UserCheck className="w-5 h-5" />} color="green" />
        <StatCard label="VP" value={stats.vp} icon={<ShieldCheck className="w-5 h-5" />} color="yellow" />
        <StatCard label="Keuangan" value={stats.keuangan} icon={<Wallet className="w-5 h-5" />} color="red" />
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsAddModalOpen(true)}>
                Tambah User
              </Button>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari user..."
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
                            : 'Belum ada data user. Klik "Tambah User" untuk menambahkan.'}
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

      <UserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah User Baru"
        onSubmit={(formData) => {
          addUser(formData);
          setIsAddModalOpen(false);
          addToast('User berhasil ditambahkan', 'success');
        }}
      />

      <UserModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
        }}
        title="Edit User"
        initialData={editingUser}
        onSubmit={(formData) => {
          if (!editingUser) return;
          updateUser(editingUser.id, formData);
          setIsEditModalOpen(false);
          setEditingUser(null);
          addToast('User berhasil diperbarui', 'success');
        }}
      />

      <DetailUserModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setDetailUser(null);
        }}
        user={detailUser}
      />

      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Hapus User"
        message="Apakah Anda yakin ingin menghapus user ini?"
      />
    </div>
  );
};

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  initialData?: MasterUser | null;
  onSubmit: (data: UserFormData) => void;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, title, initialData, onSubmit }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      jabatan: '',
      unitKerja: '',
      noTelp: '',
      role: 'requester',
      badge: '',
      hp: '',
      status: 'Aktif',
    },
  });

  useEffect(() => {
    if (isOpen && initialData) {
      reset({
        name: initialData.name,
        email: initialData.email,
        jabatan: initialData.jabatan,
        unitKerja: initialData.unitKerja,
        noTelp: initialData.noTelp,
        role: initialData.role,
        badge: initialData.badge,
        hp: initialData.hp,
        status: initialData.status,
      });
    } else if (isOpen) {
      reset({
        name: '',
        email: '',
        jabatan: '',
        unitKerja: '',
        noTelp: '',
        role: 'requester',
        badge: '',
        hp: '',
        status: 'Aktif',
      });
    }
  }, [isOpen, initialData, reset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Badge *" error={errors.badge?.message}>
            <input className={inputClass(!!errors.badge)} placeholder="6121509" {...register('badge')} />
          </FormField>

          <FormField label="Nama *" error={errors.name?.message}>
            <input className={inputClass(!!errors.name)} placeholder="Nama user" {...register('name')} />
          </FormField>

          <FormField label="Email *" error={errors.email?.message}>
            <input type="email" className={inputClass(!!errors.email)} placeholder="nama@example.com" {...register('email')} />
          </FormField>

          <FormField label="Role *" error={errors.role?.message}>
            <select className={inputClass(!!errors.role)} {...register('role')}>
              <option value="requester">User Unit Kerja</option>
              <option value="vp">VP</option>
              <option value="keuangan">Keuangan</option>
              <option value="admin">Admin</option>
            </select>
          </FormField>

          <FormField label="Status *" error={errors.status?.message}>
            <select className={inputClass(!!errors.status)} {...register('status')}>
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </FormField>

          <FormField label="Jabatan *" error={errors.jabatan?.message}>
            <input className={inputClass(!!errors.jabatan)} placeholder="Jabatan" {...register('jabatan')} />
          </FormField>

          <FormField label="Unit Kerja *" error={errors.unitKerja?.message}>
            <input className={inputClass(!!errors.unitKerja)} placeholder="Nama unit kerja" {...register('unitKerja')} />
          </FormField>

          <FormField label="No. Telepon *" error={errors.noTelp?.message}>
            <input className={inputClass(!!errors.noTelp)} placeholder="0711-712345" {...register('noTelp')} />
          </FormField>

          <FormField label="No. HP *" error={errors.hp?.message}>
            <input className={inputClass(!!errors.hp)} placeholder="081234567890" {...register('hp')} />
          </FormField>
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

interface DetailUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: MasterUser | null;
}

const DetailUserModal: React.FC<DetailUserModalProps> = ({ isOpen, onClose, user }) => {
  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detail User" size="lg">
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="p-2.5 rounded-lg bg-blue-100">
            <BadgeCheck className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-normal text-blue-950">{user.name}</p>
            <p className="text-xs text-blue-700">{user.badge} - {roleLabels[user.role]}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <DetailField label="Badge" value={user.badge} />
          <DetailField label="Nama" value={user.name} bold />
          <DetailField label="Role" value={roleLabels[user.role]} />
          <DetailField label="Status" value={user.status} />
          <DetailField label="Jabatan" value={user.jabatan} />
          <DetailField label="Unit Kerja" value={user.unitKerja} />
          <DetailField label="Email" value={user.email} />
          <DetailField label="No. Telepon" value={user.noTelp} />
          <DetailField label="No. HP" value={user.hp} />
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

export default MasterUserPage;
