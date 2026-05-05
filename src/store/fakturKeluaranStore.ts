import { create } from 'zustand';
import type { PenerbitanFakturKeluaran, ApprovalLog, DokumenPDF } from '../types';
import { useMasterUserStore } from './masterUserStore';

export interface FakturKeluaranStore {
  items: PenerbitanFakturKeluaran[];

  // Actions
  addItem: (data: Omit<PenerbitanFakturKeluaran, 'id' | 'no' | 'approvalLogs' | 'createdAt' | 'updatedAt'>) => void;
  updateItem: (id: string, data: Partial<PenerbitanFakturKeluaran>) => void;
  deleteItem: (id: string) => void;
  bulkDelete: (ids: string[]) => void;

  // Workflow actions
  submitPengajuan: (id: string) => void;
  approveVP: (id: string, approver: Omit<ApprovalLog, 'timestamp' | 'id'>) => void;
  rejectVP: (id: string, approver: Omit<ApprovalLog, 'timestamp' | 'id'>, catatan: string) => void;
  assignVP: (id: string, vpId: string, vpNama: string) => void;
  approveKeuangan: (id: string, approver: Omit<ApprovalLog, 'timestamp' | 'id'>, nomorFaktur: string, tanggalFaktur: string, dokumen: DokumenPDF[]) => void;
  rejectKeuangan: (id: string, approver: Omit<ApprovalLog, 'timestamp' | 'id'>, catatan: string) => void;
  submitRevisi: (id: string, data: Partial<PenerbitanFakturKeluaran>) => void;

  // Selectors
  getByRole: (role?: string, badge?: string, unitKerja?: string) => PenerbitanFakturKeluaran[];
  getPendingCount: (role?: string, badge?: string, unitKerja?: string) => number;
}

// Dummy data setup based on screenshot/prompt realistic data
const createDummyData = (): PenerbitanFakturKeluaran[] => {
  const dummy: PenerbitanFakturKeluaran[] = [
    {
      id: "FK-001",
      no: 1,
      tanggalRequestFP: "08/07/2024",
      noSONoDoc: "3820285949",
      tanggalSO: "01/07/2024",
      namaCustomer: "BPJS Kesehatan Divisi Regional X",
      npwp: "00.000.000.0-000.000",
      nilaiTransaksi: 281081081,
      dpp: 257657491,
      ppn: 30918919,
      totalTagihan: 312000000,
      requesterNama: "Handika Pranajaya",
      requesterBadge: "6121509",
      unitKerja: "DEPARTEMEN TEKNOLOGI INFORMASI",
      hp: "082175433331",
      jenisFaktur: "Subsidi",
      status: "Selesai",
      nomorFakturPajak: "010.008-24.24104051",
      tanggalFakturPajak: "02/07/2024",
      dokumen: [{ id: "doc1", namaFile: "invoice.pdf", ukuran: 1048576, url: "#", uploadedAt: new Date().toISOString() }],
      approvalLogs: [{
        id: "log1", step: 1, role: "vp", approverName: "Cipta Atsahlantusay", approverBadge: "6121501", action: "approve", timestamp: new Date().toISOString() 
      }, {
        id: "log2", step: 2, role: "keuangan", approverName: "Siti Rahayu", approverBadge: "KEU001", action: "approve", timestamp: new Date().toISOString()
      }],
      createdBy: "6121509",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "FK-002",
      no: 2,
      tanggalRequestFP: "10/07/2024",
      noSONoDoc: "3820285950",
      tanggalSO: "05/07/2024",
      namaCustomer: "PT Bina Usaha",
      npwp: "01.234.567.8-000.000",
      nilaiTransaksi: 15000000,
      dpp: 13636363,
      ppn: 1636363,
      totalTagihan: 15000000, // as assumption
      requesterNama: "Handika Pranajaya", // match our dummy logged in
      requesterBadge: "6121509",
      unitKerja: "DEPARTEMEN TEKNOLOGI INFORMASI",
      hp: "082175433331",
      jenisFaktur: "Non Subsidi",
      status: "Menunggu Approval VP",
      dokumen: [],
      approvalLogs: [],
      assignedVPId: "6121501",
      assignedVPNama: "Cipta Atsahlantusay",
      createdBy: "6121509",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "FK-003",
      no: 3,
      tanggalRequestFP: "11/07/2024",
      noSONoDoc: "3820285951",
      tanggalSO: "06/07/2024",
      namaCustomer: "CV Karsa Cipta",
      npwp: "02.345.678.9-000.000",
      nilaiTransaksi: 20000000,
      dpp: 18181818,
      ppn: 2181818,
      totalTagihan: 20000000,
      requesterNama: "Handika Pranajaya",
      requesterBadge: "6121509",
      unitKerja: "DEPARTEMEN TEKNOLOGI INFORMASI",
      hp: "082175433331",
      jenisFaktur: "Subsidi",
      status: "Menunggu Approval Keuangan",
      dokumen: [],
      approvalLogs: [
        { id: "l1", step: 1, role: "vp", approverName: "Cipta Atsahlantusay", approverBadge: "6121501", action: "approve", timestamp: new Date().toISOString() }
      ],
      assignedVPId: "6121501",
      assignedVPNama: "Cipta Atsahlantusay",
      createdBy: "6121509",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "FK-004",
      no: 4,
      tanggalRequestFP: "12/07/2024",
      noSONoDoc: "3820285952", // Duplicate SO doc for testing
      tanggalSO: "06/07/2024",
      namaCustomer: "CV Karsa Cipta",
      npwp: "02.345.678.9-000.000",
      nilaiTransaksi: 5000000,
      dpp: 4545454,
      ppn: 545454,
      totalTagihan: 5000000,
      requesterNama: "Handika Pranajaya",
      requesterBadge: "6121509",
      unitKerja: "DEPARTEMEN TEKNOLOGI INFORMASI",
      hp: "082175433331",
      jenisFaktur: "Subsidi",
      status: "Ditolak",
      catatanPenolakan: "Dokumen kurang jelas, mohon upload ulang scan warna",
      dokumen: [],
      approvalLogs: [
        { id: "l1", step: 1, role: "vp", approverName: "Cipta Atsahlantusay", approverBadge: "6121501", action: "reject", catatan: "Dokumen kurang jelas, mohon upload ulang scan warna", timestamp: new Date().toISOString() }
      ],
      assignedVPId: "6121501",
      assignedVPNama: "Cipta Atsahlantusay",
      createdBy: "6121509",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Tambahan data dummy acak untuk mencapai 15+ baris
  const customers = ["PT Indofood", "PT Astra", "CV Maju Jaya", "Toko Sinar Makmur", "PT PLN Persero"];
  const statuses: PenerbitanFakturKeluaran['status'][] = ['Draft', 'Selesai', 'Selesai', 'Selesai', 'Selesai', 'Selesai', 'Menunggu Approval VP', 'Menunggu Approval Keuangan'];
  
  for (let i = 6; i <= 25; i++) {
    const nilai = Math.floor(Math.random() * 500 + 10) * 1000000;
    const dpp = Math.floor((11/12) * nilai);
    const ppn = Math.floor(0.11 * nilai);
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    let approvalLogs: ApprovalLog[] = [];
    
    // Generate appropriate approval logs based on status
    if (status === 'Selesai' || status === 'Ditolak' || status === 'Revisi' || status === 'Menunggu Approval Keuangan') {
      // Setup base submission log
      const assignedVP = "Cipta Atsahlantusay";
      const assignedVPId = "6121501";
      
      approvalLogs.push({
        id: `log-${i}-assign`,
        step: 0,
        role: "keuangan",
        approverName: "Sistem",
        approverBadge: "SYS",
        action: "assign_vp",
        catatan: `Assigned to ${assignedVP} (${assignedVPId})`,
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      });

      if (status === 'Selesai') {
        approvalLogs.push(
          { id: `log-${i}-vp`, step: 1, role: "vp", approverName: "Cipta Atsahlantusay", approverBadge: "6121501", action: "approve", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
          { id: `log-${i}-keu`, step: 2, role: "keuangan", approverName: "Siti Rahayu", approverBadge: "KEU001", action: "approve", timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
        );
      } else if (status === 'Menunggu Approval Keuangan') {
        approvalLogs.push(
          { id: `log-${i}-vp`, step: 1, role: "vp", approverName: "Cipta Atsahlantusay", approverBadge: "6121501", action: "approve", timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
        );
      } else if (status === 'Ditolak') {
        // Randomly reject at VP or Keuangan stage
        const rejectAtVP = Math.random() > 0.5;
        if (rejectAtVP) {
          approvalLogs.push(
            { id: `log-${i}-vp-rej`, step: 1, role: "vp", approverName: "Cipta Atsahlantusay", approverBadge: "6121501", action: "reject", catatan: "Data tidak sesuai dengan dokumen fisik.", timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
          );
        } else {
          approvalLogs.push(
            { id: `log-${i}-vp`, step: 1, role: "vp", approverName: "Cipta Atsahlantusay", approverBadge: "6121501", action: "approve", timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
            { id: `log-${i}-keu-rej`, step: 2, role: "keuangan", approverName: "Siti Rahayu", approverBadge: "KEU001", action: "reject", catatan: "Nominal PPN tidak match dengan hitungan sistem.", timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
          );
        }
      }
    }

    dummy.push({
      id: `FK-00${i}`,
      no: i,
      tanggalRequestFP: `15/07/2024`,
      noSONoDoc: `38202859${i + 50}`,
      tanggalSO: `12/07/2024`,
      namaCustomer: customers[i % 5],
      npwp: `0${i % 9}.000.000.0-000.000`,
      nilaiTransaksi: nilai,
      dpp: dpp,
      ppn: ppn,
      totalTagihan: nilai + ppn,
      requesterNama: i % 3 === 0 ? "Yunelia" : "Handika Pranajaya",
      requesterBadge: i % 3 === 0 ? "121822" : "6121509",
      unitKerja: i % 3 === 0 ? "ADM Aset" : "DEPARTEMEN TEKNOLOGI INFORMASI",
      hp: "082175433331",
      jenisFaktur: i % 2 === 0 ? "Subsidi" : "Non Subsidi",
      status: status,
      dokumen: status === 'Selesai' ? [{ id: `doc${i}`, namaFile: `faktur-${i}.pdf`, ukuran: 800000, url: "#", uploadedAt: new Date().toISOString() }] : [],
      approvalLogs: approvalLogs,
      catatanPenolakan: status === 'Ditolak' ? approvalLogs[approvalLogs.length - 1]?.catatan : undefined,
      assignedVPId: status !== 'Draft' && status !== 'Menunggu Assign VP' ? "6121501" : undefined,
      assignedVPNama: status !== 'Draft' && status !== 'Menunggu Assign VP' ? "Cipta Atsahlantusay" : undefined,
      nomorFakturPajak: status === 'Selesai' ? `010.008-24.241040${i}` : undefined,
      tanggalFakturPajak: status === 'Selesai' ? '20/07/2024' : undefined,
      createdBy: i % 3 === 0 ? "121822" : "6121509",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  // --- Bulk Approval Test Data: 15 items Subsidi + Menunggu Approval Keuangan ---
  const bulkCustomers = [
    "PT Telkom Indonesia", "PT Pertamina Persero", "PT Bank Mandiri Tbk",
    "PT Garuda Indonesia", "CV Sejahtera Abadi", "PT Semen Indonesia",
    "PT Krakatau Steel", "PT Bukit Asam", "PT Timah Tbk",
    "PT Aneka Tambang", "PT Waskita Karya", "PT Wijaya Karya",
    "PT Adhi Karya", "PT Jasa Marga", "PT INKA Persero"
  ];
  const bulkRequesters = [
    { nama: "Handika Pranajaya", badge: "6121509", unitKerja: "DEPARTEMEN TEKNOLOGI INFORMASI" },
    { nama: "Yunelia", badge: "121822", unitKerja: "ADM Aset" },
    { nama: "Ahmad Fauzi", badge: "6121510", unitKerja: "DEPARTEMEN PEMASARAN" },
  ];

  for (let i = 0; i < 15; i++) {
    const idx = 26 + i;
    const nilai = Math.floor((Math.random() * 800 + 50) * 1000000);
    const dppVal = Math.floor((11 / 12) * nilai);
    const ppnVal = Math.floor(0.11 * nilai);
    const req = bulkRequesters[i % 3];
    const day = String((i % 28) + 1).padStart(2, '0');

    dummy.push({
      id: `FK-BULK-${String(i + 1).padStart(3, '0')}`,
      no: idx,
      tanggalRequestFP: `${day}/07/2024`,
      noSONoDoc: `50100${String(70000 + i)}`,
      tanggalSO: `${day}/07/2024`,
      namaCustomer: bulkCustomers[i],
      npwp: `0${(i % 9) + 1}.${String(100 + i)}.${String(200 + i)}.0-000.000`,
      nilaiTransaksi: nilai,
      dpp: dppVal,
      ppn: ppnVal,
      totalTagihan: nilai + ppnVal,
      requesterNama: req.nama,
      requesterBadge: req.badge,
      unitKerja: req.unitKerja,
      hp: "082175433331",
      jenisFaktur: "Subsidi",
      status: "Menunggu Approval Keuangan",
      dokumen: [],
      approvalLogs: [
        {
          id: `log-bulk-${i}-assign`,
          step: 0,
          role: "keuangan",
          approverName: "Sistem",
          approverBadge: "SYS",
          action: "assign_vp",
          catatan: "Assigned to Cipta Atsahlantusay (6121501)",
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: `log-bulk-${i}-vp`,
          step: 1,
          role: "vp",
          approverName: "Cipta Atsahlantusay",
          approverBadge: "6121501",
          action: "approve",
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      assignedVPId: "6121501",
      assignedVPNama: "Cipta Atsahlantusay",
      createdBy: req.badge,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  // --- Non Subsidi Approval Test Data: 5 items Menunggu Approval Keuangan ---
  const nonSubsidiCustomers = [
    "PT Astra Honda Motor", "PT Toyota Astra Motor", "PT Unilever Indonesia",
    "PT Indofood CBP", "PT Gudang Garam"
  ];
  for (let i = 0; i < 5; i++) {
    const idx = 50 + i;
    const nilai = Math.floor((Math.random() * 500 + 50) * 1000000);
    const dppVal = Math.floor((11 / 12) * nilai);
    const ppnVal = Math.floor(0.11 * nilai);
    
    dummy.push({
      id: `FK-NON-SUB-${String(i + 1).padStart(3, '0')}`,
      no: idx,
      tanggalRequestFP: `15/07/2024`,
      noSONoDoc: `60100${String(70000 + i)}`,
      tanggalSO: `12/07/2024`,
      namaCustomer: nonSubsidiCustomers[i],
      npwp: `0${(i % 9) + 1}.${String(200 + i)}.${String(300 + i)}.0-000.000`,
      nilaiTransaksi: nilai,
      dpp: dppVal,
      ppn: ppnVal,
      totalTagihan: nilai + ppnVal,
      requesterNama: "Ahmad Fauzi",
      requesterBadge: "6121510",
      unitKerja: "DEPARTEMEN PEMASARAN",
      hp: "081278900001",
      jenisFaktur: "Non Subsidi",
      status: "Menunggu Approval Keuangan",
      dokumen: [],
      approvalLogs: [
        {
          id: `log-nonsub-${i}-assign`,
          step: 0,
          role: "keuangan",
          approverName: "Sistem",
          approverBadge: "SYS",
          action: "assign_vp",
          catatan: "Assigned to Cipta Atsahlantusay (6121501)",
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: `log-nonsub-${i}-vp`,
          step: 1,
          role: "vp",
          approverName: "Cipta Atsahlantusay",
          approverBadge: "6121501",
          action: "approve",
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      assignedVPId: "6121501",
      assignedVPNama: "Cipta Atsahlantusay",
      createdBy: "6121510",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  return dummy;
};

export const useFakturKeluaranStore = create<FakturKeluaranStore>((set, get) => ({
  items: createDummyData(),

  addItem: (data) => set((state) => {
    const newItem: PenerbitanFakturKeluaran = {
      ...data,
      id: `FK-${Date.now()}`,
      no: state.items.length + 1,
      approvalLogs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return { items: [newItem, ...state.items] };
  }),

  updateItem: (id, data) => set((state) => ({
    items: state.items.map(item => item.id === id ? { ...item, ...data, updatedAt: new Date().toISOString() } : item)
  })),

  deleteItem: (id) => set((state) => ({
    items: state.items.filter(item => item.id !== id)
  })),

  bulkDelete: (ids) => set((state) => ({
    items: state.items.filter(item => !ids.includes(item.id))
  })),

  submitPengajuan: (id) => set((state) => {
    const masterUsers = useMasterUserStore.getState().data;
    return {
      items: state.items.map(item => {
        if (item.id === id) {
          let assignedVPId = item.assignedVPId;
          let assignedVPNama = item.assignedVPNama;

          if (!assignedVPId) {
            const vp = masterUsers.find(u => u.unitKerja === item.unitKerja && u.role === 'vp');
            if (vp) {
              assignedVPId = vp.badge;
              assignedVPNama = vp.name;
            }
          }

          const nextStatus = assignedVPId ? "Menunggu Approval VP" : "Menunggu Assign VP";
          return { 
            ...item, 
            status: nextStatus, 
            assignedVPId,
            assignedVPNama,
            updatedAt: new Date().toISOString() 
          };
        }
        return item;
      })
    };
  }),

  approveVP: (id, approver) => set((state) => ({
    items: state.items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: "Menunggu Approval Keuangan",
          approvalLogs: [
            ...item.approvalLogs,
            { ...approver, id: Date.now().toString(), timestamp: new Date().toISOString() }
          ],
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    })
  })),

  rejectVP: (id, approver, catatan) => set((state) => ({
    items: state.items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: "Ditolak",
          catatanPenolakan: catatan,
          approvalLogs: [
            ...item.approvalLogs,
            { ...approver, catatan, id: Date.now().toString(), timestamp: new Date().toISOString() }
          ],
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    })
  })),

  assignVP: (id, vpId, vpNama) => set((state) => ({
    items: state.items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: "Menunggu Approval VP",
          assignedVPId: vpId,
          assignedVPNama: vpNama,
          approvalLogs: [
            ...item.approvalLogs,
            {
              id: Date.now().toString(),
              step: 1,
              role: "keuangan",
              approverName: "Sistem", // or logic from user
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

  approveKeuangan: (id, approver, nomorFaktur, tanggalFaktur, dokumen) => set((state) => ({
    items: state.items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: "Selesai",
          nomorFakturPajak: nomorFaktur,
          tanggalFakturPajak: tanggalFaktur,
          dokumen: dokumen,
          approvalLogs: [
            ...item.approvalLogs,
            { ...approver, id: Date.now().toString(), timestamp: new Date().toISOString() }
          ],
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    })
  })),

  rejectKeuangan: (id, approver, catatan) => set((state) => ({
    items: state.items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: "Ditolak",
          catatanPenolakan: catatan,
          approvalLogs: [
            ...item.approvalLogs,
            { ...approver, catatan, id: Date.now().toString(), timestamp: new Date().toISOString() }
          ],
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    })
  })),

  submitRevisi: (id, data) => set((state) => ({
    items: state.items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          ...data,
          status: item.assignedVPId ? "Menunggu Approval VP" : "Menunggu Assign VP",
          catatanPenolakan: undefined,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    })
  })),

  getByRole: (role, _badge, unitKerja) => {
    const { items } = get();
    if (role === 'admin' || role === 'keuangan') return items;
    if (role === 'vp' || role === 'requester') return items.filter(item => item.unitKerja === unitKerja);
    return [];
  },

  getPendingCount: (role, badge, unitKerja) => {
    const items = get().getByRole(role, badge, unitKerja);
    if (role === 'vp') {
      return items.filter(item => item.status === 'Menunggu Approval VP' && item.assignedVPId === badge).length;
    }
    if (role === 'keuangan') {
      return items.filter(item => item.status === 'Menunggu Approval Keuangan' || item.status === 'Menunggu Assign VP').length;
    }
    if (role === 'requester') {
      return items.filter(item => item.status === 'Ditolak' || item.status === 'Revisi').length;
    }
    return 0; // admin / lain-lain
  }
}));
