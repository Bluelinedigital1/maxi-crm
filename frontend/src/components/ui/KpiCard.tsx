import { cn } from '@lib/utils';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'primary';
  trend?: { value: number; label: string };
}

export default function KpiCard({ label, value, sub, icon: Icon, variant = 'default', trend }: KpiCardProps) {
  const isPrimary = variant === 'primary';

  return (
    <div className={cn(
      'rounded-3xl p-6 flex flex-col justify-between min-h-[140px] transition-all duration-300',
      isPrimary
        ? 'bg-emerald-950 text-white border border-gold/35 shadow-[0_8px_30px_rgba(10,58,47,0.08)]'
        : 'bg-white border border-surface-border shadow-soft hover:border-gold/35 hover:shadow-[0_8px_30px_rgba(197,160,89,0.04)]',
    )}>
      <div className="flex items-start justify-between">
        <p className={cn('text-sm font-semibold tracking-wide', isPrimary ? 'text-white/80' : 'text-graphite-muted')}>
          {label}
        </p>
        {Icon && (
          <div className={cn(
            'w-8 h-8 rounded-xl flex items-center justify-center',
            isPrimary ? 'bg-white/15 text-gold' : 'bg-emerald-950/8 text-emerald-950 border border-emerald-950/10',
          )}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div>
        <p className={cn(
          'text-3xl font-bold font-sans tracking-tight',
          isPrimary ? 'text-white' : 'text-graphite',
        )}>
          {value}
        </p>
        {sub && (
          <p className={cn('text-xs mt-1', isPrimary ? 'text-white/60' : 'text-graphite-muted')}>
            {sub}
          </p>
        )}
        {trend && (
          <p className={cn(
            'text-xs mt-1 font-medium',
            trend.value >= 0
              ? isPrimary ? 'text-green-300' : 'text-green-600'
              : isPrimary ? 'text-red-300' : 'text-red-500',
          )}>
            {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
          </p>
        )}
      </div>
    </div>
  );
}
