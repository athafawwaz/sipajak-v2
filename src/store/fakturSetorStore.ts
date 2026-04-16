import { create } from 'zustand';
import type { FakturPajakSetor } from '../types';

const alamats = [
  'Jl. Jenderal Sudirman No.123, Palembang',
  'Jl. Segaran No.45, Kertapati, Palembang',
  'Jl. Raya Mutabumi KM 12, Banyuasin',
  'Jl. Mayor Zen No.78, Kalidoni, Palembang',
  'Jl. Veteran No.56, Ilir Timur, Palembang',
  'Jl. Demang Lebar Daun No.12, Palembang',
  'Jl. Basuki Rahmat No.99, Palembang',
  'Komp. Pusri Sei Lais, Palembang',
  'Jl. R.E. Martadinata No.33, Palembang',
  'Jl. Kapten A. Rivai No.88, Palembang',
];
const unitKerjas = [
  'DIVISI OPERASI (OPERASI P-VI)', 'DEPARTEMEN OPERASI PUSRI VI',
  'DEPT MPSDM', 'VERIFIKASI', 'PBJ', 'DEPARTEMEN LOGISTIK',
  'DEPT KEUANGAN', 'DEPARTEMEN PEMELIHARAAN', 'DEPT K3L',
  'DEPARTEMEN PERENCANAAN',
];
const namaList = [
  'Ahmad Fauzi', 'Siti Rahayu', 'Budi Santoso', 'Dewi Lestari', 'Rizki Pratama',
  'Andi Wijaya', 'Mega Sari', 'Hendra Kurniawan', 'Nina Oktavia', 'Dian Purnama',
  'Rahmat Hidayat', 'Fitri Handayani', 'Agus Setiawan', 'Rina Marlina', 'Yusuf Ibrahim',
];

const generateDummyData = (): FakturPajakSetor[] => {
  const statuses: FakturPajakSetor['status'][] = ['Sudah Approve', 'Pending', 'Ditolak'];
  const now = new Date().toISOString();

  return Array.from({ length: 20 }, (_, i) => {
    const status = statuses[i < 8 ? 0 : i < 15 ? 1 : 2];
    const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const dpp = Math.floor(Math.random() * 900000000) + 10000000;
    const ppn = Math.round(dpp * 0.11);
    const badgeNum = [1100, 2114, 2301, 1400, 1800, 2200][Math.floor(Math.random() * 6)];
    const badge = `${badgeNum}${String(Math.floor(Math.random() * 900) + 100)}`;
    const namaIdx = i % namaList.length;

    return {
      id: `fps-${String(i + 1).padStart(4, '0')}`,
      no: i + 1,
      tipeFA: i % 3 === 0 ? 'Non TA' as const : 'TA' as const,
      tanggalPenyampaian: `${day}/${month}/2024`,
      nomorFakturPajak: String(Math.floor(1000000000000000 + Math.random() * 9000000000000000)),
      tanggalFaktur: `${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}/${month}/2024`,
      npwpVendor: `0${Math.floor(Math.random() * 9)}.${Math.floor(Math.random() * 900) + 100}.${Math.floor(Math.random() * 900) + 100}.${Math.floor(Math.random() * 9)}-${Math.floor(Math.random() * 900) + 100}.000`,
      namaVendor: `PT Vendor Dummy ${i + 1}`,
      alamat: alamats[i % alamats.length],
      dpp,
      ppn,
      noAkunPerkiraanBiaya: `6${String(Math.floor(Math.random() * 9000) + 1000)}.${String(Math.floor(Math.random() * 90) + 10)}`,
      noBP: `BP-${String(2024000 + i + 1)}`,
      badge,
      nama: namaList[namaIdx],
      unitKerja: unitKerjas[i % unitKerjas.length],
      noExtKantor: `${Math.floor(Math.random() * 9000) + 1000}`,
      noWhatsapp: `0812${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
      email: `${namaList[namaIdx].toLowerCase().replace(/\s/g, '.')}@pusri.co.id`,
      noSELKamish: i % 3 === 0 ? `SEL-${String(Math.floor(Math.random() * 9000) + 1000)}/KMS/${2024}` : undefined,
      noVirtuSAP: i % 4 === 0 ? `SAP-${String(Math.floor(Math.random() * 9000000) + 1000000)}` : undefined,
      status,
      keterangan: status === 'Ditolak' ? 'Dokumen tidak lengkap' : '',
      tanggalApprove: status === 'Sudah Approve' ? `${day}/${month}/2024` : undefined,
      createdAt: now,
      updatedAt: now,
    };
  });
};

interface FakturSetorStore {
  data: FakturPajakSetor[];
  isLoading: boolean;
  addFaktur: (faktur: Omit<FakturPajakSetor, 'id' | 'no' | 'createdAt' | 'updatedAt'>) => void;
  updateFaktur: (id: string, updates: Partial<FakturPajakSetor>) => void;
  deleteFaktur: (id: string) => void;
  deleteMultiple: (ids: string[]) => void;
  importData: (items: Partial<FakturPajakSetor>[]) => void;
  setLoading: (loading: boolean) => void;
  approveFaktur: (id: string, approvedBy: string) => void;
  rejectFaktur: (id: string, approvedBy: string, reason: string) => void;
  bulkApprove: (ids: string[], approvedBy: string) => void;
}

export const useFakturSetorStore = create<FakturSetorStore>((set, get) => ({
  data: generateDummyData(),
  isLoading: false,

  addFaktur: (faktur) => {
    const current = get().data;
    const now = new Date().toISOString();
    const newNo = current.length > 0 ? Math.max(...current.map((d) => d.no)) + 1 : 1;
    const newFaktur: FakturPajakSetor = {
      ...faktur,
      id: `fps-${Date.now()}`,
      no: newNo,
      createdAt: now,
      updatedAt: now,
    };
    set({ data: [...current, newFaktur] });
  },

  updateFaktur: (id, updates) => {
    set({
      data: get().data.map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
      ),
    });
  },

  deleteFaktur: (id) => {
    set({
      data: get()
        .data.filter((item) => item.id !== id)
        .map((item, index) => ({ ...item, no: index + 1 })),
    });
  },

  deleteMultiple: (ids) => {
    set({
      data: get()
        .data.filter((item) => !ids.includes(item.id))
        .map((item, index) => ({ ...item, no: index + 1 })),
    });
  },

  importData: (items) => {
    const current = get().data;
    const now = new Date().toISOString();
    let nextNo = current.length > 0 ? Math.max(...current.map((d) => d.no)) + 1 : 1;
    const newItems: FakturPajakSetor[] = items.map((item) => ({
      id: `fps-${Date.now()}-${nextNo}`,
      no: nextNo++,
      tipeFA: item.tipeFA || 'TA',
      tanggalPenyampaian: item.tanggalPenyampaian || '',
      nomorFakturPajak: item.nomorFakturPajak || '',
      tanggalFaktur: item.tanggalFaktur || '',
      npwpVendor: item.npwpVendor || '',
      namaVendor: item.namaVendor || '',
      alamat: item.alamat || '',
      dpp: item.dpp || 0,
      ppn: item.ppn || 0,
      noAkunPerkiraanBiaya: item.noAkunPerkiraanBiaya || '',
      noBP: item.noBP || '',
      badge: item.badge || '',
      nama: item.nama || '',
      unitKerja: item.unitKerja || '',
      noExtKantor: item.noExtKantor || '',
      noWhatsapp: item.noWhatsapp || '',
      email: item.email || '',
      noSELKamish: item.noSELKamish,
      noVirtuSAP: item.noVirtuSAP,
      status: item.status || 'Pending',
      keterangan: item.keterangan || '',
      createdAt: now,
      updatedAt: now,
    }));
    set({ data: [...current, ...newItems] });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  approveFaktur: (id, approvedBy) => {
    const now = new Date();
    const tanggalApprove = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    set({
      data: get().data.map((item) =>
        item.id === id
          ? { ...item, status: 'Sudah Approve' as const, tanggalApprove, approvedBy, rejectionReason: undefined }
          : item
      ),
    });
  },

  rejectFaktur: (id, approvedBy, reason) => {
    set({
      data: get().data.map((item) =>
        item.id === id
          ? { ...item, status: 'Ditolak' as const, approvedBy, rejectionReason: reason, tanggalApprove: '' }
          : item
      ),
    });
  },

  bulkApprove: (ids, approvedBy) => {
    const now = new Date();
    const tanggalApprove = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    set({
      data: get().data.map((item) =>
        ids.includes(item.id) && item.status === 'Pending'
          ? { ...item, status: 'Sudah Approve' as const, tanggalApprove, approvedBy, rejectionReason: undefined }
          : item
      ),
    });
  },
}));
