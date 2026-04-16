import { create } from 'zustand';
import type { UnitKerja, MenuPermission, MenuKey } from '../types';

// All available menu items in the system
export const ALL_MENU_ITEMS: { key: MenuKey; label: string }[] = [
  { key: 'faktur-pajak', label: 'Faktur Pajak' },
  { key: 'kalkulator-pph-21', label: 'Kalkulator PPH 21' },
  { key: 'edit-profil', label: 'Edit Profil' },
  { key: 'master-unit-kerja', label: 'Master Unit Kerja' },
];

const generateDefaultPermissions = (enabledKeys?: MenuKey[]): MenuPermission[] =>
  ALL_MENU_ITEMS.map((item) => ({
    key: item.key,
    label: item.label,
    enabled: enabledKeys ? enabledKeys.includes(item.key) : true,
  }));

const generateDummyData = (): UnitKerja[] => {
  const now = new Date().toISOString();
  return [
    {
      id: 'uk-001',
      kode: 'DEP-KEU',
      nama: 'Departemen Keuangan',
      deskripsi: 'Mengelola seluruh aspek keuangan dan perpajakan perusahaan',
      menuPermissions: generateDefaultPermissions([
        'faktur-pajak',
        'kalkulator-pph-21',
        'edit-profil',
        'master-unit-kerja',
      ]),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'uk-002',
      kode: 'DEP-SDM',
      nama: 'Departemen SDM',
      deskripsi: 'Mengelola sumber daya manusia dan administrasi personalia',
      menuPermissions: generateDefaultPermissions([
        'kalkulator-pph-21',
        'edit-profil',
      ]),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'uk-003',
      kode: 'DEP-PROD',
      nama: 'Departemen Produksi',
      deskripsi: 'Mengelola proses produksi pupuk dan pengawasan kualitas',
      menuPermissions: generateDefaultPermissions(['edit-profil']),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'uk-004',
      kode: 'DEP-PEM',
      nama: 'Departemen Pemasaran',
      deskripsi: 'Mengelola distribusi dan pemasaran produk',
      menuPermissions: generateDefaultPermissions(['faktur-pajak', 'edit-profil']),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'uk-005',
      kode: 'DEP-TI',
      nama: 'Departemen Teknologi Informasi',
      deskripsi: 'Mengelola infrastruktur teknologi informasi dan sistem informasi',
      menuPermissions: generateDefaultPermissions([
        'faktur-pajak',
        'kalkulator-pph-21',
        'edit-profil',
        'master-unit-kerja',
      ]),
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
  toggleMenuPermission: (unitKerjaId: string, menuKey: MenuKey) => void;
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

  toggleMenuPermission: (unitKerjaId, menuKey) => {
    set({
      data: get().data.map((item) =>
        item.id === unitKerjaId
          ? {
              ...item,
              menuPermissions: item.menuPermissions.map((perm) =>
                perm.key === menuKey ? { ...perm, enabled: !perm.enabled } : perm
              ),
              updatedAt: new Date().toISOString(),
            }
          : item
      ),
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),
}));
