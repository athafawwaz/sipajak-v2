import React, { useState } from 'react';
import { X, Upload, Trash2, AlertCircle, FileText } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { PenerbitanFakturKeluaran, DokumenPDF } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { usePembatalanFakturStore } from '../../store/pembatalanFakturStore';
import { useToastStore } from '../../store/toastStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  faktur: PenerbitanFakturKeluaran | null;
}

const ModalKonfirmasiPembatalan: React.FC<Props> = ({ isOpen, onClose, faktur }) => {
  const { user } = useAuthStore();
  const createPengajuan = usePembatalanFakturStore((s) => s.createPengajuan);
  const addToast = useToastStore((s) => s.addToast);

  const [alasan, setAlasan] = useState('');
  const [dokumen, setDokumen] = useState<DokumenPDF[]>([]);

  if (!isOpen || !faktur) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (dokumen.length + newFiles.length > 3) {
        addToast('Maksimal 3 file dokumen pendukung', 'error');
        return;
      }
      const mapped = newFiles.map((f) => ({
        id: `temp-${Date.now()}-${f.name}`,
        namaFile: f.name,
        ukuran: f.size,
        url: URL.createObjectURL(f),
        uploadedAt: new Date().toISOString(),
      }));
      setDokumen((prev) => [...prev, ...mapped]);
    }
  };

  const removeDokumen = (id: string) => {
    setDokumen((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (alasan.length < 20) {
      addToast('Alasan pembatalan minimal 20 karakter', 'error');
      return;
    }
    if (!user) return;

    createPengajuan(faktur.id, alasan, dokumen, user.badge);
    addToast('Pengajuan pembatalan berhasil diajukan', 'success');
    onClose();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Ajukan Pembatalan Faktur Pajak</h2>
              <p className="text-sm text-gray-500">Peringatan: Aksi ini memerlukan persetujuan VP dan Keuangan</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
              <div>
                <span className="text-gray-500 block mb-1">No. SO / Doc SAP</span>
                <span className="font-medium text-gray-900">{faktur.noSONoDoc}</span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Nama Customer</span>
                <span className="font-medium text-gray-900">{faktur.namaCustomer}</span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Nomor Faktur Pajak</span>
                <span className="font-medium text-gray-900">{faktur.nomorFakturPajak || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Nilai PPN</span>
                <span className="font-medium text-red-600">{formatCurrency(faktur.ppn)}</span>
              </div>
            </div>
          </div>

          <form id="pembatalan-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alasan Pembatalan <span className="text-red-500">*</span>
              </label>
              <textarea
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent text-sm resize-none"
                placeholder="Jelaskan alasan detail kenapa faktur ini perlu dibatalkan... (min. 20 karakter)"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Karakter: <span className={cn(alasan.length < 20 ? "text-red-500" : "text-green-600")}>{alasan.length}</span>/20 minimum
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dokumen Pendukung <span className="text-gray-400 font-normal">(Opsional, khusus PDF, max 3 file)</span>
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-accent transition-colors bg-gray-50">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-10 w-10 text-gray-400" />
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label className="relative cursor-pointer rounded-md font-medium text-accent hover:text-accent-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-accent">
                      <span>Upload file PDF</span>
                      <input type="file" className="sr-only" accept=".pdf" multiple onChange={handleFileChange} />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PDF up to 5MB</p>
                </div>
              </div>

              {dokumen.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {dokumen.map((doc) => (
                    <li key={doc.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 rounded-lg">
                          <FileText className="w-4 h-4 text-red-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate max-w-[300px]">
                            {doc.namaFile}
                          </p>
                          <p className="text-xs text-gray-500">{(doc.ukuran / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDokumen(doc.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
          >
            Batal
          </button>
          <button
            type="submit"
            form="pembatalan-form"
            disabled={alasan.length < 20}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Pengajuan
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalKonfirmasiPembatalan;
