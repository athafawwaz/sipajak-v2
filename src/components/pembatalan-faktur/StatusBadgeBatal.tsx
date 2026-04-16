import React from 'react';
import { cn } from '../../utils/cn';
import type { PembatalanFakturPajak } from '../../types';

interface Props {
  status: PembatalanFakturPajak['status'];
}

const StatusBadgeBatal: React.FC<Props> = ({ status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'Menunggu Approval VP':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Menunggu Approval Keuangan':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'Pembatalan Disetujui':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Pembatalan Ditolak':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Revisi':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border',
      getStatusStyles()
    )}>
      {status}
    </span>
  );
};

export default StatusBadgeBatal;
