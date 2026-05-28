'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn, getInitials } from '@lib/utils';
import { useAuthStore } from '@store/authStore';
import { useChatStore } from '@store/chatStore';
import {
  Gem, LayoutDashboard, Users, Kanban,
  MessageSquare, CheckSquare, Smartphone,
  BarChart3, Settings, LogOut,
} from 'lucide-react';

const links = [
  { href: '/leads', label: 'Leads', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/kanban', label: 'Kanban', icon: Kanban },
  { href: '/chat', label: 'Chat', icon: MessageSquare, badge: true },
  { href: '/tasks', label: 'Tarefas', icon: CheckSquare },
  { href: '/whatsapp', label: 'WhatsApp', icon: Smartphone },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, adminOnly: true },
  { href: '/settings', label: 'Configurações', icon: Settings, adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { unreadTotal } = useChatStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  return (
    <aside className="w-[72px] h-screen bg-emerald-950 flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center flex-shrink-0">
        <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
          <Gem className="w-5 h-5 text-gold" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col items-center gap-1 px-3 py-2 overflow-y-auto scrollbar-thin">
        {links
          .filter((l, i, arr) => {
            if (l.adminOnly && !isAdmin) return false;
            return arr.findIndex(x => x.href === l.href) === i;
          })
          .map(({ href, label, icon: Icon, badge }) => {
            const active = pathname === href || (href !== '/leads' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={cn(
                  'relative w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-200',
                  active
                    ? 'bg-white/15 text-white'
                    : 'text-white/50 hover:bg-white/10 hover:text-white',
                )}
              >
                <Icon className="w-5 h-5" />
                {badge && unreadTotal > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-gold text-graphite text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 leading-none">
                    {unreadTotal > 99 ? '99+' : unreadTotal}
                  </span>
                )}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gold rounded-r-full" />
                )}
              </Link>
            );
          })}
      </nav>

      {/* User */}
      <div className="flex flex-col items-center gap-2 px-3 py-4 border-t border-white/10">
        <div
          className="w-9 h-9 rounded-full bg-gold/20 text-gold flex items-center justify-center text-xs font-bold cursor-default"
          title={user?.name}
        >
          {getInitials(user?.name ?? '?')}
        </div>
        <button
          onClick={logout}
          title="Sair"
          className="w-9 h-9 flex items-center justify-center rounded-2xl text-white/40 hover:text-white hover:bg-white/10 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
