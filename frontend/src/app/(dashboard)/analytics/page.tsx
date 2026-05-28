'use client';

import { useEffect, useState } from 'react';
import Header from '@components/layout/Header';
import KpiCard from '@components/ui/KpiCard';
import Avatar from '@components/ui/Avatar';
import { api } from '@lib/api';
import { Users, MessageSquare, TrendingUp, CheckSquare, Gem, Percent } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';

interface Overview {
  totalLeads: number;
  leadsBySource: { source: string; count: number }[];
  tasks: { pending: number; overdue: number };
  messagesInbound: number;
  totalConsignment?: number;
  totalSettled?: number;
  conversionRate?: number;
}

interface Seller {
  seller: { id: string; name: string; role: string };
  totalLeads: number;
  wonLeads: number;
  conversionRate: number;
  completedTasks: number;
}

interface Trend { date: string; count: number }

const PERIODS = [
  { label: 'Semana', days: 7 },
  { label: 'Mês', days: 30 },
  { label: 'Trimestre', days: 90 },
];

const formatCurrency = (val?: number) => {
  if (!val) return 'R$ 0,00';
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [period, setPeriod] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const days = PERIODS[period].days;
    const from = new Date();
    from.setDate(from.getDate() - days);
    const params = `from=${from.toISOString()}&to=${new Date().toISOString()}`;
    const groupBy = days <= 7 ? 'day' : days <= 30 ? 'day' : 'week';

    setLoading(true);
    Promise.all([
      api.get(`/api/analytics/overview?${params}`),
      api.get(`/api/analytics/sellers?${params}`),
      api.get(`/api/analytics/trends?${params}&groupBy=${groupBy}`),
    ]).then(([ov, sl, tr]) => {
      setOverview(ov.data);
      setSellers(sl.data);
      setTrends(tr.data);
    }).finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Analytics & KPIs"
        subtitle="Visão geral da operação comercial"
        actions={
          <div className="flex items-center bg-surface-raised rounded-2xl p-1 gap-1">
            {PERIODS.map((p, i) => (
              <button
                key={p.label}
                onClick={() => setPeriod(i)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  period === i ? 'bg-white text-emerald-950 shadow-soft' : 'text-graphite-muted hover:text-graphite'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
        {/* KPI grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Total de Leads"
            value={loading ? '—' : overview?.totalLeads ?? 0}
            icon={Users}
            variant="primary"
            sub={`Período: ${PERIODS[period].label.toLowerCase()}`}
          />
          <KpiCard
            label="Conversão de Funil"
            value={loading ? '—' : `${overview?.conversionRate ?? 0}%`}
            icon={Percent}
            sub="leads ganhos/concluídos"
          />
          <KpiCard
            label="Mensagens Inbound"
            value={loading ? '—' : overview?.messagesInbound ?? 0}
            icon={MessageSquare}
            sub="mensagens de clientes"
          />
          <KpiCard
            label="Tarefas Planejadas"
            value={loading ? '—' : overview?.tasks.pending ?? 0}
            icon={CheckSquare}
            sub={`${overview?.tasks.overdue ?? 0} pendentes em atraso`}
          />
        </div>

        {/* Consignment Performance Panel */}
        {!loading && overview && (
          <div className="bg-white rounded-3xl border border-surface-border hover:border-gold/30 shadow-soft p-6 space-y-4 transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-950 via-gold to-emerald-950" />
            <h3 className="font-serif text-base text-emerald-950 font-bold flex items-center gap-2">
              <Gem className="w-5 h-5 text-gold" />
              Operação de Consignação (Mostruários em Campo)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="space-y-1.5 bg-[#FAF9F5] border border-surface-border rounded-2xl p-4 shadow-soft">
                <span className="text-[10px] text-graphite-muted block font-bold uppercase tracking-wider">Valor de Joias em Campo</span>
                <span className="text-2xl font-bold text-emerald-950 block font-serif">
                  {formatCurrency(overview.totalConsignment)}
                </span>
                <span className="text-[10px] text-graphite-muted block font-medium">Balanço alocado com revendedoras ativas</span>
              </div>
              
              <div className="space-y-1.5 bg-[#FAF9F5] border border-surface-border rounded-2xl p-4 shadow-soft">
                <span className="text-[10px] text-graphite-muted block font-bold uppercase tracking-wider font-sans">Retorno Acertado / Liquidado</span>
                <span className="text-2xl font-bold text-gold block font-serif">
                  {formatCurrency(overview.totalSettled)}
                </span>
                <span className="text-[10px] text-graphite-muted block font-medium">Total faturado no lote corrente</span>
              </div>
              
              <div className="space-y-3 p-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider leading-none">
                  <span className="text-graphite-muted font-sans">Liquidez das Maletas</span>
                  <span className="text-emerald-950 font-sans">
                    {overview.totalConsignment ? Math.round(((overview.totalSettled ?? 0) / (overview.totalConsignment ?? 1)) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-surface-raised h-3 rounded-full overflow-hidden border border-surface-border/20 p-[2px]">
                  <div
                    className="bg-emerald-950 h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${overview.totalConsignment ? Math.min(100, Math.round(((overview.totalSettled ?? 0) / (overview.totalConsignment ?? 1)) * 100)) : 0}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Trend chart */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-surface-border shadow-soft p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-base text-graphite">Evolução de Leads</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trends} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DEE2E6" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#6C757D' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis tick={{ fontSize: 11, fill: '#6C757D' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #DEE2E6', fontSize: 12 }}
                  cursor={{ fill: '#F1F3F5', radius: 8 }}
                />
                <Bar dataKey="count" name="Leads" radius={[8, 8, 0, 0]}>
                  {trends.map((_, i) => (
                    <Cell key={i} fill={i === trends.length - 1 ? '#D4AF37' : '#0F4C3A'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Source breakdown */}
          <div className="bg-white rounded-3xl border border-surface-border shadow-soft p-6">
            <h3 className="font-serif text-base text-graphite mb-4">Leads por Canal</h3>
            <div className="space-y-3">
              {(overview?.leadsBySource ?? []).map((item) => {
                const total = overview?.totalLeads || 1;
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={item.source}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-graphite-light">{item.source}</span>
                      <span className="text-xs font-bold text-graphite">{item.count}</span>
                    </div>
                    <div className="h-1.5 bg-surface-raised rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-950 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {!loading && !overview?.leadsBySource?.length && (
                <p className="text-sm text-graphite-muted text-center py-4">Sem dados no período</p>
              )}
            </div>
          </div>
        </div>

        {/* Seller performance table */}
        <div className="bg-white rounded-3xl border border-surface-border shadow-soft overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-border">
            <h3 className="font-serif text-base text-graphite">Performance dos Vendedores</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border">
                {['Vendedor', 'Leads', 'Ganhos', 'Conversão', 'Tarefas'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-graphite-muted uppercase tracking-wider px-6 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-surface-raised rounded-full animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : sellers.map((s, i) => (
                <tr key={s.seller.id} className="hover:bg-surface-raised/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar name={s.seller.name} size="sm" />
                        {i === 0 && (
                          <span className="absolute -top-1 -right-1 text-[9px]">🥇</span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-graphite">{s.seller.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-graphite">{s.totalLeads}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-graphite-light">{s.wonLeads}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-surface-raised rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-950 rounded-full"
                          style={{ width: `${s.conversionRate}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-graphite">{s.conversionRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-graphite-light">{s.completedTasks}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
