import { create } from 'zustand';
import type { MasterUser } from '../types';

const generateDummyData = (): MasterUser[] => {
  const now = new Date().toISOString();

  return [
    {
      id: 'usr-001',
      name: 'Handika Pranajaya',
      email: 'handikapj@example.com',
      jabatan: 'Officer Koordinator Digitalisasi',
      unitKerja: 'DEPARTEMEN TEKNOLOGI INFORMASI',
      noTelp: '0711-712345',
      role: 'requester',
      badge: '6121509',
      hp: '082175433331',
      status: 'Aktif',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr-002',
      name: 'Cipta Atsahlantusay',
      email: 'bambang.susanto@example.com',
      jabatan: 'Vice President',
      unitKerja: 'DEPARTEMEN TEKNOLOGI INFORMASI',
      noTelp: '0711-718888',
      role: 'vp',
      badge: '6121501',
      hp: '08211234567',
      status: 'Aktif',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr-003',
      name: 'Sukirman Kuhapa',
      email: 'siti.rahayu@example.com',
      jabatan: 'Staf Keuangan',
      unitKerja: 'DEPARTEMEN KEUANGAN PAJAK',
      noTelp: '0711-719999',
      role: 'keuangan',
      badge: '6150706',
      hp: '08119876543',
      status: 'Aktif',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr-004',
      name: 'Rizky Pratama',
      email: 'rizky.pratama@example.com',
      jabatan: 'Staff Administrasi',
      unitKerja: 'DEPARTEMEN PEMASARAN',
      noTelp: '0711-713210',
      role: 'requester',
      badge: '6121510',
      hp: '081278900001',
      status: 'Aktif',
      createdAt: now,
      updatedAt: now,
    },
  ];
};

interface MasterUserStore {
  data: MasterUser[];
  isLoading: boolean;
  addUser: (user: Omit<MasterUser, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateUser: (id: string, updates: Partial<MasterUser>) => void;
  deleteUser: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useMasterUserStore = create<MasterUserStore>((set, get) => ({
  data: generateDummyData(),
  isLoading: false,

  addUser: (user) => {
    const now = new Date().toISOString();
    const newItem: MasterUser = {
      ...user,
      id: `usr-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };

    set({ data: [...get().data, newItem] });
  },

  updateUser: (id, updates) => {
    set({
      data: get().data.map((item) =>
        item.id === id
          ? { ...item, ...updates, updatedAt: new Date().toISOString() }
          : item
      ),
    });
  },

  deleteUser: (id) => {
    set({ data: get().data.filter((item) => item.id !== id) });
  },

  setLoading: (loading) => set({ isLoading: loading }),
}));
