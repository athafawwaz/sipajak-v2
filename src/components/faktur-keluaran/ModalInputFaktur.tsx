import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import DokumenUploader from './DokumenUploader';
import { useAuthStore } from '../../store/authStore';
import type { DokumenPDF, PenerbitanFakturKeluaran } from '../../types';

interface ModalInputFakturProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<PenerbitanFakturKeluaran>, isDraft: boolean) => void;
  initialData?: Partial<PenerbitanFakturKeluaran> | null;
}

const ModalInputFaktur: React.FC<ModalInputFakturProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData
}) => {
  const { user } = useAuthStore();
  
  const [formData, setFormData] = useState({
    tanggalRequestFP: new Date().toISOString().split('T')[0],
    noSONoDoc: '',
    tanggalSO: '',
    namaCustomer: '',
    npwp: '',
    alamat: '',
    nilaiTransaksi: 0,
    quantity: 0,
    keteranganTransaksi: '',
    hp: user?.hp || '',
  });

  const [dokumen, setDokumen] = useState<DokumenPDF[]>([]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        tanggalRequestFP: initialData.tanggalRequestFP || new Date().toISOString().split('T')[0],
        noSONoDoc: initialData.noSONoDoc || '',
        tanggalSO: initialData.tanggalSO || '',
        namaCustomer: initialData.namaCustomer || '',
        npwp: initialData.npwp || '',
        alamat: initialData.alamat || '',
        nilaiTransaksi: initialData.nilaiTransaksi || 0,
        quantity: initialData.quantity || 0,
        keteranganTransaksi: initialData.keteranganTransaksi || '',
        hp: initialData.hp || user?.hp || '',
      });
      setDokumen(initialData.dokumen || []);
    } else if (isOpen) {
      // Reset
      setFormData({
        tanggalRequestFP: new Date().toISOString().split('T')[0],
        noSONoDoc: '',
        tanggalSO: '',
        namaCustomer: '',
        npwp: '',
        alamat: '',
        nilaiTransaksi: 0,
        quantity: 0,
        keteranganTransaksi: '',
        hp: user?.hp || '',
      });
      setDokumen([]);
    }
  }, [isOpen, initialData, user]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const dpp = Math.floor((11 / 12) * formData.nilaiTransaksi);
  const ppn = Math.floor(0.11 * formData.nilaiTransaksi);
  const totalTagihan = formData.nilaiTransaksi + ppn;

  const handleSubmit = (isDraft: boolean) => {
    onSubmit({
      ...formData,
      dpp,
      ppn,
      totalTagihan,
      dokumen,
      requesterNama: user?.name || '',
      requesterBadge: user?.badge || '',
      unitKerja: user?.unitKerja || '',
    }, isDraft);
  };

  const isFormValid = formData.noSONoDoc && formData.namaCustomer && formData.nilaiTransaksi > 0 && dokumen.length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Revisi Faktur Keluaran" : "Input Faktur Keluaran"} size="xl">
      <div className="space-y-6 pb-6">
        {/* Section 1 - Data Request */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 border-b pb-2">1. Data Request</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Tanggal Request FP"
              type="date"
              value={formData.tanggalRequestFP}
              onChange={(e) => handleInputChange('tanggalRequestFP', e.target.value)}
              required
            />
            <Input
              label="No. SO / No. Doc SAP"
              value={formData.noSONoDoc}
              onChange={(e) => handleInputChange('noSONoDoc', e.target.value)}
              required
            />
            <Input
              label="Tanggal SO"
              type="date"
              value={formData.tanggalSO}
              onChange={(e) => handleInputChange('tanggalSO', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Section 2 - Data Customer */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 border-b pb-2">2. Data Customer</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nama Customer"
              value={formData.namaCustomer}
              onChange={(e) => handleInputChange('namaCustomer', e.target.value)}
              required
            />
            <Input
              label="NPWP"
              placeholder="00.000.000.0-000.000"
              value={formData.npwp}
              onChange={(e) => handleInputChange('npwp', e.target.value)}
              required
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Alamat</label>
              <textarea
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                rows={3}
                value={formData.alamat}
                onChange={(e) => handleInputChange('alamat', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 3 - Data Transaksi */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 border-b pb-2">3. Data Transaksi</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nilai Transaksi (Rp)"
              type="number"
              value={formData.nilaiTransaksi || ''}
              onChange={(e) => handleInputChange('nilaiTransaksi', Number(e.target.value))}
              required
            />
            <Input label="Quantity" type="number" value={formData.quantity || ''} onChange={(e) => handleInputChange('quantity', Number(e.target.value))} />
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <label className="text-xs font-semibold text-yellow-800 uppercase block mb-1">DPP (11/12 × Nilai)</label>
              <div className="text-lg font-bold text-yellow-900">Rp {dpp.toLocaleString('id-ID')}</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <label className="text-xs font-semibold text-yellow-800 uppercase block mb-1">PPN (11% × Nilai)</label>
              <div className="text-lg font-bold text-yellow-900">Rp {ppn.toLocaleString('id-ID')}</div>
            </div>
            <div className="md:col-span-2 bg-blue-50 p-3 rounded-lg border border-blue-200 flex justify-between items-center">
              <span className="font-semibold text-blue-800">Total Tagihan:</span>
              <span className="text-xl font-bold text-blue-900">Rp {totalTagihan.toLocaleString('id-ID')}</span>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Keterangan Transaksi</label>
              <textarea
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                rows={2}
                value={formData.keteranganTransaksi}
                onChange={(e) => handleInputChange('keteranganTransaksi', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 4 - Data Requester */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 border-b pb-2">4. Data Requester</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input label="Nama" value={user?.name} readOnly className="bg-gray-50 cursor-not-allowed" />
            <Input label="Badge" value={user?.badge} readOnly className="bg-gray-50 cursor-not-allowed" />
            <Input label="Unit Kerja" value={user?.unitKerja} readOnly className="bg-gray-50 cursor-not-allowed" />
            <Input label="HP / Ext" value={formData.hp} onChange={(e) => handleInputChange('hp', e.target.value)} />
          </div>
        </div>

        {/* Section 5 - Dokumen */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 border-b pb-2">5. Dokumen Pendukung</h3>
          <DokumenUploader value={dokumen} onChange={setDokumen} maxFiles={5} maxSizeMB={10} />
          {dokumen.length === 0 && <p className="text-sm text-red-500 mt-2">* Minimal 1 dokumen wajib diunggah.</p>}
        </div>

        {/* Section 6 - Info Approval */}
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <h4 className="font-semibold text-blue-900 text-sm mb-1">Informasi Workflow Approval</h4>
            <p className="text-sm text-blue-800/80">Pengajuan ini akan direview oleh VP Departemen, kemudian diteruskan ke Keuangan Pajak untuk diterbitkan Faktur Pajaknya.</p>
          </div>
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t mt-4">
        <Button variant="outline" onClick={onClose}>Batal</Button>
        <Button variant="secondary" onClick={() => handleSubmit(true)} disabled={!formData.noSONoDoc && dokumen.length === 0}>Simpan Draft</Button>
        <Button variant="primary" onClick={() => handleSubmit(false)} disabled={!isFormValid}>Submit Pengajuan</Button>
      </div>
    </Modal>
  );
};

export default ModalInputFaktur;
