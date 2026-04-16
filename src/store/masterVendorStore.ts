import { create } from 'zustand';
import type { MasterVendor } from '../types';

const generateDummyData = (): MasterVendor[] => {
  const now = new Date().toISOString();

  return [
    {
      id: 'vnd-001',
      kodeVendor: 'VND-001',
      namaVendor: 'PT Rekayasa Industri',
      npwp: '01.234.567.8-301.000',
      alamat: 'Jl. Kalibata Timur I No. 36, Jakarta Selatan',
      tipeVendor: 'PKP',
      noBP: 'BP-100120',
      pic: 'Dewi Lestari',
      noTelp: '021-7988700',
      email: 'finance@rekind.co.id',
      status: 'Aktif',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'vnd-002',
      kodeVendor: 'VND-002',
      namaVendor: 'PT Pupuk Indonesia Logistik',
      npwp: '02.345.678.9-051.000',
      alamat: 'Gedung Pusri, Jl. Taman Anggrek Kemanggisan Jaya, Jakarta Barat',
      tipeVendor: 'PKP',
      noBP: 'BP-100245',
      pic: 'Rian Saputra',
      noTelp: '021-53654900',
      email: 'billing@pilog.co.id',
      status: 'Aktif',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'vnd-003',
      kodeVendor: 'VND-003',
      namaVendor: 'CV Maju Bersama',
      npwp: '03.456.789.0-307.000',
      alamat: 'Jl. Demang Lebar Daun No. 88, Palembang',
      tipeVendor: 'Non PKP',
      noBP: 'BP-100388',
      pic: 'Agus Santoso',
      noTelp: '0711-445566',
      email: 'admin@majubersama.co.id',
      status: 'Aktif',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'vnd-004',
      kodeVendor: 'VND-004',
      namaVendor: 'PT Solusi Teknologi Nusantara',
      npwp: '04.567.890.1-301.000',
      alamat: 'Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan',
      tipeVendor: 'PKP',
      noBP: 'BP-100512',
      pic: 'Maya Kartika',
      noTelp: '021-57998800',
      email: 'invoice@stn.co.id',
      status: 'Nonaktif',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'vnd-005',
      kodeVendor: 'VND-005',
      namaVendor: 'PT Wijaya Karya Beton Tbk',
      npwp: '05.678.901.2-092.000',
      alamat: 'Gedung WIKA Tower 1, Jl. D.I. Panjaitan Kav. 9, Jakarta Timur',
      tipeVendor: 'PKP',
      noBP: 'BP-100621',
      pic: 'Nadia Putri',
      noTelp: '021-8192808',
      email: 'billing@wika-beton.co.id',
      status: 'Aktif',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'vnd-006',
      kodeVendor: 'VND-006',
      namaVendor: 'PT Krakatau Steel Persero Tbk',
      npwp: '06.789.012.3-417.000',
      alamat: 'Jl. Industri No. 5, Cilegon, Banten',
      tipeVendor: 'PKP',
      noBP: 'BP-100734',
      pic: 'Rudi Hartono',
      noTelp: '0254-392159',
      email: 'invoice@krakatausteel.com',
      status: 'Aktif',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'vnd-007',
      kodeVendor: 'VND-007',
      namaVendor: 'PT Sucofindo',
      npwp: '07.890.123.4-051.000',
      alamat: 'Graha Sucofindo, Jl. Raya Pasar Minggu Kav. 34, Jakarta Selatan',
      tipeVendor: 'PKP',
      noBP: 'BP-100802',
      pic: 'Hendra Wijaya',
      noTelp: '021-7983666',
      email: 'ar@sucofindo.co.id',
      status: 'Aktif',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'vnd-008',
      kodeVendor: 'VND-008',
      namaVendor: 'PT Surveyor Indonesia',
      npwp: '08.901.234.5-051.000',
      alamat: 'Graha Surveyor Indonesia, Jl. Jend. Gatot Subroto Kav. 56, Jakarta Selatan',
      tipeVendor: 'PKP',
      noBP: 'BP-100875',
      pic: 'Intan Permata',
      noTelp: '021-5265526',
      email: 'billing@ptsi.co.id',
      status: 'Aktif',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'vnd-009',
      kodeVendor: 'VND-009',
      namaVendor: 'PT Pelabuhan Indonesia Persero',
      npwp: '09.012.345.6-093.000',
      alamat: 'Jl. Pasoso No. 1, Tanjung Priok, Jakarta Utara',
      tipeVendor: 'PKP',
      noBP: 'BP-100934',
      pic: 'Yusuf Ramadhan',
      noTelp: '021-4301080',
      email: 'finance@pelindo.co.id',
      status: 'Aktif',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'vnd-010',
      kodeVendor: 'VND-010',
      namaVendor: 'PT Pertamina Patra Niaga',
      npwp: '10.123.456.7-051.000',
      alamat: 'Jl. Kramat Raya No. 59, Jakarta Pusat',
      tipeVendor: 'PKP',
      noBP: 'BP-101002',
      pic: 'Fajar Maulana',
      noTelp: '021-31923000',
      email: 'ap@pertaminapatraniaga.com',
      status: 'Aktif',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'vnd-011',
      kodeVendor: 'VND-011',
      namaVendor: 'PT United Tractors Tbk',
      npwp: '11.234.567.8-054.000',
      alamat: 'Jl. Raya Bekasi Km. 22, Cakung, Jakarta Timur',
      tipeVendor: 'PKP',
      noBP: 'BP-101116',
      pic: 'Siska Amelia',
      noTelp: '021-24579999',
      email: 'invoice@unitedtractors.com',
      status: 'Aktif',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'vnd-012',
      kodeVendor: 'VND-012',
      namaVendor: 'PT Astra Graphia Tbk',
      npwp: '12.345.678.9-054.000',
      alamat: 'Jl. Kramat Raya No. 43, Jakarta Pusat',
      tipeVendor: 'PKP',
      noBP: 'BP-101220',
      pic: 'Tono Prasetyo',
      noTelp: '021-3909190',
      email: 'billing@astragraphia.co.id',
      status: 'Aktif',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'vnd-013',
      kodeVendor: 'VND-013',
      namaVendor: 'PT Telekomunikasi Indonesia Tbk',
      npwp: '13.456.789.0-093.000',
      alamat: 'Jl. Japati No. 1, Bandung, Jawa Barat',
      tipeVendor: 'PKP',
      noBP: 'BP-101336',
      pic: 'Lina Marlina',
      noTelp: '022-4521108',
      email: 'enterprise.billing@telkom.co.id',
      status: 'Aktif',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'vnd-014',
      kodeVendor: 'VND-014',
      namaVendor: 'Koperasi Karyawan Pusri',
      npwp: '14.567.890.1-307.000',
      alamat: 'Komplek PT Pusri, Jl. Mayor Zen, Palembang',
      tipeVendor: 'Non PKP',
      noBP: 'BP-101441',
      pic: 'Rahmat Kurniawan',
      noTelp: '0711-712222',
      email: 'koperasi@pusri.co.id',
      status: 'Aktif',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'vnd-015',
      kodeVendor: 'VND-015',
      namaVendor: 'UD Sinar Abadi',
      npwp: '15.678.901.2-307.000',
      alamat: 'Jl. Kol. H. Burlian No. 45, Palembang',
      tipeVendor: 'Non PKP',
      noBP: 'BP-101553',
      pic: 'Mulyadi',
      noTelp: '0711-410555',
      email: 'udsinarabadi@gmail.com',
      status: 'Aktif',
      createdAt: now,
      updatedAt: now,
    },
  ];
};

interface MasterVendorStore {
  data: MasterVendor[];
  isLoading: boolean;
  addVendor: (vendor: Omit<MasterVendor, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateVendor: (id: string, updates: Partial<MasterVendor>) => void;
  deleteVendor: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useMasterVendorStore = create<MasterVendorStore>((set, get) => ({
  data: generateDummyData(),
  isLoading: false,

  addVendor: (vendor) => {
    const now = new Date().toISOString();
    const newItem: MasterVendor = {
      ...vendor,
      id: `vnd-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };

    set({ data: [...get().data, newItem] });
  },

  updateVendor: (id, updates) => {
    set({
      data: get().data.map((item) =>
        item.id === id
          ? { ...item, ...updates, updatedAt: new Date().toISOString() }
          : item
      ),
    });
  },

  deleteVendor: (id) => {
    set({ data: get().data.filter((item) => item.id !== id) });
  },

  setLoading: (loading) => set({ isLoading: loading }),
}));
