import { create } from 'zustand';
import type { PembatalanFakturPajak, ApprovalLog, DokumenPDF } from '../types';
import { useFakturKeluaranStore } from './fakturKeluaranStore';

interface PembatalanFakturStore {
  items: PembatalanFakturPajak[];

  // Actions
  createPengajuan: (
    fakturAsliId: string,
    alasan: string,
    dokumen: DokumenPDF[],
    createdBy: string
  ) => void;
  updateItem: (id: string, data: Partial<PembatalanFakturPajak>) => void;
  deleteItem: (id: string) => void;
  bulkDelete: (ids: string[]) => void;

  // Workflow actions
  approveVP: (id: string, approver: Omit<ApprovalLog, 'timestamp' | 'id'>) => void;
  rejectVP: (id: string, approver: Omit<ApprovalLog, 'timestamp' | 'id'>, catatan: string) => void;
  assignVP: (id: string, vpId: string, vpNama: string) => void;
  approveKeuangan: (id: string, approver: Omit<ApprovalLog, 'timestamp' | 'id'>) => void;
  rejectKeuangan: (id: string, approver: Omit<ApprovalLog, 'timestamp' | 'id'>, catatan: string) => void;
  submitRevisi: (id: string, alasan: string, dokumen: DokumenPDF[]) => void;

  // Selectors
  getByFakturAsliId: (fakturAsliId: string) => PembatalanFakturPajak | undefined;
  getPendingCount: (role?: string, badge?: string, unitKerja?: string) => number;
  getByRole: (role?: string, badge?: string, unitKerja?: string) => PembatalanFakturPajak[];
}

const createDummyData = (): PembatalanFakturPajak[] => {
  // We grab existing "Selesai" items from fakturKeluaranStore to generate dummy cancellations
  const fakturItems = useFakturKeluaranStore.getState().items;
  const selesaiItems = fakturItems.filter((f) => f.status === 'Selesai');
  
  if (selesaiItems.length === 0) return [];

  const dummy: PembatalanFakturPajak[] = [];
  
  // Helper to construct base
  const makeBase = (idx: number, fa: any, status: PembatalanFakturPajak['status']): PembatalanFakturPajak => ({
    id: `PB-${fa.id}`,
    no: idx + 1,
    fakturAsliId: fa.id,
    tanggalRequestFP: fa.tanggalRequestFP,
    noSONoDoc: fa.noSONoDoc,
    tanggalSO: fa.tanggalSO,
    namaCustomer: fa.namaCustomer,
    npwp: fa.npwp,
    totalTagihan: fa.totalTagihan,
    nilaiTransaksi: fa.nilaiTransaksi,
    dpp: fa.dpp,
    ppn: fa.ppn,
    keteranganTransaksi: fa.keteranganTransaksi,
    quantity: fa.quantity,
    alamat: fa.alamat,
    requesterNama: fa.requesterNama,
    requesterBadge: fa.requesterBadge,
    unitKerja: fa.unitKerja,
    hp: fa.hp,
    nomorFakturPajak: fa.nomorFakturPajak || '-',
    tanggalFakturPajak: fa.tanggalFakturPajak || '-',
    jenisFaktur: fa.jenisFaktur,
    alasanPembatalan: `Terdapat kesalahan input nilai pada DO sehingga faktur perlu diterbitkan ulang. (Dummy Alasan ${idx + 1})`,
    dokumenPendukung: [{ id: `doc-b-${idx}`, namaFile: `surat_batal_${idx}.pdf`, ukuran: 500000, url: "#", uploadedAt: new Date().toISOString() }],
    status,
    assignedVPId: (status === 'Menunggu Approval Keuangan' || status === 'Pembatalan Disetujui' || status === 'Pembatalan Ditolak') ? "VP001" : fa.assignedVPId,
    assignedVPNama: (status === 'Menunggu Approval Keuangan' || status === 'Pembatalan Disetujui' || status === 'Pembatalan Ditolak') ? "Bambang Susanto" : fa.assignedVPNama,
    approvalLogs: [],
    createdBy: fa.createdBy,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const generateStatus = (idx: number): PembatalanFakturPajak['status'] => {
    if (idx < 3) return 'Pembatalan Disetujui';
    if (idx < 5) return 'Menunggu Approval VP';
    if (idx < 7) return 'Menunggu Approval Keuangan';
    if (idx < 9) return 'Pembatalan Ditolak';
    return 'Revisi';
  };

  const toCreateCount = Math.min(10, selesaiItems.length);
  for (let i = 0; i < toCreateCount; i++) {
    const status = generateStatus(i);
    const item = makeBase(i, selesaiItems[i], status);

    // If it's done or progressed, add some dummy logs
    if (status === 'Pembatalan Disetujui') {
      item.approvalLogs.push(
        { id: `log-${i}-1`, step: 1, role: 'vp', approverName: "Bambang Susanto", approverBadge: "VP001", action: 'approve', timestamp: new Date().toISOString() },
        { id: `log-${i}-2`, step: 2, role: 'keuangan', approverName: "Siti Rahayu", approverBadge: "KEU001", action: 'approve', timestamp: new Date().toISOString() }
      );
      // Simulate side effect locally if possible for initialization, or just assume the faktur should also be updated.
      // But since Zustand initiates before React, let's just update the store directly
      useFakturKeluaranStore.getState().updateItem(item.fakturAsliId, { status: "Dibatalkan" });
    } else if (status === 'Menunggu Approval Keuangan') {
        item.approvalLogs.push(
            { id: `log-${i}-1`, step: 1, role: 'vp', approverName: "Bambang Susanto", approverBadge: "VP001", action: 'approve', timestamp: new Date().toISOString() }
        );
        useFakturKeluaranStore.getState().updateItem(item.fakturAsliId, { status: "Dalam Proses Pembatalan" });
    } else if (status === 'Menunggu Approval VP') {
        useFakturKeluaranStore.getState().updateItem(item.fakturAsliId, { status: "Dalam Proses Pembatalan" });
    } else if (status === 'Pembatalan Ditolak' || status === 'Revisi') {
        item.approvalLogs.push(
            { id: `log-${i}-1`, step: 1, role: 'vp', approverName: "Bambang Susanto", approverBadge: "VP001", action: 'reject', catatan: 'Alasan tidak kuat.', timestamp: new Date().toISOString() }
        );
        item.catatanPenolakan = 'Alasan tidak kuat.';
        // For ditolak, faktur asli reverts back to "Selesai", which it already is.
    }

    dummy.push(item);
  }

  return dummy;
};

export const usePembatalanFakturStore = create<PembatalanFakturStore>((set, get) => ({
  items: [], // initialized lazily below

  createPengajuan: (fakturAsliId, alasan, dokumen, createdBy) => {
    const fakturAsli = useFakturKeluaranStore.getState().items.find(i => i.id === fakturAsliId);
    if (!fakturAsli) return;

    set(state => {
      const newItem: PembatalanFakturPajak = {
        id: `PB-${Date.now()}`,
        no: state.items.length + 1,
        fakturAsliId,
        tanggalRequestFP: fakturAsli.tanggalRequestFP,
        noSONoDoc: fakturAsli.noSONoDoc,
        tanggalSO: fakturAsli.tanggalSO,
        namaCustomer: fakturAsli.namaCustomer,
        npwp: fakturAsli.npwp,
        totalTagihan: fakturAsli.totalTagihan,
        nilaiTransaksi: fakturAsli.nilaiTransaksi,
        dpp: fakturAsli.dpp,
        ppn: fakturAsli.ppn,
        keteranganTransaksi: fakturAsli.keteranganTransaksi,
        quantity: fakturAsli.quantity,
        alamat: fakturAsli.alamat,
        requesterNama: fakturAsli.requesterNama,
        requesterBadge: fakturAsli.requesterBadge,
        unitKerja: fakturAsli.unitKerja,
        hp: fakturAsli.hp,
        nomorFakturPajak: fakturAsli.nomorFakturPajak || '',
        tanggalFakturPajak: fakturAsli.tanggalFakturPajak || '',
        jenisFaktur: fakturAsli.jenisFaktur,
        alasanPembatalan: alasan,
        dokumenPendukung: dokumen,
        status: 'Menunggu Approval VP',
        // VP inheritance
        assignedVPId: fakturAsli.assignedVPId,
        assignedVPNama: fakturAsli.assignedVPNama,
        approvalLogs: [],
        createdBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Side Effect: update original
      useFakturKeluaranStore.getState().updateItem(fakturAsliId, { status: 'Dalam Proses Pembatalan' });

      return { items: [newItem, ...state.items] };
    });
  },

  updateItem: (id, data) => set(state => ({
    items: state.items.map(item => item.id === id ? { ...item, ...data, updatedAt: new Date().toISOString() } : item)
  })),

  deleteItem: (id) => set(state => ({
    items: state.items.filter(item => item.id !== id)
  })),

  bulkDelete: (ids) => set(state => ({
    items: state.items.filter(item => !ids.includes(item.id))
  })),

  approveVP: (id, approver) => {
    set(state => {
      const items = state.items.map(item => {
        if (item.id === id) {
          return {
            ...item,
            status: "Menunggu Approval Keuangan" as const,
            approvalLogs: [
              ...item.approvalLogs,
              { ...approver, id: Date.now().toString(), timestamp: new Date().toISOString() }
            ],
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      });
      return { items };
    });
  },

  rejectVP: (id, approver, catatan) => {
    set(state => {
      const items = state.items.map(item => {
        if (item.id === id) {
          // Revert origin
          useFakturKeluaranStore.getState().updateItem(item.fakturAsliId, { status: 'Selesai' });

          return {
            ...item,
            status: "Pembatalan Ditolak" as const,
            catatanPenolakan: catatan,
            approvalLogs: [
              ...item.approvalLogs,
              { ...approver, catatan, id: Date.now().toString(), timestamp: new Date().toISOString() }
            ],
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      });
      return { items };
    });
  },

  assignVP: (id, vpId, vpNama) => set(state => ({
    items: state.items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          assignedVPId: vpId,
          assignedVPNama: vpNama,
          approvalLogs: [
            ...item.approvalLogs,
            {
              id: Date.now().toString(),
              step: 1,
              role: "keuangan",
              approverName: "Sistem",
              approverBadge: "SYS",
              action: "assign_vp",
              catatan: `Assigned to ${vpNama} (${vpId})`,
              timestamp: new Date().toISOString()
            }
          ],
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    })
  })),

  approveKeuangan: (id, approver) => {
    set(state => {
      const items = state.items.map(item => {
        if (item.id === id) {
          // Disetujui
          useFakturKeluaranStore.getState().updateItem(item.fakturAsliId, { status: 'Dibatalkan' });

          return {
            ...item,
            status: "Pembatalan Disetujui" as const,
            approvalLogs: [
              ...item.approvalLogs,
              { ...approver, id: Date.now().toString(), timestamp: new Date().toISOString() }
            ],
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      });
      return { items };
    });
  },

  rejectKeuangan: (id, approver, catatan) => set(state => {
    const items = state.items.map(item => {
      if (item.id === id) {
        // Revert origin
        useFakturKeluaranStore.getState().updateItem(item.fakturAsliId, { status: 'Selesai' });

        return {
          ...item,
          status: "Pembatalan Ditolak" as const,
          catatanPenolakan: catatan,
          approvalLogs: [
            ...item.approvalLogs,
            { ...approver, catatan, id: Date.now().toString(), timestamp: new Date().toISOString() }
          ],
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });
    return { items };
  }),

  submitRevisi: (id, alasan, dokumen) => set(state => {
    const items = state.items.map(item => {
      if (item.id === id) {
        useFakturKeluaranStore.getState().updateItem(item.fakturAsliId, { status: 'Dalam Proses Pembatalan' });

        return {
          ...item,
          alasanPembatalan: alasan,
          dokumenPendukung: dokumen,
          status: "Menunggu Approval VP" as const,
          catatanPenolakan: undefined,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });
    return { items };
  }),

  getByFakturAsliId: (fakturAsliId) => {
    return get().items.find(i => i.fakturAsliId === fakturAsliId);
  },

  getByRole: (role, _badge, unitKerja) => {
    const { items } = get();
    if (role === 'admin' || role === 'keuangan' || role === 'user') return items;
    if (role === 'vp' || role === 'requester') return items.filter(item => item.unitKerja === unitKerja);
    return [];
  },

  getPendingCount: (role, badge, unitKerja) => {
    const items = get().getByRole(role, badge, unitKerja);
    if (role === 'vp') {
      return items.filter(item => item.status === 'Menunggu Approval VP' && item.assignedVPId === badge).length;
    }
    if (role === 'keuangan') {
      return items.filter(item => item.status === 'Menunggu Approval Keuangan').length;
    }
    if (role === 'requester') {
      return items.filter(item => item.status === 'Ditolak' || item.status === 'Revisi').length;
    }
    return 0; // admin / lain-lain
  }
}));

// Initialize dummy after export
usePembatalanFakturStore.setState({ items: createDummyData() });
