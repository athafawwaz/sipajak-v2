import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, LogOut, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface TopbarProps {
  onToggleSidebar: () => void;
}

const pageTitles: Record<string, { title: string; breadcrumb: string[] }> = {
  '/dashboard': {
    title: 'Dashboard',
    breadcrumb: ['Dashboard'],
  },
  '/pph-masukan/faktur-pajak': {
    title: 'Faktur Pajak',
    breadcrumb: ['PPH Masukan', 'Faktur Pajak'],
  },
  '/pph-masukan/faktur-pajak-setor': {
    title: 'Faktur Pajak Setor',
    breadcrumb: ['PPH Masukan', 'Faktur Pajak Setor'],
  },
  '/kalkulator/pph-21': {
    title: 'Kalkulator PPH 21',
    breadcrumb: ['Kalkulator', 'Kalkulator PPH 21'],
  },
  '/pengaturan/edit-profil': {
    title: 'Profil Saya',
    breadcrumb: ['Pengaturan', 'Profil Saya'],
  },
  '/pengaturan/master-unit-kerja': {
    title: 'Master Unit Kerja',
    breadcrumb: ['Pengaturan', 'Master Unit Kerja'],
  },
  '/master/user': {
    title: 'Master Data User',
    breadcrumb: ['Master Data', 'Master Data User'],
  },
  '/master/vendor': {
    title: 'Master Data Vendor',
    breadcrumb: ['Master Data', 'Master Data Vendor'],
  },
};

const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const currentPage = pageTitles[location.pathname] || {
    title: 'Dashboard',
    breadcrumb: ['Home'],
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
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left: Hamburger + Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors lg:hidden"
            id="sidebar-toggle"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop toggle */}
          <button
            onClick={onToggleSidebar}
            className="hidden lg:flex p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            id="sidebar-toggle-desktop"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-1.5 text-sm">
            {currentPage.breadcrumb.map((crumb, idx) => (
              <React.Fragment key={crumb}>
                {idx > 0 && <ChevronRight className="w-4 h-4 text-gray-300" />}
                <span
                  className={
                    idx === currentPage.breadcrumb.length - 1
                      ? 'font-semibold text-gray-900'
                      : 'text-gray-400'
                  }
                >
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </div>

          <h1 className="sm:hidden text-base font-semibold text-gray-900">{currentPage.title}</h1>
        </div>

        {/* Right: User info */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/pengaturan/edit-profil')}
            className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer"
            title="Edit Profil"
          >
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 leading-tight group-hover:text-primary transition-colors">
                {user?.name}
              </p>
              <p className="text-xs text-gray-400">Badge: {user?.badge || user?.nip}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
          </button>

          {/* Mobile avatar — also navigates to profile */}
          <button
            onClick={() => navigate('/pengaturan/edit-profil')}
            className="sm:hidden w-9 h-9 rounded-full bg-primary flex items-center justify-center"
            title="Edit Profil"
          >
            <span className="text-white text-xs font-bold">{initials}</span>
          </button>

          <div className="w-px h-6 bg-gray-200 hidden sm:block" />

          <button
            onClick={logout}
            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Logout"
            id="logout-btn"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
