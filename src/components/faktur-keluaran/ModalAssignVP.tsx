import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

// Mock list of VPs
const MOCK_VPS = [
  { id: 'VP001', nama: 'Bambang Susanto', departemen: 'DIVISI OPERASI P-VI' },
  { id: 'VP002', nama: 'Iwan Setiawan', departemen: 'DIVISI KEUANGAN' },
  { id: 'VP003', nama: 'Budi Santoso', departemen: 'DIVISI SDM' },
];

interface ModalAssignVPProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (vpId: string, vpNama: string) => void;
}

const ModalAssignVP: React.FC<ModalAssignVPProps> = ({ isOpen, onClose, onAssign }) => {
  const [selectedVP, setSelectedVP] = useState('');

  const handleSubmit = () => {
    const vp = MOCK_VPS.find(v => v.id === selectedVP);
    if (!vp) return;
    onAssign(vp.id, vp.nama);
    setSelectedVP('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign VP Departemen" size="sm">
      <div className="space-y-4 pb-4">
        <p className="text-sm text-gray-600 mb-4">
          Pilih Vice President yang akan melakukan review tahap 1 pada pengajuan ini.
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Pilih VP</label>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={selectedVP}
            onChange={(e) => setSelectedVP(e.target.value)}
          >
            <option value="" disabled>-- Pilih Vice President --</option>
            {MOCK_VPS.map(vp => (
              <option key={vp.id} value={vp.id}>{vp.nama} - {vp.departemen}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 mt-6 border-t pt-4">
        <Button variant="outline" onClick={onClose}>Batal</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={!selectedVP}>Assign VP</Button>
      </div>
    </Modal>
  );
};

export default ModalAssignVP;
