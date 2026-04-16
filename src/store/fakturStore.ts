import { create } from 'zustand';
import type { FakturPajak } from '../types';

const generateDummyData = (): FakturPajak[] => {
  const companies = [
    'PT Pupuk Indonesia', 'PT Pertamina', 'PT PLN Persero', 'PT Telkom Indonesia',
    'PT Semen Baturaja', 'PT Bukit Asam', 'PT Krakatau Steel', 'CV Mitra Sejahtera',
    'PT Indofood Sukses', 'PT Unilever Indonesia', 'PT Astra International', 'PT Bank Mandiri',
    'PT Garuda Indonesia', 'PT Waskita Karya', 'PT PTBA', 'PT Elnusa', 'PT Medco Energi',
    'PT Trans Pacific', 'PT Sriwijaya Air', 'PT Hutama Karya',
  ];
  const requesters = ['Ahmad Fauzi', 'Siti Rahayu', 'Budi Santoso', 'Dewi Lestari', 'Rizki Pratama'];
  const statuses: FakturPajak['status'][] = ['Sudah Approve', 'Pending', 'Ditolak'];
  const codes: FakturPajak['kodeFakturSAP'][] = ['BV', 'BZ'];

  return Array.from({ length: 25 }, (_, i) => {
    const status = statuses[Math.floor(Math.random() * (i < 15 ? 2 : 3))];
    const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const tanggal = `${day}/${month}/2024`;

    return {
      id: `fp-${String(i + 1).padStart(4, '0')}`,
      no: i + 1,
      tanggal,
      noMVP: `MVP-${String(2024000 + i + 1)}`,
      nomorFakturPajak: String(Math.floor(1000000000000000 + Math.random() * 9000000000000000)),
      kodeFakturSAP: codes[Math.floor(Math.random() * 2)],
      namaPerusahaan: companies[i % companies.length],
      nilaiDPP: Math.floor(Math.random() * 500000000) + 10000000,
      nilaiPPN: Math.floor(Math.random() * 50000000) + 1000000,
      requester: requesters[Math.floor(Math.random() * requesters.length)],
      status,
      keterangan: status === 'Ditolak' ? 'Nomor faktur tidak valid' : '',
      tanggalApprove: status === 'Sudah Approve' ? `${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}/${month}/2024` : '',
    };
  });
};

interface FakturStore {
  data: FakturPajak[];
  isLoading: boolean;
  addFaktur: (faktur: Omit<FakturPajak, 'id' | 'no'>) => void;
  updateFaktur: (id: string, faktur: Partial<FakturPajak>) => void;
  deleteFaktur: (id: string) => void;
  deleteMultiple: (ids: string[]) => void;
  importData: (items: Partial<FakturPajak>[]) => void;
  setLoading: (loading: boolean) => void;
  approveFaktur: (id: string, approvedBy: string) => void;
  rejectFaktur: (id: string, approvedBy: string, reason: string) => void;
  bulkApprove: (ids: string[], approvedBy: string) => void;
}

export const useFakturStore = create<FakturStore>((set, get) => ({
  data: generateDummyData(),
  isLoading: false,

  addFaktur: (faktur) => {
    const current = get().data;
    const newNo = current.length > 0 ? Math.max(...current.map((d) => d.no)) + 1 : 1;
    const newFaktur: FakturPajak = {
      ...faktur,
      id: `fp-${Date.now()}`,
      no: newNo,
    };
    set({ data: [...current, newFaktur] });
  },

  updateFaktur: (id, updates) => {
    set({
      data: get().data.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    });
  },

  deleteFaktur: (id) => {
    set({
      data: get().data.filter((item) => item.id !== id).map((item, index) => ({ ...item, no: index + 1 })),
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
    let nextNo = current.length > 0 ? Math.max(...current.map((d) => d.no)) + 1 : 1;
    const newItems: FakturPajak[] = items.map((item) => ({
      id: `fp-${Date.now()}-${nextNo}`,
      no: nextNo++,
      tanggal: item.tanggal || '',
      noMVP: item.noMVP || '',
      nomorFakturPajak: item.nomorFakturPajak || '',
      kodeFakturSAP: item.kodeFakturSAP || 'BV',
      namaPerusahaan: item.namaPerusahaan || '',
      nilaiDPP: item.nilaiDPP || 0,
      nilaiPPN: item.nilaiPPN || 0,
      requester: item.requester || '',
      status: item.status || 'Pending',
      keterangan: item.keterangan || '',
      tanggalApprove: item.tanggalApprove || '',
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

