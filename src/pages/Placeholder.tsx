import { Construction, type LucideIcon } from 'lucide-react';

interface PlaceholderProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

export default function Placeholder({ title, description, icon: Icon = Construction }: PlaceholderProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="max-w-lg text-center">
        <div className="mx-auto w-20 h-20 rounded-2xl bg-teal-50 flex items-center justify-center mb-6 border border-teal-100">
          <Icon size={36} className="text-teal-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">{description}</p>
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 text-xs font-semibold uppercase tracking-wider">
          <Construction size={13} /> Under Development
        </div>
      </div>
    </div>
  );
}
