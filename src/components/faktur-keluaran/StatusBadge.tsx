import React from 'react';
import { cn } from '../../utils/cn';

type BadgeStatus =
  | 'Draft'
  | 'Menunggu Assign VP'
  | 'Menunggu Approval VP'
  | 'Menunggu Approval Keuangan'
  | 'Selesai'
  | 'Ditolak'
  | 'Revisi';

interface StatusBadgeProps {
  status: BadgeStatus | string;
  className?: string;
}

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  Draft: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
  'Menunggu Assign VP': { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  'Menunggu Approval VP': { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  'Menunggu Approval Keuangan': { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  Selesai: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  Ditolak: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  Revisi: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' }
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config = statusConfig[status] || statusConfig['Draft'];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-white/20 shadow-sm',
        config.bg,
        config.text,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {status}
    </span>
  );
};

export default StatusBadge;
