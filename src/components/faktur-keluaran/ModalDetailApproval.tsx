import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import type { PenerbitanFakturKeluaran, DokumenPDF } from '../../types';
import ApprovalTimeline from './ApprovalTimeline';
import DokumenUploader from './DokumenUploader';
import { FileText, Download, ExternalLink } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

import { usePembatalanFakturStore } from '../../store/pembatalanFakturStore';

interface ModalDetailApprovalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PenerbitanFakturKeluaran | null;
  onApprove: (id: string, notes?: string, invoiceData?: {no: string, tgl: string, docs: DokumenPDF[]}) => void;
  onReject: (id: string, notes: string) => void;
  onAssignVP?: (item: PenerbitanFakturKeluaran) => void;
  onRevisi?: (item: PenerbitanFakturKeluaran) => void;
  onAjukanBatal?: (item: PenerbitanFakturKeluaran) => void;
  onLihatPembatalan?: () => void;
  onSubmitDraft?: (id: string) => void;
  showDokumenTab?: boolean;
}

const ModalDetailApproval: React.FC<ModalDetailApprovalProps> = ({ 
  isOpen, onClose, data, onApprove, onReject, 
  onAssignVP, onRevisi, onAjukanBatal, onLihatPembatalan, onSubmitDraft,
  showDokumenTab = true
}) => {
  const [activeTab, setActiveTab] = useState<'detail' | 'dokumen' | 'riwayat'>('detail');
  const [rejectNotes, setRejectNotes] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [nomorFaktur, setNomorFaktur] = useState('');
  const [tanggalFaktur, setTanggalFaktur] = useState('');
  const [uploadedDocs, setUploadedDocs] = useState<DokumenPDF[]>([]);

  const { user } = useAuthStore();
  const getByFakturAsliId = usePembatalanFakturStore((s) => s.getByFakturAsliId);
  const isVP = user?.role === 'vp';
  const isKeuangan = user?.role === 'keuangan';
  const isRequester = user?.role === 'requester';

  if (!data) return null;

  const canApproveVP = isVP && data.status === 'Menunggu Approval VP' && data.assignedVPId === user?.badge;
  const canApproveKeuangan = isKeuangan && data.status === 'Menunggu Approval Keuangan';
  const canAssignVP = isKeuangan && data.status === 'Menunggu Assign VP';
  const canRevisi = isRequester && data.status === 'Ditolak' && data.createdBy === user?.badge;
  const canAjukanBatal = isRequester && data.status === 'Selesai' && data.createdBy === user?.badge && !getByFakturAsliId(data.id);
  const canLihatPembatalan = isRequester && data.status === 'Dalam Proses Pembatalan' && data.createdBy === user?.badge;
  const canSubmitDraft = isRequester && data.status === 'Draft' && data.createdBy === user?.badge;

  const hasAnyAction = canApproveVP || canApproveKeuangan || canAssignVP || canRevisi || canAjukanBatal || canLihatPembatalan || canSubmitDraft;

  const handleApprove = () => {
    if (canApproveKeuangan) {
      if (!nomorFaktur || !tanggalFaktur) return; // simple validation
      onApprove(data.id, '', { no: nomorFaktur, tgl: tanggalFaktur, docs: uploadedDocs });
    } else {
      onApprove(data.id);
    }
  };

  const handleReject = () => {
    if (!rejectNotes.trim()) return;
    onReject(data.id, rejectNotes);
    setShowRejectForm(false);
    setRejectNotes('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detail Pengajuan Faktur" size="lg">
      {/* Tabs */}
      <div className="flex space-x-1 border-b mb-4">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'detail' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          onClick={() => setActiveTab('detail')}
        >
          Detail Data
        </button>
        {showDokumenTab && (
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'dokumen' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            onClick={() => setActiveTab('dokumen')}
          >
            Dokumen <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">{data.dokumen.length}</span>
          </button>
        )}
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'riwayat' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          onClick={() => setActiveTab('riwayat')}
        >
          Riwayat Approval
        </button>
      </div>

      <div className="min-h-[300px]">
        {activeTab === 'detail' && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              <div><span className="block text-gray-500 text-xs mb-1">No SO / Dok SAP</span><div className="font-medium">{data.noSONoDoc}</div></div>
              <div><span className="block text-gray-500 text-xs mb-1">Tanggal SO</span><div className="font-medium">{data.tanggalSO}</div></div>
              <div className="col-span-2"><span className="block text-gray-500 text-xs mb-1">Nama Customer</span><div className="font-medium">{data.namaCustomer}</div></div>
              <div><span className="block text-gray-500 text-xs mb-1">NPWP</span><div>{data.npwp}</div></div>
              <div><span className="block text-gray-500 text-xs mb-1">Nilai Transaksi</span><div className="font-medium">Rp {data.nilaiTransaksi.toLocaleString('id-ID')}</div></div>
              <div className="bg-yellow-50 p-2 rounded col-span-1"><span className="block text-yellow-800 text-xs mb-0.5">DPP</span><div className="font-bold text-yellow-900">Rp {data.dpp.toLocaleString('id-ID')}</div></div>
              <div className="bg-yellow-50 p-2 rounded col-span-1"><span className="block text-yellow-800 text-xs mb-0.5">PPN</span><div className="font-bold text-yellow-900">Rp {data.ppn.toLocaleString('id-ID')}</div></div>
              <div className="col-span-2"><span className="block text-gray-500 text-xs mb-1">Requester</span><div className="font-medium">{data.requesterNama} ({data.requesterBadge}) - {data.unitKerja}</div></div>
            </div>
            {data.keteranganTransaksi && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                <span className="block text-gray-500 text-xs mb-1">Keterangan</span>
                <p>{data.keteranganTransaksi}</p>
              </div>
            )}
          </div>
        )}

        {showDokumenTab && activeTab === 'dokumen' && (
          <div className="space-y-2">
            {data.dokumen.length === 0 ? <p className="text-gray-500 text-sm">Tidak ada dokumen.</p> : null}
            {data.dokumen.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-xl hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 text-red-500 rounded-lg"><FileText className="w-5 h-5" /></div>
                  <div>
                    <p className="text-sm font-medium">{doc.namaFile}</p>
                    <p className="text-xs text-gray-500">{(doc.ukuran / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <button className="p-1.5 text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-md transition-colors" title="Lihat"><ExternalLink className="w-4 h-4" /></button>
                   <button className="p-1.5 text-gray-500 hover:text-primary bg-gray-50 hover:bg-primary/10 rounded-md transition-colors" title="Download"><Download className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'riwayat' && (
          <div className="pt-2">
             <ApprovalTimeline logs={data.approvalLogs} status={data.status} />
          </div>
        )}
      </div>

      {showRejectForm ? (
         <div className="mt-6 pt-4 border-t animate-fade-in bg-red-50/50 p-4 rounded-xl border border-red-100">
           <label className="block text-sm font-medium text-red-800 mb-2">Catatan Penolakan (Wajib)</label>
           <textarea
              className="w-full rounded-lg border border-red-200 focus:ring-red-500 focus:border-red-500 p-3 text-sm"
              rows={3}
              placeholder="Berikan alasan kenapa ditolak..."
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              autoFocus
           />
           <div className="flex justify-end gap-2 mt-3">
             <Button variant="outline" size="sm" onClick={() => setShowRejectForm(false)}>Batal</Button>
             <Button variant="primary" size="sm" className="bg-red-600 hover:bg-red-700" onClick={handleReject} disabled={!rejectNotes.trim()}>Submit Penolakan</Button>
           </div>
         </div>
      ) : (
        hasAnyAction && (
          <div className="mt-6 pt-4 border-t">
            {canApproveKeuangan && (
               <div className="mb-4 pb-4 border-b">
                 <div className="grid grid-cols-2 gap-4 mb-4">
                   <Input label="Nomor Faktur Pajak" placeholder="Wajib diisi..." value={nomorFaktur} onChange={(e) => setNomorFaktur(e.target.value)} required />
                   <Input label="Tanggal Faktur Pajak" type="date" value={tanggalFaktur} onChange={(e) => setTanggalFaktur(e.target.value)} required />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1.5">Upload Dokumen Faktur Pajak (PDF) *</label>
                   <DokumenUploader
                     value={uploadedDocs}
                     onChange={setUploadedDocs}
                     maxFiles={1}
                     maxSizeMB={5}
                   />
                 </div>
               </div>
            )}
            <div className="flex justify-end gap-3 flex-wrap">
              {canAssignVP && (
                <Button variant="secondary" onClick={() => { onClose(); onAssignVP?.(data); }}>Assign VP</Button>
              )}
              {canRevisi && (
                <Button variant="outline" className="text-orange-600 hover:bg-orange-50 border-orange-200" onClick={() => { onClose(); onRevisi?.(data); }}>Revisi</Button>
              )}
              {canAjukanBatal && (
                <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => { onClose(); onAjukanBatal?.(data); }}>Ajukan Pembatalan</Button>
              )}
              {canLihatPembatalan && (
                <Button variant="outline" className="text-orange-600 hover:bg-orange-50 border-orange-200" onClick={() => { onClose(); onLihatPembatalan?.(); }}>Lihat Status Pembatalan</Button>
              )}
              {canSubmitDraft && (
                <Button variant="primary" onClick={() => { onClose(); onSubmitDraft?.(data.id); }}>Kirim Pengajuan</Button>
              )}
              {(canApproveVP || canApproveKeuangan) && (
                <>
                  <Button variant="outline" className="text-red-600 hover:bg-red-50 hover:border-red-200" onClick={() => setShowRejectForm(true)}>❌ Tolak Pengajuan</Button>
                  <Button variant="primary" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleApprove} disabled={canApproveKeuangan && (!nomorFaktur || !tanggalFaktur || uploadedDocs.length === 0)}>
                    ✅ {isVP ? 'Approve' : 'Final Approve'}
                  </Button>
                </>
              )}
            </div>
          </div>
        )
      )}
    </Modal>
  );
};

export default ModalDetailApproval;
