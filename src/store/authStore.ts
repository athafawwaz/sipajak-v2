import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (badge: string, password: string) => boolean;
  logout: () => void;
  initialize: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

const dummyAccounts = [
  {
    badge: "6121509",
    username: "Handika Pranajaya",
    password: "Pusri2012@",
    role: "requester",
    unitKerja: "DEPARTEMEN TEKNOLOGI INFORMASI",
    hp: "082175433331",
    email: "handikapj@pusri.co.id",
  },
  {
    badge: "6121501",
    username: "Bambang Susanto",
    password: "VP@1234",
    role: "vp",
    unitKerja: "DIVISI OPERASI (OPERASI P-VI)",
    hp: "08211234567",
    email: "bambang.susanto@pusri.co.id",
  },
  {
    badge: "6150706",
    username: "Sukirman Kuhapa",
    password: "Pusri2015@",
    role: "keuangan",
    unitKerja: "DEPARTEMEN KEUANGAN PAJAK",
    hp: "08119876543",
    email: "sukirman@pusri.co.id",
  },
];

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,

  login: (badge: string, _password: string) => {
    const dummy = dummyAccounts.find((d) => d.badge === badge);
    const token = `sim-token-${Date.now()}`;
    let user: User;

    if (dummy) {
      if (_password !== dummy.password) return false;
      user = {
        nip: dummy.badge,
        name: dummy.username,
        token,
        email: dummy.email || `${dummy.badge}@pusri.co.id`,
        jabatan: dummy.role === 'vp' ? 'Vice President' : dummy.role === 'keuangan' ? 'Staf Keuangan' : 'Officer Koordinator Digitalisasi',
        unitKerja: dummy.unitKerja,
        noTelp: dummy.hp,
        role: dummy.role,
        badge: dummy.badge,
        hp: dummy.hp,
      };
    } else {
      user = {
        nip: badge,
        name: badge === 'admin' ? 'Administrator' : `User ${badge}`,
        token,
        email: badge === 'admin' ? 'admin@pusri.co.id' : `${badge}@pusri.co.id`,
        jabatan: badge === 'admin' ? 'Admin Sistem' : 'Staff Pajak',
        unitKerja: 'Departemen Keuangan',
        noTelp: '0711-712345',
        role: badge === 'admin' ? 'admin' : 'requester',
        badge,
      };
    }

    sessionStorage.setItem('auth_token', token);
    sessionStorage.setItem('auth_user', JSON.stringify(user));

    set({ user, isAuthenticated: true });
    return true;
  },

  logout: () => {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
    set({ user: null, isAuthenticated: false });
  },

  initialize: () => {
    const token = sessionStorage.getItem('auth_token');
    const userStr = sessionStorage.getItem('auth_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        set({ user, isAuthenticated: true });
      } catch {
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_user');
      }
    }
  },

  updateProfile: (updates) => {
    const current = get().user;
    if (!current) return;
    const updatedUser = { ...current, ...updates };
    sessionStorage.setItem('auth_user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },
}));
