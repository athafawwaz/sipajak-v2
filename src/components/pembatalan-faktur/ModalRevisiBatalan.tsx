import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2, FileText, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { PembatalanFakturPajak, DokumenPDF } from '../../types';
import { useToastStore } from '../../store/toastStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: PembatalanFakturPajak | null;
  onSubmit: (id: string, alasan: string, dokumen: DokumenPDF[]) => void;
}

const ModalRevisiBatalan: React.FC<Props> = ({
  isOpen,
  onClose,
  data,
  onSubmit
}) => {
  const addToast = useToastStore((s) => s.addToast);
  const [alasan, setAlasan] = useState('');
  const [dokumen, setDokumen] = useState<DokumenPDF[]>([]);

  useEffect(() => {
    if (data) {
      setAlasan(data.alasanPembatalan);
      setDokumen([...data.dokumenPendukung]);
    }
  }, [data]);

  if (!isOpen || !data) return null;

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
    onSubmit(data.id, alasan, dokumen);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Revisi Pembatalan Faktur</h2>
            <p className="text-sm text-gray-500">
              No. Faktur Asli: <span className="font-mono">{data.nomorFakturPajak}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Penolakan Badge */}
          {data.catatanPenolakan && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-red-800">Catatan Penolakan:</h3>
                <p className="text-sm text-red-700 mt-1">{data.catatanPenolakan}</p>
              </div>
            </div>
          )}

          <form id="revisi-batal-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alasan Pembatalan <span className="text-red-500">*</span>
              </label>
              <textarea
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent text-sm resize-none"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Karakter: <span className={cn(alasan.length < 20 ? "text-red-500" : "text-green-600")}>{alasan.length}</span>/20 minimum
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dokumen Pendukung <span className="text-gray-400 font-normal">(Max 3 file)</span>
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
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="submit"
            form="revisi-batal-form"
            disabled={alasan.length < 20}
            className="px-4 py-2 text-sm font-medium text-white bg-accent border border-transparent rounded-lg hover:bg-accent/90 disabled:opacity-50"
          >
            Submit Revisi
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalRevisiBatalan;
