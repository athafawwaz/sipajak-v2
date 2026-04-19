import React, { useState } from 'react';
import { X, FileText, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { PembatalanFakturPajak } from '../../types';
import { useAuthStore } from '../../store/authStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: PembatalanFakturPajak | null;
  onApprove: (id: string, notes?: string) => void;
  onReject: (id: string, notes: string) => void;
}

const ModalDetailApprovalBatal: React.FC<Props> = ({
  isOpen,
  onClose,
  data,
  onApprove,
  onReject
}) => {
  const [activeTab, setActiveTab] = useState<'detail' | 'dokumen' | 'riwayat'>('detail');
  const [notes, setNotes] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const { user } = useAuthStore();

  if (!isOpen || !data) return null;

  const role = user?.role || '';
  const isVP = role === 'vp';
  const isKeuangan = role === 'keuangan';

  const showApprovalActions = 
    (isVP && data.status === 'Menunggu Approval VP' && data.assignedVPId === user?.badge) ||
    (isKeuangan && data.status === 'Menunggu Approval Keuangan');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  const handleApprove = () => {
    onApprove(data.id, notes);
  };

  const handleReject = () => {
    if (!notes.trim()) {
      alert('Catatan penolakan wajib diisi');
      return;
    }
    onReject(data.id, notes);
    setIsRejecting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Detail Pengajuan Pembatalan</h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <span>{data.namaCustomer}</span>
              <span>•</span>
              <span>{data.nomorFakturPajak}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center px-6 border-b border-gray-200">
          {(['detail', 'dokumen', 'riwayat'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize',
                activeTab === tab
                  ? 'border-accent text-accent'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {tab === 'dokumen' ? `Dokumen (${data.dokumenPendukung.length})` : tab.replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
          {activeTab === 'detail' && (
            <div className="space-y-6">
              {/* Alasan Pembatalan Highlight */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
                <h3 className="text-amber-800 font-semibold mb-2">Alasan Pembatalan:</h3>
                <p className="text-amber-900 text-sm">{data.alasanPembatalan}</p>
              </div>

              {/* Data Faktur Asli */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-gray-900">Informasi Faktur Asli</h3>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">No. SO / Doc SAP</label>
                    <p className="text-sm font-medium text-gray-900">{data.noSONoDoc}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Tanggal SO</label>
                    <p className="text-sm font-medium text-gray-900">{data.tanggalSO}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Nama Customer</label>
                    <p className="text-sm font-medium text-gray-900">{data.namaCustomer}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">NPWP</label>
                    <p className="text-sm font-medium text-gray-900">{data.npwp}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Keterangan Transaksi</label>
                    <p className="text-sm font-medium text-gray-900">{data.keteranganTransaksi || '-'}</p>
                  </div>
                  
                  <div className="sm:col-span-2 grid grid-cols-3 gap-4 pt-4 border-t">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Nilai Transaksi</label>
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(data.nilaiTransaksi)}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">DPP</label>
                      <p className="text-sm font-bold text-emerald-600">{formatCurrency(data.dpp)}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">PPN</label>
                      <p className="text-sm font-bold text-red-600">{formatCurrency(data.ppn)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dokumen' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-gray-900">Dokumen Pendukung Pembatalan</h3>
                </div>
                <div className="p-5">
                  {data.dokumenPendukung && data.dokumenPendukung.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {data.dokumenPendukung.map((doc, idx) => (
                        <a
                          key={idx}
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-accent hover:shadow-md transition-all group"
                        >
                          <div className="w-12 h-12 rounded-lg bg-red-50 text-red-500 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{doc.namaFile}</p>
                            <p className="text-xs text-gray-500">{(doc.ukuran / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      Tidak ada dokumen pendukung pembatalan.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'riwayat' && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 w-full max-w-2xl mx-auto">
              {/* timeline logic similar to other approval logs */}
              {data.approvalLogs.length > 0 ? (
                <div className="relative pl-4 border-l-2 border-gray-100 space-y-8">
                  {data.approvalLogs.map((log, idx) => (
                    <div key={idx} className="relative">
                      <div className={cn(
                        "absolute -left-[21px] w-10 h-10 rounded-full border-4 border-white flex items-center justify-center",
                        log.action === 'approve' ? "bg-green-100 text-green-600" :
                        log.action === 'reject' ? "bg-red-100 text-red-600" :
                        "bg-blue-100 text-blue-600"
                      )}>
                        {log.action === 'approve' ? <CheckCircle className="w-5 h-5" /> : 
                         log.action === 'reject' ? <XCircle className="w-5 h-5" /> :
                         <FileText className="w-5 h-5" />}
                      </div>
                      <div className="pl-6">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">{log.approverName}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                            {log.role.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">
                          {new Date(log.timestamp).toLocaleString('id-ID', {
                            dateStyle: 'medium', timeStyle: 'short'
                          })}
                        </p>
                        {log.catatan && (
                          <div className={cn(
                            "p-3 rounded-lg text-sm",
                            log.action === 'reject' ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-700"
                          )}>
                            <span className="font-medium">Catatan:</span> {log.catatan}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Belum ada riwayat approval.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {showApprovalActions && (
          <div className="border-t border-gray-200 bg-white p-4 sm:p-6">
            {!isRejecting ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catatan Approval/Penolakan <span className="text-gray-400 font-normal">(Opsional untuk Approve)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent text-sm resize-none"
                    placeholder="Tambahkan catatan jika diperlukan..."
                  />
                </div>
                {isKeuangan && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 text-red-800 text-sm">
                    <strong>Peringatan FINAL:</strong> Menyetujui ini akan resmi membatalkan Faktur {data.nomorFakturPajak}.
                  </div>
                )}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setIsRejecting(true)}
                    className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50"
                  >
                    Tolak Pembatalan
                  </button>
                  <button
                    onClick={handleApprove}
                    className="px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700"
                  >
                    {isKeuangan ? "Final Setujui Pembatalan" : "Setujui Pembatalan"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-red-800 font-medium mb-2 flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    Konfirmasi Penolakan
                  </h4>
                  <label className="block text-sm font-medium text-red-900 mb-1">
                    Alasan Penolakan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    autoFocus
                    className="w-full px-3 py-2 bg-white border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm resize-none"
                    placeholder="Wajib mengisi alasan penolakan pengajuan pembatalan ini..."
                  />
                </div>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => { setIsRejecting(false); setNotes(''); }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Kembali
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={!notes.trim()}
                    className="px-6 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Konfirmasi Tolak
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalDetailApprovalBatal;
