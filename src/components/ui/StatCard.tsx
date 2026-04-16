import React from 'react';
import { cn } from '../../utils/cn';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
}

const colorClasses: Record<string, { bg: string; iconBg: string; text: string }> = {
  blue: {
    bg: 'bg-gradient-to-br from-blue-50 to-blue-100/50',
    iconBg: 'bg-blue-500',
    text: 'text-blue-700',
  },
  green: {
    bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50',
    iconBg: 'bg-emerald-500',
    text: 'text-emerald-700',
  },
  yellow: {
    bg: 'bg-gradient-to-br from-amber-50 to-amber-100/50',
    iconBg: 'bg-amber-500',
    text: 'text-amber-700',
  },
  red: {
    bg: 'bg-gradient-to-br from-red-50 to-red-100/50',
    iconBg: 'bg-red-500',
    text: 'text-red-700',
  },
  gray: {
    bg: 'bg-gradient-to-br from-gray-50 to-gray-100/50',
    iconBg: 'bg-gray-500',
    text: 'text-gray-700',
  },
};

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => {
  const colors = colorClasses[color];

  return (
    <div
      className={cn(
        'card p-5 flex items-center gap-4 hover:shadow-md transition-shadow duration-300',
        colors.bg
      )}
    >
      <div className={cn('p-3 rounded-xl text-white shadow-lg shadow-current/20', colors.iconBg)}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-500 font-medium truncate">{label}</p>
        <p className={cn('text-2xl font-bold mt-0.5 truncate', colors.text)}>{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
