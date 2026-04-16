import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  FileSpreadsheet,
  Calculator,
  UserCog,
  Building2,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  ChevronRight,
  Sparkles,
  CalendarDays,
  BarChart3,
} from 'lucide-react';

import { useAuthStore } from '../store/authStore';
import { useFakturStore } from '../store/fakturStore';
import { useFakturSetorStore } from '../store/fakturSetorStore';
import { cn } from '../utils/cn';

// ============================================================
// HELPERS
// ============================================================
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat Pagi';
  if (hour < 15) return 'Selamat Siang';
  if (hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
};




// ============================================================
// DASHBOARD
// ============================================================
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const fakturData = useFakturStore((s) => s.data);
  const fakturSetorData = useFakturSetorStore((s) => s.data);

  const greeting = getGreeting();
  const fullName = user?.name || 'User';

  // Stats
  const stats = useMemo(() => {
    const fakturPending = fakturData.filter((d) => d.status === 'Pending').length;
    const fakturApproved = fakturData.filter((d) => d.status === 'Sudah Approve').length;
    const fakturDitolak = fakturData.filter((d) => d.status === 'Ditolak').length;

    const setorPending = fakturSetorData.filter((d) => d.status === 'Pending').length;
    const setorApproved = fakturSetorData.filter((d) => d.status === 'Sudah Approve').length;

    const totalDppPpn = fakturSetorData.reduce((sum, d) => sum + d.dpp + d.ppn, 0);
    const totalPPN = fakturData.reduce((sum, d) => sum + d.nilaiPPN, 0);

    return {
      totalFaktur: fakturData.length,
      totalFakturSetor: fakturSetorData.length,
      fakturPending,
      fakturApproved,
      fakturDitolak,
      setorPending,
      setorApproved,
      totalDppPpn,
      totalPPN,
      totalPendingAll: fakturPending + setorPending,
    };
  }, [fakturData, fakturSetorData]);

  // Recent pending items (mix both stores)
  const pendingItems = useMemo(() => {
    const fakturPendingList = fakturData
      .filter((d) => d.status === 'Pending')
      .slice(0, 3)
      .map((d) => ({
        id: d.id,
        title: d.namaPerusahaan,
        subtitle: `Faktur Pajak • ${d.nomorFakturPajak}`,
        type: 'faktur' as const,
      }));
    const setorPendingList = fakturSetorData
      .filter((d) => d.status === 'Pending')
      .slice(0, 3)
      .map((d) => ({
        id: d.id,
        title: d.nama,
        subtitle: `Faktur Setor • ${d.nomorFakturPajak}`,
        type: 'setor' as const,
      }));
    return [...fakturPendingList, ...setorPendingList].slice(0, 5);
  }, [fakturData, fakturSetorData]);

  // Quick access menu items
  const quickAccessItems = [
    {
      label: 'Faktur Pajak',
      description: 'Kelola data faktur pajak',
      icon: <FileText className="w-5 h-5" />,
      path: '/pph-masukan/faktur-pajak',
      color: 'text-blue-600 bg-blue-100',
    },
    {
      label: 'Faktur Pajak Setor',
      description: 'Kelola data faktur setor',
      icon: <FileSpreadsheet className="w-5 h-5" />,
      path: '/pph-masukan/faktur-pajak-setor',
      color: 'text-emerald-600 bg-emerald-100',
    },
    {
      label: 'Kalkulator PPH 21',
      description: 'Hitung pajak penghasilan',
      icon: <Calculator className="w-5 h-5" />,
      path: '/kalkulator/pph-21',
      color: 'text-violet-600 bg-violet-100',
    },
    {
      label: 'Edit Profil',
      description: 'Perbarui data profil',
      icon: <UserCog className="w-5 h-5" />,
      path: '/pengaturan/edit-profil',
      color: 'text-amber-600 bg-amber-100',
    },
    {
      label: 'Master Unit Kerja',
      description: 'Atur akses unit kerja',
      icon: <Building2 className="w-5 h-5" />,
      path: '/pengaturan/master-unit-kerja',
      color: 'text-rose-600 bg-rose-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* ============== HERO GREETING ============== */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 px-6 py-8 md:px-8 md:py-10">
        {/* Decorative shapes */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="absolute top-8 right-16 w-20 h-20 bg-accent/20 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <div className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white/90 text-xs font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              SI PAJAK — PT. Pupuk Sriwidjaja Palembang
            </div>
          </div>

          <h1 className="text-white text-3xl md:text-4xl font-bold mt-3 tracking-tight">
            {greeting}, {fullName}
          </h1>
          <p className="text-white/70 text-sm md:text-base mt-2 max-w-xl leading-relaxed">
            Sistem Informasi Pajak terpadu untuk mengelola faktur pajak, perhitungan PPH,
            dan administrasi perpajakan perusahaan.
          </p>

          <div className="flex items-center gap-4 mt-5">
            <div className="flex items-center gap-2 text-white/60 text-xs">
              <CalendarDays className="w-4 h-4" />
              <span>
                {new Date().toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            {user?.unitKerja && (
              <div className="hidden md:flex items-center gap-2 text-white/60 text-xs">
                <Building2 className="w-4 h-4" />
                <span>{user.unitKerja}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============== STAT CARDS ============== */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatMiniCard
          label="Total Faktur Pajak"
          value={stats.totalFaktur}
          icon={<FileText className="w-5 h-5" />}
          iconBg="bg-blue-500"
          trend={`${stats.fakturApproved} approved`}
          trendColor="text-emerald-600"
        />
        <StatMiniCard
          label="Total Faktur Setor"
          value={stats.totalFakturSetor}
          icon={<FileSpreadsheet className="w-5 h-5" />}
          iconBg="bg-emerald-500"
          trend={`${stats.setorApproved} approved`}
          trendColor="text-emerald-600"
        />
        <StatMiniCard
          label="Menunggu Approval"
          value={stats.totalPendingAll}
          icon={<Clock className="w-5 h-5" />}
          iconBg="bg-amber-500"
          trend="Butuh perhatian"
          trendColor="text-amber-600"
        />
        {/* <StatMiniCard
          label="Total Nilai PPN"
          value={formatCurrency(stats.totalPPN)}
          icon={<DollarSign className="w-5 h-5" />}
          iconBg="bg-violet-500"
          trend="Faktur Pajak"
          trendColor="text-violet-600"
        /> */}
      </div>

      {/* ============== MAIN CONTENT GRID ============== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT — Pending Approval */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Card */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <h2 className="text-sm font-semibold text-gray-900">Menunggu Konfirmasi Anda</h2>
              </div>
              <button
                onClick={() => navigate('/pph-masukan/faktur-pajak')}
                className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
              >
                Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                </div>
                <p className="text-sm font-medium text-gray-700">Tidak ada tugas menunggu</p>
                <p className="text-xs text-gray-400 mt-1">Semua faktur sudah diproses</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {pendingItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() =>
                      navigate(
                        item.type === 'faktur'
                          ? '/pph-masukan/faktur-pajak'
                          : '/pph-masukan/faktur-pajak-setor'
                      )
                    }
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/80 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                          item.type === 'faktur'
                            ? 'bg-blue-50 text-blue-500'
                            : 'bg-emerald-50 text-emerald-500'
                        )}
                      >
                        {item.type === 'faktur' ? (
                          <FileText className="w-4 h-4" />
                        ) : (
                          <FileSpreadsheet className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-primary transition-colors">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{item.subtitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                        Pending
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status Overview */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Ringkasan Status Faktur
              </h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Faktur Pajak */}
                <div className="rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 p-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Faktur Pajak</h3>
                  <div className="space-y-2.5">
                    <StatusBar label="Sudah Approve" count={stats.fakturApproved} total={stats.totalFaktur} color="bg-emerald-500" />
                    <StatusBar label="Pending" count={stats.fakturPending} total={stats.totalFaktur} color="bg-amber-500" />
                    <StatusBar label="Ditolak" count={stats.fakturDitolak} total={stats.totalFaktur} color="bg-red-500" />
                  </div>
                </div>

                {/* Faktur Setor */}
                <div className="rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 p-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Faktur Pajak Setor</h3>
                  <div className="space-y-2.5">
                    <StatusBar label="Sudah Approve" count={stats.setorApproved} total={stats.totalFakturSetor} color="bg-emerald-500" />
                    <StatusBar label="Pending" count={stats.setorPending} total={stats.totalFakturSetor} color="bg-amber-500" />
                    <StatusBar
                      label="Ditolak"
                      count={stats.totalFakturSetor - stats.setorApproved - stats.setorPending}
                      total={stats.totalFakturSetor}
                      color="bg-red-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Quick Access */}
        <div className="space-y-6">
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Akses Cepat</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {quickAccessItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/80 transition-colors text-left group"
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110',
                      item.color
                    )}
                  >
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-400">{item.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Info Card */}
          <div className="card overflow-hidden bg-gradient-to-br from-primary/5 to-accent/5 border-primary/10">
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-gray-900">Tips</h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Gunakan fitur <span className="font-medium text-primary">Upload File</span> pada tabel
                Faktur Pajak Setor untuk mengimpor data secara massal dari file Excel.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// SUB-COMPONENTS
// ============================================================
interface StatMiniCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  trend?: string;
  trendColor?: string;
}

const StatMiniCard: React.FC<StatMiniCardProps> = ({ label, value, icon, iconBg, trend, trendColor }) => (
  <div className="card p-4 hover:shadow-md transition-shadow duration-300 group">
    <div className="flex items-center justify-between mb-3">
      <div className={cn('p-2.5 rounded-xl text-white shadow-lg shadow-current/20', iconBg)}>
        {icon}
      </div>
      {trend && (
        <span className={cn('text-[12px] font-semibold flex items-center gap-0.5', trendColor || 'text-gray-400')}>
          <TrendingUp className="w-3 h-3" />
          {trend}
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors">{value}</p>
    <p className="text-xs text-gray-500 mt-0.5 font-medium">{label}</p>
  </div>
);

interface StatusBarProps {
  label: string;
  count: number;
  total: number;
  color: string;
}

const StatusBar: React.FC<StatusBarProps> = ({ label, count, total, color }) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">{label}</span>
        <span className="text-xs font-semibold text-gray-900">{count} <span className="text-gray-400 font-normal">({percentage}%)</span></span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default Dashboard;
