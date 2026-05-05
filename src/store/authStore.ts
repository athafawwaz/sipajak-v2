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

import { useMasterUserStore } from './masterUserStore';

const dummyPasswords: Record<string, string> = {
  "6121509": "Pusri2012@",
  "6121501": "VP@1234",
  "6150706": "Pusri2015@",
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,

  login: (badge: string, password: string) => {
    const masterData = useMasterUserStore.getState().data;
    const dummy = masterData.find((d) => d.badge === badge);
    const token = `sim-token-${Date.now()}`;
    let user: User;

    if (dummy) {
      const expectedPassword = dummyPasswords[badge];
      if (expectedPassword && password !== expectedPassword) return false;
      user = {
        nip: dummy.badge,
        name: dummy.name,
        token,
        email: dummy.email || `${dummy.badge}@example.com`,
        jabatan: dummy.jabatan,
        unitKerja: dummy.unitKerja,
        noTelp: dummy.hp || dummy.noTelp,
        role: dummy.role as any,
        badge: dummy.badge,
        hp: dummy.hp || dummy.noTelp,
      };
    } else {
      user = {
        nip: badge,
        name: badge === 'admin' ? 'Administrator' : `User ${badge}`,
        token,
        email: badge === 'admin' ? 'admin@example.com' : `${badge}@example.com`,
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
