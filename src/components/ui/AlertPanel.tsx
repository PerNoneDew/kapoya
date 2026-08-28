import type { LucideIcon } from 'lucide-react';

interface AlertItem {
  id: string;
  name: string;
  meta: string;
  badge?: string;
  badgeColor?: 'amber' | 'rose' | 'sky' | 'emerald' | 'teal' | 'slate';
}

interface AlertPanelProps {
  title: string;
  icon: LucideIcon;
  items: AlertItem[];
  emptyMessage: string;
  onNavigate?: () => void;
  navigateLabel?: string;
  accent?: 'amber' | 'rose' | 'sky' | 'teal' | 'emerald' | 'slate';
}

const accentMap = {
  amber: { border: 'border-amber-100', iconText: 'text-amber-500', badge: 'bg-amber-50 text-amber-600 border-amber-100' },
  rose: { border: 'border-rose-100', iconText: 'text-rose-500', badge: 'bg-rose-50 text-rose-600 border-rose-100' },
  sky: { border: 'border-sky-100', iconText: 'text-sky-500', badge: 'bg-sky-50 text-sky-600 border-sky-100' },
  teal: { border: 'border-teal-100', iconText: 'text-teal-500', badge: 'bg-teal-50 text-teal-600 border-teal-100' },
  emerald: { border: 'border-emerald-100', iconText: 'text-emerald-500', badge: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  slate: { border: 'border-slate-100', iconText: 'text-slate-500', badge: 'bg-slate-50 text-slate-600 border-slate-100' },
};

const badgeColorMap: Record<string, string> = {
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
  rose: 'bg-rose-50 text-rose-600 border-rose-100',
  sky: 'bg-sky-50 text-sky-600 border-sky-100',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  teal: 'bg-teal-50 text-teal-600 border-teal-100',
  slate: 'bg-slate-50 text-slate-600 border-slate-100',
};

export default function AlertPanel({ title, icon: Icon, items, emptyMessage, onNavigate, navigateLabel = 'View all', accent = 'slate' }: AlertPanelProps) {
  const a = accentMap[accent];
  return (
    <div className={`bg-white rounded-2xl border ${a.border} shadow-sm`}>
      <div className={`px-5 py-4 border-b ${a.border} flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Icon size={15} className={a.iconText} />
          <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
        </div>
        {onNavigate && (
          <button onClick={onNavigate} className="text-teal-500 hover:text-teal-600 text-xs font-medium">{navigateLabel} →</button>
        )}
      </div>
      <div className="divide-y divide-slate-50">
        {items.length === 0 ? (
          <div className="px-5 py-6 text-center text-slate-400 text-sm">{emptyMessage}</div>
        ) : (
          items.slice(0, 5).map((item) => (
            <div key={item.id} className="px-5 py-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{item.name}</p>
                {item.meta && <p className="text-xs text-slate-400 truncate">{item.meta}</p>}
              </div>
              {item.badge && (
                <span className={`ml-2 shrink-0 text-xs px-2 py-0.5 rounded-full font-medium border ${item.badgeColor ? badgeColorMap[item.badgeColor] : a.badge}`}>
                  {item.badge}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
