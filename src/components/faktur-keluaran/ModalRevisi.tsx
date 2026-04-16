import React, { useState } from 'react';
import ModalInputFaktur from './ModalInputFaktur';
import type { PenerbitanFakturKeluaran } from '../../types';
import { AlertCircle } from 'lucide-react';

interface ModalRevisiProps {
  isOpen: boolean;
  onClose: () => void;
  data: PenerbitanFakturKeluaran | null;
  onSubmit: (id: string, data: Partial<PenerbitanFakturKeluaran>) => void;
}

const ModalRevisi: React.FC<ModalRevisiProps> = ({ isOpen, onClose, data, onSubmit }) => {
  if (!data) return null;

  const handleSubmit = (newData: Partial<PenerbitanFakturKeluaran>, _isDraft: boolean) => {
    onSubmit(data.id, newData);
  };

  return (
    <>
      <ModalInputFaktur
        isOpen={isOpen}
        onClose={onClose}
        initialData={data}
        onSubmit={handleSubmit}
      />
      
      {/* We inject the rejection note somehow. ModalInputFaktur is full modal. 
          So instead of rendering ModalInputFaktur inside here (which would overlap), 
          we can render the warning inside an absolute portal or rewrite this slightly differently.
          For simplicity in mock, we will overlay the rejection note.
      */}
      {isOpen && (
        <div className="fixed z-[60] top-4 left-1/2 -translate-x-1/2 w-full max-w-xl animate-scale-in">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 shadow-xl rounded-r-xl flex items-start gap-3">
            <AlertCircle className="text-red-500 shrink-0 w-6 h-6" />
            <div>
              <h4 className="font-bold text-red-900 text-sm">Alasan Penolakan</h4>
              <p className="text-sm text-red-800">{data.catatanPenolakan || 'Tidak ada catatan'}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ModalRevisi;
