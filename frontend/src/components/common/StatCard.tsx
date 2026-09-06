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
  gradient = 'from-white/15 to-white/5',
}) => {
  return (
    <div className="glass-card glass-card-hover rounded-[26px] p-7 sm:p-8 relative overflow-hidden transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs sm:text-sm font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-4xl sm:text-5xl font-black text-white tracking-tight font-sans mt-1">{value}</h3>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-400 mt-2 flex items-center gap-1.5">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradient} border border-white/15 text-white shadow-xl backdrop-blur-md`}>
          <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
        </div>
      </div>
    </div>
  );
};
