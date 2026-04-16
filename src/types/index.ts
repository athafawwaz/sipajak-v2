export interface FakturPajak {
  id: string;
  no: number;
  tanggal: string;
  noMVP: string;
  nomorFakturPajak: string;
  kodeFakturSAP: 'BV' | 'BZ';
  namaPerusahaan: string;
  nilaiDPP?: number;
  nilaiPPN: number;
  requester: string;
  status: 'Sudah Approve' | 'Pending' | 'Ditolak';
  keterangan?: string;
  tanggalApprove?: string;
  approvedBy?: string;
  rejectionReason?: string;
  dokumen?: DokumenPDF[];
}

export interface PenyampaiInfo {
  badge: string;
  nama: string;
  unitKerja: string;
  noExtKantor: string;
  noWhatsapp: string;
  email: string;
}

export interface FakturPajakSetor {
  id: string;
  no: number;
  tipeFA: 'TA' | 'Non TA';
  tanggalPenyampaian: string;
  nomorFakturPajak: string;
  tanggalFaktur: string;
  npwpVendor: string;
  namaVendor: string;
  alamat: string;
  dpp: number;
  ppn: number;
  noAkunPerkiraanBiaya?: string;
  noBP?: string;
  badge: string;
  nama: string;
  unitKerja: string;
  noExtKantor: string;
  noWhatsapp: string;
  email: string;
  noSELKamish?: string;
  noVirtuSAP?: string;
  status: 'Sudah Approve' | 'Pending' | 'Ditolak';
  keterangan?: string;
  tanggalApprove?: string;
  approvedBy?: string;
  rejectionReason?: string;
  dokumen?: DokumenPDF[];
  createdAt?: string;
  updatedAt?: string;
}


export interface User {
  nip: string;
  name: string;
  token: string;
  email?: string;
  jabatan?: string;
  unitKerja?: string;
  noTelp?: string;
  avatar?: string;
  role?: string;
  badge?: string;
  hp?: string;
}

export type UserRole = 'requester' | 'vp' | 'keuangan' | 'admin';

export interface MasterUser {
  id: string;
  name: string;
  email: string;
  jabatan: string;
  unitKerja: string;
  noTelp: string;
  role: UserRole;
  badge: string;
  hp: string;
  status: 'Aktif' | 'Nonaktif';
  createdAt: string;
  updatedAt: string;
}

export type VendorStatus = 'Aktif' | 'Nonaktif';
export type VendorType = 'PKP' | 'Non PKP';

export interface MasterVendor {
  id: string;
  kodeVendor: string;
  namaVendor: string;
  npwp: string;
  alamat: string;
  tipeVendor: VendorType;
  noBP?: string;
  pic: string;
  noTelp: string;
  email: string;
  status: VendorStatus;
  createdAt: string;
  updatedAt: string;
}

export type MenuKey =
  | 'faktur-pajak'
  | 'faktur-pajak-setor'
  | 'kalkulator-pph-21'
  | 'edit-profil'
  | 'master-unit-kerja'
  | 'penerbitan-faktur-keluaran';

export interface MenuPermission {
  key: MenuKey;
  label: string;
  enabled: boolean;
}

export interface UnitKerja {
  id: string;
  kode: string;
  nama: string;
  deskripsi?: string;
  menuPermissions: MenuPermission[];
  createdAt: string;
  updatedAt: string;
}

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  variant: ToastVariant;
}

export interface Tunjangan {
  id: string;
  nama: string;
  nilai: number;
}

export type StatusPTKP = 'TK/0' | 'TK/1' | 'TK/2' | 'TK/3' | 'K/0' | 'K/1' | 'K/2' | 'K/3';

export interface ApprovalLog {
  id: string;
  step: 1 | 2;
  role: 'vp' | 'keuangan';
  approverName: string;
  approverBadge: string;
  action: 'approve' | 'reject' | 'assign_vp';
  catatan?: string;
  timestamp: string;
}

export interface DokumenPDF {
  id: string;
  namaFile: string;
  ukuran: number;           // bytes
  url: string;              // URL for mock or actual backend
  uploadedAt: string;
}

export interface PenerbitanFakturKeluaran {
  id: string;
  no: number;
  tanggalRequestFP: string;
  noSONoDoc: string;
  tanggalSO: string;
  namaCustomer: string;
  npwp: string;
  totalTagihan: number;
  nilaiTransaksi: number;
  dpp: number;
  ppn: number;
  keteranganTransaksi?: string;
  quantity?: number;
  alamat?: string;
  requesterNama: string;
  requesterBadge: string;
  unitKerja: string;
  hp: string;
  nomorFakturPajak?: string;
  tanggalFakturPajak?: string;
  dokumen: DokumenPDF[];
  jenisFaktur: 'Subsidi' | 'Non Subsidi';
  status: 
    | 'Draft'
    | 'Menunggu Assign VP'
    | 'Menunggu Approval VP'
    | 'Menunggu Approval Keuangan'
    | 'Selesai'
    | 'Ditolak'
    | 'Revisi'
    | 'Dalam Proses Pembatalan'
    | 'Dibatalkan';
  assignedVPId?: string;
  assignedVPNama?: string;
  approvalLogs: ApprovalLog[];
  catatanPenolakan?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PembatalanFakturPajak {
  id: string;
  no: number;

  // === REFERENSI KE FAKTUR ASLI ===
  fakturAsliId: string;             // ID dari PenerbitanFakturKeluaran

  // === DATA DIAMBIL OTOMATIS DARI FAKTUR ASLI (read-only) ===
  tanggalRequestFP: string;
  noSONoDoc: string;
  tanggalSO: string;
  namaCustomer: string;
  npwp: string;
  totalTagihan: number;
  nilaiTransaksi: number;
  dpp: number;
  ppn: number;
  keteranganTransaksi?: string;
  quantity?: number;
  alamat?: string;
  requesterNama: string;
  requesterBadge: string;
  unitKerja: string;
  hp: string;
  nomorFakturPajak: string;         // wajib ada karena faktur sudah "Selesai"
  tanggalFakturPajak: string;
  jenisFaktur: 'Subsidi' | 'Non Subsidi';

  // === DATA SPESIFIK PEMBATALAN ===
  alasanPembatalan: string;         // required, min 20 karakter
  dokumenPendukung: DokumenPDF[];   // opsional, max 3 file PDF
  
  // === WORKFLOW ===
  status:
    | 'Menunggu Approval VP'
    | 'Menunggu Approval Keuangan'
    | 'Pembatalan Disetujui'
    | 'Pembatalan Ditolak'
    | 'Revisi';
  assignedVPId?: string;
  assignedVPNama?: string;
  approvalLogs: ApprovalLog[];      // reuse interface yang sudah ada
  catatanPenolakan?: string;

  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
