import React from 'react';
import { cn } from '../../utils/cn';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
  subtitle?: string;
}

const colorConfig: Record<
  string,
  {
    border: string;
    iconWrapper: string;
    iconGlow: string;
    labelColor: string;
    valueColor: string;
    accentBar: string;
    dotColor: string;
  }
> = {
  blue: {
    border: 'border-blue-100',
    iconWrapper: 'bg-blue-600',
    iconGlow: 'shadow-blue-500/30',
    labelColor: 'text-slate-400',
    valueColor: 'text-slate-800',
    accentBar: 'bg-blue-500',
    dotColor: 'bg-blue-400',
  },
  green: {
    border: 'border-emerald-100',
    iconWrapper: 'bg-emerald-600',
    iconGlow: 'shadow-emerald-500/30',
    labelColor: 'text-slate-400',
    valueColor: 'text-slate-800',
    accentBar: 'bg-emerald-500',
    dotColor: 'bg-emerald-400',
  },
  yellow: {
    border: 'border-amber-100',
    iconWrapper: 'bg-amber-500',
    iconGlow: 'shadow-amber-400/30',
    labelColor: 'text-slate-400',
    valueColor: 'text-slate-800',
    accentBar: 'bg-amber-400',
    dotColor: 'bg-amber-400',
  },
  red: {
    border: 'border-rose-100',
    iconWrapper: 'bg-rose-600',
    iconGlow: 'shadow-rose-500/30',
    labelColor: 'text-slate-400',
    valueColor: 'text-slate-800',
    accentBar: 'bg-rose-500',
    dotColor: 'bg-rose-400',
  },
  gray: {
    border: 'border-slate-200',
    iconWrapper: 'bg-slate-500',
    iconGlow: 'shadow-slate-400/30',
    labelColor: 'text-slate-400',
    valueColor: 'text-slate-800',
    accentBar: 'bg-slate-400',
    dotColor: 'bg-slate-400',
  },
};

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, subtitle }) => {
  const c = colorConfig[color];

  return (
    <div
      className={cn(
        'group relative bg-white rounded-2xl border overflow-hidden',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-1 hover:shadow-lg',
        c.border
      )}
    >
      {/* Top accent bar */}
      <div className={cn('h-[3px] w-full', c.accentBar)} />

      <div className="px-4 sm:px-5 py-4 sm:py-5 flex items-center gap-3 sm:gap-4">
        {/* Icon */}
        <div
          className={cn(
            'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white',
            'shadow-lg transition-transform duration-300 group-hover:scale-110',
            c.iconWrapper,
            c.iconGlow
          )}
        >
          {icon}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className={cn('text-[11px] font-semibold uppercase tracking-widest', c.labelColor)}>
            {label}
          </p>
          <p className={cn('text-[28px] font-extrabold leading-tight mt-0.5 tabular-nums', c.valueColor)}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5 leading-tight">{subtitle}</p>
          )}
        </div>

        {/* Subtle status dot */}
        <div className={cn('w-2 h-2 rounded-full flex-shrink-0 opacity-60', c.dotColor)} />
      </div>
    </div>
  );
};

export default StatCard;
