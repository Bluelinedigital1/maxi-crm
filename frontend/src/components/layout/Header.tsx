'use client';

import { Bell, Search } from 'lucide-react';
import { useAuthStore } from '@store/authStore';
import { getInitials } from '@lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showSearch?: boolean;
  onSearch?: (v: string) => void;
}

export default function Header({ title, subtitle, actions, showSearch, onSearch }: HeaderProps) {
  const { user } = useAuthStore();

  return (
    <header className="h-16 bg-white border-b border-surface-border flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-6">
        <div>
          <h2 className="font-serif text-lg text-graphite leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-graphite-muted">{subtitle}</p>}
        </div>
        {showSearch && (
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-graphite-muted" />
            <input
              type="text"
              placeholder="Buscar..."
              onChange={(e) => onSearch?.(e.target.value)}
              className="pl-9 pr-4 py-2 bg-background border border-surface-border rounded-2xl text-sm w-56 focus:outline-none focus:ring-2 focus:ring-emerald-950/20 focus:border-emerald-950 transition-all"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {actions}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-2xl hover:bg-surface-raised transition-colors text-graphite-muted hover:text-graphite">
          <Bell className="w-[18px] h-[18px]" />
        </button>
        <div className="flex items-center gap-2 pl-2 border-l border-surface-border ml-1">
          <div className="w-8 h-8 rounded-full bg-emerald-950/10 text-emerald-950 flex items-center justify-center text-xs font-bold">
            {getInitials(user?.name ?? '?')}
          </div>
          <div className="hidden lg:block">
            <p className="text-xs font-semibold text-graphite leading-tight">{user?.name}</p>
            <p className="text-[10px] text-graphite-muted">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
