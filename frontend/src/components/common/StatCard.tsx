import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  gradient?: string;
  glowClass?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient = 'bg-gradient-to-br from-emerald-500 to-teal-600',
  glowClass = 'hover:border-slate-700',
}) => {
  return (
    <div className={`glass-card glass-card-hover rounded-2xl p-6 relative overflow-hidden transition-all duration-300 ${glowClass}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <h3 className="text-3xl font-extrabold text-white mt-2 tracking-tight">{value}</h3>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3.5 rounded-xl ${gradient} text-white shadow-lg`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
