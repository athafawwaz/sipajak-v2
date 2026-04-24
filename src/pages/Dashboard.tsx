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
  TrendingUp,
  ChevronRight,
  Sparkles,
  CalendarDays,
  BarChart3,
  FileCheck,
  FileX,
} from 'lucide-react';

import { useAuthStore } from '../store/authStore';
import { useFakturStore } from '../store/fakturStore';
import { useFakturSetorStore } from '../store/fakturSetorStore';
import { useFakturKeluaranStore } from '../store/fakturKeluaranStore';
import { usePembatalanFakturStore } from '../store/pembatalanFakturStore';
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

const StatMiniCard: React.FC<StatMiniCardProps> = ({ label, value, icon, iconBg, trend, trendColor }) => {
  const accentMap: Record<string, string> = {
    'bg-blue-500': 'bg-blue-500',
    'bg-emerald-500': 'bg-emerald-500',
    'bg-amber-500': 'bg-amber-400',
    'bg-violet-500': 'bg-violet-500',
    'bg-rose-500': 'bg-rose-500',
  };
  const accentBar = accentMap[iconBg] || 'bg-slate-400';

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col h-full">
      <div className={cn('h-[3px] w-full', accentBar)} />
      <div className="px-4 py-4 flex-1 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center text-white',
              'shadow-lg transition-transform duration-300 group-hover:scale-110',
              iconBg
            )}
          >
            {icon}
          </div>
          {trend && (
            <span className={cn('text-[11px] font-semibold flex items-center gap-0.5 px-2 py-1 rounded-full bg-gray-50', trendColor || 'text-gray-400')}>
              <TrendingUp className="w-3 h-3" />
              {trend}
            </span>
          )}
        </div>
        <div>
          <p className="text-[26px] font-extrabold text-slate-800 leading-none tabular-nums">{value}</p>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mt-1.5">{label}</p>
        </div>
      </div>
    </div>
  );
};

const StatusBar: React.FC<{ label: string; count: number; total: number; color: string }> = ({ label, count, total, color }) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">{label}</span>
        <span className="text-xs font-semibold text-gray-900">{count} <span className="text-gray-400 font-normal">({percentage}%)</span></span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-700 ease-out', color)} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};


// ============================================================
// DASHBOARD
// ============================================================
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const fakturData = useFakturStore((s) => s.data);
  const fakturSetorData = useFakturSetorStore((s) => s.data);
  const penerbitanData = useFakturKeluaranStore((s) => s.items);
  const pembatalanData = usePembatalanFakturStore((s) => s.items);

  const greeting = getGreeting();
  const fullName = user?.name || 'User';

  const stats = useMemo(() => {
    let fData = fakturData;
    let fsData = fakturSetorData;
    let pkData = penerbitanData;
    let pbData = pembatalanData;

    if (user?.role !== 'keuangan' && user?.role !== 'admin') {
      fData = fData.filter((d) => d.unitKerja === user?.unitKerja);
      fsData = fsData.filter((d) => d.unitKerja === user?.unitKerja);
      pkData = pkData.filter((d) => d.unitKerja === user?.unitKerja);
      pbData = pbData.filter((d) => d.unitKerja === user?.unitKerja);
    }

    const fakturBaru = fData.filter((d) => d.status === 'Baru').length;
    const fakturApproved = fData.filter((d) => d.status === 'Sudah Approve').length;
    const fakturDitolak = fData.filter((d) => d.status === 'Ditolak').length;

    const setorBaru = fsData.filter((d) => d.status === 'Baru').length;
    const setorApproved = fsData.filter((d) => d.status === 'Sudah Approve').length;

    const penerbitanSelesai = pkData.filter((d) => d.status === 'Selesai').length;
    const pembatalanDisetujui = pbData.filter((d) => d.status === 'Pembatalan Disetujui').length;

    return {
      totalFaktur: fData.length,
      totalFakturSetor: fsData.length,
      totalPenerbitan: pkData.length,
      totalPembatalan: pbData.length,
      fakturBaru,
      fakturApproved,
      fakturDitolak,
      setorBaru,
      setorApproved,
      penerbitanSelesai,
      pembatalanDisetujui,
      totalBaruAll: fakturBaru + setorBaru,
    };
  }, [fakturData, fakturSetorData, penerbitanData, pembatalanData, user]);

  const baruItems = useMemo(() => {
    let fData = fakturData;
    let fsData = fakturSetorData;

    if (user?.role !== 'keuangan' && user?.role !== 'admin') {
      fData = fData.filter((d) => d.unitKerja === user?.unitKerja);
      fsData = fsData.filter((d) => d.unitKerja === user?.unitKerja);
    }

    const fakturBaruList = fData.filter((d) => d.status === 'Baru').slice(0, 3).map((d) => ({
      id: d.id,
      title: d.namaPerusahaan,
      subtitle: `Faktur Pajak • ${d.nomorFakturPajak}`,
      type: 'faktur' as const,
    }));
    const setorBaruList = fsData.filter((d) => d.status === 'Baru').slice(0, 3).map((d) => ({
      id: d.id,
      title: d.nama,
      subtitle: `Faktur Setor • ${d.nomorFakturPajak}`,
      type: 'setor' as const,
    }));
    return [...fakturBaruList, ...setorBaruList].slice(0, 5);
  }, [fakturData, fakturSetorData, user]);

  const quickAccessItems = [
    { label: 'Faktur Pajak', description: 'Kelola data faktur pajak', icon: <FileText className="w-5 h-5" />, path: '/pph-masukan/faktur-pajak', color: 'text-blue-600 bg-blue-100' },
    { label: 'Faktur Pajak Setor', description: 'Kelola data faktur setor', icon: <FileSpreadsheet className="w-5 h-5" />, path: '/pph-masukan/faktur-pajak-setor', color: 'text-emerald-600 bg-emerald-100' },
    { label: 'Kalkulator PPH 21', description: 'Hitung pajak penghasilan', icon: <Calculator className="w-5 h-5" />, path: '/kalkulator/pph-21', color: 'text-violet-600 bg-violet-100' },
    { label: 'Edit Profil', description: 'Perbarui data profil', icon: <UserCog className="w-5 h-5" />, path: '/pengaturan/edit-profil', color: 'text-amber-600 bg-amber-100' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 px-6 py-8 md:px-8 md:py-10 shadow-lg">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="absolute top-8 right-16 w-20 h-20 bg-indigo-500/20 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-xs font-medium flex items-center gap-1.5 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              SI PAJAK — PT. Pupuk Sriwidjaja Palembang
            </div>
          </div>
          <h1 className="text-white text-3xl md:text-4xl font-bold mt-3 tracking-tight">{greeting}, {fullName}</h1>
          <p className="text-slate-300 text-sm md:text-base mt-2 max-w-xl leading-relaxed">
            Sistem Informasi Pajak terpadu untuk mengelola faktur pajak, perhitungan PPH, dan administrasi perpajakan perusahaan.
          </p>
          <div className="flex items-center gap-4 mt-5">
            <div className="flex items-center gap-2 text-white/60 text-xs">
              <CalendarDays className="w-4 h-4" />
              <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatMiniCard label="Total Faktur Pajak" value={stats.totalFaktur} icon={<FileText className="w-5 h-5" />} iconBg="bg-blue-500" trend={`${stats.fakturApproved} approved`} trendColor="text-emerald-600" />
        <StatMiniCard label="Total Faktur Setor" value={stats.totalFakturSetor} icon={<FileSpreadsheet className="w-5 h-5" />} iconBg="bg-emerald-500" trend={`${stats.setorApproved} approved`} trendColor="text-emerald-600" />
        <StatMiniCard label="Total Penerbitan" value={stats.totalPenerbitan} icon={<FileCheck className="w-5 h-5" />} iconBg="bg-violet-500" trend={`${stats.penerbitanSelesai} selesai`} trendColor="text-emerald-600" />
        <StatMiniCard label="Total Pembatalan" value={stats.totalPembatalan} icon={<FileX className="w-5 h-5" />} iconBg="bg-rose-500" trend={`${stats.pembatalanDisetujui} disetujui`} trendColor="text-rose-600" />
        <StatMiniCard label="Menunggu Approval" value={stats.totalBaruAll} icon={<Clock className="w-5 h-5" />} iconBg="bg-amber-500" trend="Butuh perhatian" trendColor="text-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Tasks */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <h2 className="text-sm font-semibold text-gray-900">Menunggu Konfirmasi Anda</h2>
              </div>
            </div>
            {baruItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                </div>
                <p className="text-sm font-medium text-gray-700">Tidak ada tugas menunggu</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {baruItems.map((item) => (
                  <button key={item.id} onClick={() => navigate(item.type === 'faktur' ? '/pph-masukan/faktur-pajak' : '/pph-masukan/faktur-pajak-setor')} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/80 transition-colors text-left group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', item.type === 'faktur' ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500')}>
                        {item.type === 'faktur' ? <FileText className="w-4 h-4" /> : <FileSpreadsheet className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-primary">{item.title}</p>
                        <p className="text-xs text-gray-400 truncate">{item.subtitle}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary" />
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
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Faktur Pajak</h3>
                <div className="space-y-2.5">
                  <StatusBar label="Sudah Approve" count={stats.fakturApproved} total={stats.totalFaktur} color="bg-emerald-500" />
                  <StatusBar label="Baru" count={stats.fakturBaru} total={stats.totalFaktur} color="bg-amber-500" />
                  <StatusBar label="Ditolak" count={stats.fakturDitolak} total={stats.totalFaktur} color="bg-red-500" />
                </div>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Faktur Pajak Setor</h3>
                <div className="space-y-2.5">
                  <StatusBar label="Sudah Approve" count={stats.setorApproved} total={stats.totalFakturSetor} color="bg-emerald-500" />
                  <StatusBar label="Baru" count={stats.setorBaru} total={stats.totalFakturSetor} color="bg-amber-500" />
                  <StatusBar label="Ditolak" count={stats.totalFakturSetor - stats.setorApproved - stats.setorBaru} total={stats.totalFakturSetor} color="bg-red-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Access */}
        <div className="space-y-6">
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100"><h2 className="text-sm font-semibold text-gray-900">Akses Cepat</h2></div>
            <div className="divide-y divide-gray-50">
              {quickAccessItems.map((item) => (
                <button key={item.path} onClick={() => navigate(item.path)} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/80 transition-colors text-left group">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110', item.color)}>{item.icon}</div>
                  <div className="min-w-0 flex-1"><p className="text-sm font-medium text-gray-900">{item.label}</p></div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
