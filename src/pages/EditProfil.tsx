import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Save,
  Shield,
  Camera,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';

import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { cn } from '../utils/cn';

// --- Zod Schema ---
const profileSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  email: z
    .string()
    .min(1, 'Email wajib diisi')
    .email('Format email tidak valid'),
  jabatan: z.string().min(1, 'Jabatan wajib diisi'),
  unitKerja: z.string().min(1, 'Unit Kerja wajib diisi'),
  noTelp: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Password lama wajib diisi'),
    newPassword: z
      .string()
      .min(8, 'Password minimal 8 karakter')
      .regex(/[A-Z]/, 'Harus mengandung huruf besar')
      .regex(/[0-9]/, 'Harus mengandung angka'),
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Password tidak cocok',
    path: ['confirmPassword'],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

const EditProfil: React.FC = () => {
  const { user, updateProfile } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'profil' | 'keamanan'>('profil');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      jabatan: '',
      unitKerja: '',
      noTelp: '',
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        email: user.email || '',
        jabatan: user.jabatan || '',
        unitKerja: user.unitKerja || '',
        noTelp: user.noTelp || '',
      });
    }
  }, [user, reset]);

  const onSubmit = (data: ProfileFormData) => {
    updateProfile(data);
    addToast('Profil berhasil diperbarui', 'success');
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header Card */}
      <div className="card overflow-hidden">
        {/* Gradient Banner */}
        <div className="h-32 bg-gradient-to-r from-primary via-primary-light to-blue-500 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoLTZWMzBoNnYtNmg2djZoLTZ6TTYgMzR2Nmg2di02SDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-6">
          <div className="relative z-10 flex flex-col sm:flex-row items-start gap-4 -mt-12">
            {/* Avatar */}
            <div className="relative group flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-xl ring-4 ring-white">
                <span className="text-white text-2xl font-bold">{initials}</span>
              </div>
              <button className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <Camera className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="flex-1 pt-2 sm:pt-14">
              <h2 className="text-xl font-bold text-gray-900">{user?.name || 'User'}</h2>
              <p className="text-sm text-gray-500">{user?.jabatan || '-'}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="info">{user?.unitKerja || '-'}</Badge>
                <Badge variant="success">Aktif</Badge>
              </div>
            </div>

            {/* <div className="text-left sm:text-right pt-2 sm:pt-14">
              <p className="text-xs text-gray-400">No. Badge</p>
              <p className="text-sm font-semibold text-gray-900">{user?.nip}</p>
            </div> */}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="card">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('profil')}
            className={cn(
              'flex items-center gap-2 px-6 py-3.5 text-sm font-medium transition-all border-b-2 -mb-px',
              activeTab === 'profil'
                ? 'text-primary border-primary'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
            )}
          >
            <User className="w-4 h-4" />
            Informasi Profil
          </button>
          <button
            onClick={() => setActiveTab('keamanan')}
            className={cn(
              'flex items-center gap-2 px-6 py-3.5 text-sm font-medium transition-all border-b-2 -mb-px',
              activeTab === 'keamanan'
                ? 'text-primary border-primary'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
            )}
          >
            <Shield className="w-4 h-4" />
            Keamanan
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'profil' ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* NIP (readonly) */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <Shield className="w-3.5 h-3.5 text-gray-400" />
                    No. Badge
                  </label>
                  <input
                    type="text"
                    value={user?.nip || ''}
                    disabled
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-500"
                  />
                  <p className="mt-1 text-xs text-gray-400">NIP tidak dapat diubah</p>
                </div>

                {/* Nama Lengkap */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    value={user?.name || ''}
                    disabled
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-500"
                    placeholder="Nama lengkap"
                    // className={cn(
                    //   'w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
                    //   errors.name ? 'border-red-300' : 'border-gray-300'
                    // )}
                    {...register('name')}
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    Email *
                  </label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    className={cn(
                      'w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    )}
                    {...register('email')}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                </div>

                {/* No Telepon */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    No. Telepon
                  </label>
                  <input
                    type="text"
                    placeholder="0711-XXXXXX"
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    {...register('noTelp')}
                  />
                </div>

                {/* Jabatan */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                    Jabatan *
                  </label>
                  <input
                    type="text"
                    placeholder="Jabatan"
                    className={cn(
                      'w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
                      errors.jabatan ? 'border-red-300' : 'border-gray-300'
                    )}
                    {...register('jabatan')}
                  />
                  {errors.jabatan && <p className="mt-1 text-xs text-red-600">{errors.jabatan.message}</p>}
                </div>

                {/* Unit Kerja */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                    Unit Kerja *
                  </label>
                  <input
                    type="text"
                    placeholder="Unit kerja"
                    className={cn(
                      'w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
                      errors.unitKerja ? 'border-red-300' : 'border-gray-300'
                    )}
                    {...register('unitKerja')}
                  />
                  {errors.unitKerja && <p className="mt-1 text-xs text-red-600">{errors.unitKerja.message}</p>}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100">
                <Button
                  type="submit"
                  loading={isSubmitting}
                  disabled={isSubmitting || !isDirty}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          ) : (
            /* Keamanan Tab */
            <div className="space-y-6">
              {/* Password Section */}
              <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-amber-100">
                      <KeyRound className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Password</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Disarankan untuk mengganti password secara berkala untuk keamanan akun Anda
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsPasswordModalOpen(true)}
                  >
                    Ubah Password
                  </Button>
                </div>
              </div>

              {/* Session Info */}
              <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/50">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-100">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900">Informasi Sesi</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Detail sesi login Anda saat ini</p>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-400">Status</p>
                        <Badge variant="success" className="mt-1">Aktif</Badge>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Token</p>
                        <p className="text-xs text-gray-600 mt-1 truncate max-w-[200px]">
                          {user?.token || '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};

// ============================================================
// ChangePasswordModal
// ============================================================
interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const addToast = useToastStore((s) => s.addToast);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (isOpen) {
      reset();
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    }
  }, [isOpen, reset]);

  const onSubmit = (_data: PasswordFormData) => {
    // Simulasi — just show success
    addToast('Password berhasil diubah', 'success');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ubah Password" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Current Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Password Lama *
          </label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              className={cn(
                'w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
                errors.currentPassword ? 'border-red-300' : 'border-gray-300'
              )}
              {...register('currentPassword')}
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="mt-1 text-xs text-red-600">{errors.currentPassword.message}</p>
          )}
        </div>

        {/* New Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Password Baru *
          </label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              className={cn(
                'w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
                errors.newPassword ? 'border-red-300' : 'border-gray-300'
              )}
              {...register('newPassword')}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-400">Minimal 8 karakter, mengandung huruf besar dan angka</p>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Konfirmasi Password Baru *
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              className={cn(
                'w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
                errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
              )}
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" loading={isSubmitting} leftIcon={<KeyRound className="w-4 h-4" />}>
            Ubah Password
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditProfil;
