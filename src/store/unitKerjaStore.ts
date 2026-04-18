import { create } from 'zustand';
import type { UnitKerja } from '../types';



const generateDummyData = (): UnitKerja[] => {
  const now = new Date().toISOString();
  return [
    {
      id: 'uk-001',
      nama: 'DEPARTEMEN KEUANGAN',
      deskripsi: 'Mengelola seluruh aspek keuangan dan perpajakan perusahaan',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'uk-002',
      nama: 'DEPARTEMEN SDM',
      deskripsi: 'Mengelola sumber daya manusia dan administrasi personalia',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'uk-003',
      nama: 'DEPARTEMEN PRODUKSI',
      deskripsi: 'Mengelola proses produksi pupuk dan pengawasan kualitas',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'uk-004',
      nama: 'DEPARTEMEN PEMASARAN',
      deskripsi: 'Mengelola distribusi dan pemasaran produk',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'uk-005',
      nama: 'DEPARTEMEN TEKNOLOGI INFORMASI',
      deskripsi: 'Mengelola infrastruktur teknologi informasi dan sistem informasi',
      createdAt: now,
      updatedAt: now,
    },
  ];
};

interface UnitKerjaStore {
  data: UnitKerja[];
  isLoading: boolean;
  addUnitKerja: (unitKerja: Omit<UnitKerja, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateUnitKerja: (id: string, updates: Partial<UnitKerja>) => void;
  deleteUnitKerja: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useUnitKerjaStore = create<UnitKerjaStore>((set, get) => ({
  data: generateDummyData(),
  isLoading: false,

  addUnitKerja: (unitKerja) => {
    const now = new Date().toISOString();
    const newItem: UnitKerja = {
      ...unitKerja,
      id: `uk-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    set({ data: [...get().data, newItem] });
  },

  updateUnitKerja: (id, updates) => {
    set({
      data: get().data.map((item) =>
        item.id === id
          ? { ...item, ...updates, updatedAt: new Date().toISOString() }
          : item
      ),
    });
  },

  deleteUnitKerja: (id) => {
    set({ data: get().data.filter((item) => item.id !== id) });
  },



  setLoading: (loading) => set({ isLoading: loading }),
}));
