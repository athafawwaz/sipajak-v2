import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, FileSpreadsheet, Calculator, ChevronDown, UserCog, Building2, Users, Truck } from 'lucide-react';
import { cn } from '../../utils/cn';

interface SidebarProps {
  collapsed: boolean;
}

interface MenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  children?: { label: string; path: string }[];
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    title: 'PPH Masukan',
    items: [
      {
        label: 'Faktur Pajak',
        path: '/pph-masukan/faktur-pajak',
        icon: <FileText className="w-5 h-5" />,
        children: [
          { label: 'Faktur Pajak Baru', path: '/pph-masukan/faktur-pajak/baru' },
          { label: 'Tindak Lanjut', path: '/pph-masukan/faktur-pajak/tindak-lanjut' },
        ],
      },
      {
        label: 'Faktur Pajak Setor',
        path: '/pph-masukan/faktur-pajak-setor',
        icon: <FileSpreadsheet className="w-5 h-5" />,
        children: [
          { label: 'Faktur Pajak Baru', path: '/pph-masukan/faktur-pajak-setor/baru' },
          { label: 'Tindak Lanjut', path: '/pph-masukan/faktur-pajak-setor/tindak-lanjut' },
        ],
      },
    ],
  },
  {
    title: 'PPH Keluaran',
    items: [
      {
        label: 'Penerbitan Faktur',
        path: '/pph-keluaran/penerbitan-faktur',
        icon: <FileText className="w-5 h-5" />,
        children: [
          { label: 'Subsidi', path: '/pph-keluaran/penerbitan-faktur/subsidi' },
          { label: 'Non Subsidi', path: '/pph-keluaran/penerbitan-faktur/non-subsidi' },
        ],
      },
      {
        label: 'Pembatalan Faktur Pajak',
        path: '/pph-keluaran/pembatalan-faktur-pajak',
        icon: <FileText className="w-5 h-5" />,
      },
    ],
  },
  {
    title: 'Kalkulator',
    items: [
      {
        label: 'Kalkulator PPH 21',
        path: '/kalkulator/pph-21',
        icon: <Calculator className="w-5 h-5" />,
      },
    ],
  },
  {
    title: 'Master Data',
    items: [
      {
        label: 'Master Data Vendor',
        path: '/master/vendor',
        icon: <Truck className="w-5 h-5" />,
      },
      {
        label: 'Master Data User',
        path: '/master/user',
        icon: <Users className="w-5 h-5" />,
      },
      {
        label: 'Master Unit Kerja',
        path: '/pengaturan/master-unit-kerja',
        icon: <Building2 className="w-5 h-5" />,
      },
    ],
  },
  {
    title: 'Pengaturan',
    items: [
      {
        label: 'Edit Profil',
        path: '/pengaturan/edit-profil',
        icon: <UserCog className="w-5 h-5" />,
      },
    ],
  },
];

import { usePendingCount } from '../../hooks/usePendingCount';
import { useAuthStore } from '../../store/authStore';
import { useUnitKerjaStore } from '../../store/unitKerjaStore';

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const { user } = useAuthStore();
  const { data: unitKerjaData } = useUnitKerjaStore();
  const { penerbitan, pembatalan } = usePendingCount();

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    '/pph-keluaran/penerbitan-faktur': true
  });

  const checkPermission = (path: string) => {
    // Only 'Faktur Pajak' (non-setor) is restricted by Unit Kerja Master Data
    if (path === '/pph-masukan/faktur-pajak') {
      if (!user) return false;
      // Admin, VP, and Keuangan always have access to oversee everything
      if (user.role === 'admin' || user.role === 'vp' || user.role === 'keuangan') return true;

      // For others (requesters), access is granted if their Unit Kerja is REGISTERED in Master Data
      const isRegistered = unitKerjaData.some(
        (uk) => uk.nama.toLowerCase() === (user.unitKerja || '').toLowerCase()
      );
      return isRegistered;
    }
    
    // Other menus are accessible as usual
    return true;
  };

  const toggleMenu = (path: string) => {
    setOpenMenus(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const getBadge = (path: string) => {
    if (path === '/pph-keluaran/penerbitan-faktur' && penerbitan && penerbitan > 0) {
      return (
        <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-red-500 rounded-full shadow-sm shadow-red-500/20">
          {penerbitan}
        </span>
      );
    }
    if (path === '/pph-keluaran/pembatalan-faktur-pajak' && pembatalan && pembatalan > 0) {
      return (
        <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-red-500 rounded-full shadow-sm shadow-red-500/20">
          {pembatalan}
        </span>
      );
    }
    return null;
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-primary z-40 flex flex-col transition-all duration-300 ease-in-out',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
          <img src="/favicon.svg" alt="PSP Logo" className="w-full h-full object-contain" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-white font-bold text-lg leading-tight truncate">SI PAJAK 2.0</h1>
            <p className="text-white/50 text-[11px] truncate">PT. Pupuk Sriwidjaja Palembang</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {/* Dashboard */}
        <NavLink
          to="/dashboard"
          title={collapsed ? 'Dashboard' : undefined}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
              'text-white/65 hover:text-white hover:bg-white/10',
              isActive && 'text-white bg-white/10 border-l-[3px] border-accent',
              collapsed && 'justify-center px-0'
            )
          }
        >
          <span className="flex-shrink-0"><LayoutDashboard className="w-5 h-5" /></span>
          {!collapsed && <span className="text-sm font-medium truncate">Dashboard</span>}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50">
              Dashboard
            </div>
          )}
        </NavLink>
        {menuGroups.map((group) => (
          <div key={group.title}>
            {!collapsed && (
              <div className="flex items-center gap-1 px-3 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                  {group.title}
                </span>
                <ChevronDown className="w-3 h-3 text-white/30" />
              </div>
            )}
            <div className="space-y-1">
              {group.items.filter(item => checkPermission(item.path)).map((item) => {
                const hasChildren = item.children && item.children.length > 0;
                return (
                  <div key={item.path} className="space-y-1">
                    {hasChildren ? (
                      <div
                        onClick={() => toggleMenu(item.path)}
                        className={cn(
                          'flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                          'text-white/65 hover:text-white hover:bg-white/10 cursor-pointer',
                          collapsed && 'justify-center px-0'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex-shrink-0">{item.icon}</span>
                          {!collapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
                        </div>
                        {!collapsed && <ChevronDown className={cn("w-4 h-4 transition-transform", openMenus[item.path] && "rotate-180")} />}
                        {!collapsed && getBadge(item.path)}
                      </div>
                    ) : (
                      <NavLink
                        to={item.path}
                        title={collapsed ? item.label : undefined}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                            'text-white/65 hover:text-white hover:bg-white/10',
                            isActive && 'text-white bg-white/10 border-l-[3px] border-accent',
                            collapsed && 'justify-center px-0'
                          )
                        }
                      >
                        <span className="flex-shrink-0">{item.icon}</span>
                        {!collapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
                        {!collapsed && getBadge(item.path)}
                        {collapsed && (
                          <div className="absolute left-full ml-2 flex items-center gap-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50">
                            {item.label}
                            {((item.path === '/pph-keluaran/penerbitan-faktur' && penerbitan > 0) || (item.path === '/pph-keluaran/pembatalan-faktur-pajak' && pembatalan > 0)) && (
                              <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold bg-red-500 rounded-full">
                                {item.path === '/pph-keluaran/penerbitan-faktur' ? penerbitan : pembatalan}
                              </span>
                            )}
                          </div>
                        )}
                      </NavLink>
                    )}

                    {hasChildren && !collapsed && openMenus[item.path] && (
                      <div className="pl-9 pr-3 space-y-1 mt-1">
                        {item.children!.map((child) => (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            className={({ isActive }) =>
                              cn(
                                'block py-2 px-3 rounded-md text-xs font-medium transition-colors',
                                'text-white/50 hover:text-white hover:bg-white/5',
                                isActive && 'text-white bg-white/10'
                              )
                            }
                          >
                            {child.label}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-white/10">
          <p className="text-white/30 text-[10px] text-center">© 2026 PT. Pupuk Sriwidjaja Palembang</p>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
