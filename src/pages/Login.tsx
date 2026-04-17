import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Info, Lock, User } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';

const loginSchema = z.object({
  badge: z.string().min(1, 'Badge wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

type LoginForm = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const addToast = useToastStore((s) => s.addToast);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    // Simulasi delay login
    await new Promise((r) => setTimeout(r, 800));

    const success = login(data.badge, data.password);
    if (success) {
      addToast('Login berhasil! Selamat datang.', 'success');
      navigate('/pph-masukan/faktur-pajak', { replace: true });
    } else {
      addToast('Login gagal. Password yang Anda masukkan salah.', 'error');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Branding */}
      <div className="hidden lg:flex lg:w-[55%] bg-primary relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary-dark via-primary to-primary-light" />
          <div className="absolute top-20 -left-20 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-blue-400/10 blur-3xl" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12">
          {/* Logo */}
          <div className="w-24 h-24 rounded-lg p-2 bg-white flex items-center justify-center mb-8">
            <img src="/favicon.svg" alt="PSP Logo" className="w-full h-full object-contain" />
          </div>

          <h1 className="text-4xl font-extrabold text-white mb-3 text-center">SI PAJAK</h1>
          <p className="text-white/60 text-lg font-medium text-center mb-2">Sistem Informasi Pajak</p>
          <div className="w-16 h-1 bg-accent rounded-full mb-6" />
          <p className="text-white/40 text-sm text-center max-w-sm">
            PT Pupuk Sriwidjaja Palembang <br /> Mengelola faktur pajak dan perhitungan PPH dengan efisien dan akurat.
          </p>

          {/* Decorative cards */}
          {/* <div className="mt-12 grid grid-cols-2 gap-4 max-w-sm w-full">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <p className="text-white/70 text-xs font-medium">Faktur Terkelola</p>
              <p className="text-white text-xl font-bold mt-1">2,450+</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center mb-2">
                <div className="w-3 h-3 rounded-full bg-blue-400" />
              </div>
              <p className="text-white/70 text-xs font-medium">Perhitungan PPH</p>
              <p className="text-white text-xl font-bold mt-1">Akurat</p>
            </div>
          </div> */}
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-[#F4F6FA]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center shadow-lg mb-4">
              <span className="text-primary-dark font-extrabold text-lg">PSP</span>
            </div>
            <h1 className="text-2xl font-bold text-primary">SI PAJAK</h1>
            <p className="text-gray-500 text-sm">Pupuk Sriwidjaja Palembang</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Masuk</h2>
              <p className="text-gray-500 text-sm mt-1">
                Masukkan kredensial Anda untuk mengakses sistem
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="Badge"
                placeholder="Masukkan badge"
                leftIcon={<User className="w-4 h-4" />}
                error={errors.badge?.message}
                {...register('badge')}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan password"
                    className={`w-full rounded-lg border bg-white pl-10 pr-11 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 ${
                      errors.password ? 'border-red-300 focus:ring-red-200 focus:border-red-500' : 'border-gray-300'
                    }`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                loading={isLoading}
                disabled={isLoading}
              >
                Masuk
              </Button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">atau</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 shadow-sm"
                onClick={() => addToast('SSO Pusri belum tersedia', 'info')}
              >
                <img src="/favicon.svg" alt="SSO Pusri Logo" className="w-5 h-5 object-contain" />
                Login with SSO Pusri
              </button>

              {/* <button
                type="button"
                className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 shadow-sm"
                onClick={() => addToast('SSO Pusri belum tersedia', 'info')}
              >
                <img src="/favicon.svg" alt="SSO Pusri Logo" className="w-5 h-5 object-contain" />
                Login with PI Identik
              </button> */}

            </form>

            <div className="mt-8 flex justify-center">
              <div className="relative group">
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary transition-colors"
                >
                  <Info className="w-4 h-4" />
                  Lihat Akun Demo
                </button>
                
                {/* Tooltip Content */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none drop-shadow-xl">
                  <div className="bg-white p-4 rounded-xl border border-gray-100 text-left">
                    <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <span>🔑</span> Kredensial Demo
                    </h3>
                    <div className="space-y-2 text-xs text-gray-600">
                      <div className="flex justify-between border-b border-gray-50 pb-1">
                        <span className="font-medium">Requester</span>
                        <span className="font-mono bg-gray-50 text-gray-800 px-1.5 py-0.5 rounded">6121509 / Pusri2012@</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-50 pb-1">
                        <span className="font-medium">VP</span>
                        <span className="font-mono bg-gray-50 text-gray-800 px-1.5 py-0.5 rounded">6121501 / VP@1234</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-50 pb-1">
                        <span className="font-medium">Keuangan</span>
                        <span className="font-mono bg-gray-50 text-gray-800 px-1.5 py-0.5 rounded">6150706 / Pusri2015@</span>
                      </div>
                    </div>
                  </div>
                  {/* Arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px]">
                    <div className="w-3 h-3 bg-white rotate-45 transform origin-top-left border-b border-r border-gray-100"></div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center mt-6">
              Sistem Informasi Pajak v2.0 — PT Pupuk Sriwidjaja Palembang
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
