import type { LucideIcon } from 'lucide-react';

interface DashStatProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'teal' | 'sky' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate';
  onClick?: () => void;
}

const colorMap = {
  teal: { bg: 'bg-teal-50', text: 'text-teal-600', ring: 'hover:border-teal-200' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-600', ring: 'hover:border-sky-200' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'hover:border-emerald-200' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'hover:border-amber-200' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', ring: 'hover:border-rose-200' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', ring: 'hover:border-violet-200' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-600', ring: 'hover:border-slate-300' },
};

export default function DashStat({ title, value, subtitle, icon: Icon, color, onClick }: DashStatProps) {
  const c = colorMap[color];
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-4 border border-slate-100 shadow-sm transition-all ${c.ring} ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider truncate">{title}</p>
          <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>}
        </div>
        <div className={`${c.bg} p-2.5 rounded-xl shrink-0`}>
          <Icon size={18} className={c.text} />
        </div>
      </div>
    </div>
  );
}
