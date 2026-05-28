'use client';

import { useState } from 'react';
import Header from '@components/layout/Header';
import { Zap, Bot, MessageSquare, GitFork, Bell, Clock, Plus, ToggleLeft, ToggleRight, ChevronRight } from 'lucide-react';
import { cn } from '@lib/utils';
import toast from 'react-hot-toast';

interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
  active: boolean;
  executions: number;
  category: 'whatsapp' | 'funnel' | 'task' | 'ai';
}

const MOCK_AUTOMATIONS: Automation[] = [
  {
    id: 'a1',
    name: 'Boas-vindas automático',
    description: 'Envia uma mensagem de boas-vindas quando um novo lead entra no funil',
    trigger: 'Novo lead criado',
    action: 'Enviar mensagem WhatsApp',
    active: true,
    executions: 42,
    category: 'whatsapp',
  },
  {
    id: 'a2',
    name: 'Follow-up 24h sem resposta',
    description: 'Envia lembrete automático se o cliente não responder em 24 horas',
    trigger: 'Sem resposta após 24h',
    action: 'Enviar mensagem de follow-up',
    active: true,
    executions: 18,
    category: 'whatsapp',
  },
  {
    id: 'a3',
    name: 'Mover para Proposta',
    description: 'Move automaticamente o lead para a etapa "Proposta" após 3 mensagens trocadas',
    trigger: '3+ mensagens trocadas',
    action: 'Mover etapa no funil',
    active: false,
    executions: 7,
    category: 'funnel',
  },
  {
    id: 'a4',
    name: 'Tarefa de cobrança — Consignação',
    description: 'Cria uma tarefa de cobrança quando o lead está há 30 dias em "Em Campo"',
    trigger: '30 dias em "Em Campo"',
    action: 'Criar tarefa para vendedor',
    active: true,
    executions: 5,
    category: 'task',
  },
  {
    id: 'a5',
    name: 'Agente IA — Leitor de Pedidos',
    description: 'Analisa automaticamente as mensagens do WhatsApp para identificar pedidos e salvar no histórico do cliente',
    trigger: 'Nova mensagem recebida',
    action: 'Extrair dados de pedido com IA',
    active: false,
    executions: 0,
    category: 'ai',
  },
  {
    id: 'a6',
    name: 'Notificação de acerto vencido',
    description: 'Notifica o vendedor quando um acerto de consignação está há mais de 7 dias pendente',
    trigger: 'Acerto pendente há 7 dias',
    action: 'Notificar vendedor responsável',
    active: true,
    executions: 11,
    category: 'task',
  },
];

const CATEGORY_CONFIG = {
  whatsapp: { label: 'WhatsApp', color: 'bg-green-100 text-green-700', icon: MessageSquare },
  funnel: { label: 'Funil', color: 'bg-blue-100 text-blue-700', icon: GitFork },
  task: { label: 'Tarefa', color: 'bg-amber-100 text-amber-700', icon: Clock },
  ai: { label: 'Agente IA', color: 'bg-purple-100 text-purple-700', icon: Bot },
};

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>(MOCK_AUTOMATIONS);
  const [showNewModal, setShowNewModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const toggleAutomation = (id: string) => {
    setAutomations((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const next = { ...a, active: !a.active };
        toast.success(`Automação "${a.name}" ${next.active ? 'ativada' : 'desativada'}`);
        return next;
      })
    );
  };

  const filtered = automations.filter(
    (a) => filterCategory === 'all' || a.category === filterCategory
  );

  const activeCount = automations.filter((a) => a.active).length;
  const totalExec = automations.reduce((s, a) => s + a.executions, 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Automações" subtitle="Regras e agentes que trabalham por você" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-surface-border rounded-2xl p-4 shadow-soft">
            <p className="text-xs text-graphite-muted font-semibold uppercase tracking-wide">Automações ativas</p>
            <p className="text-3xl font-serif font-bold text-emerald-950 mt-1">{activeCount}</p>
            <p className="text-xs text-graphite-muted mt-0.5">de {automations.length} configuradas</p>
          </div>
          <div className="bg-white border border-surface-border rounded-2xl p-4 shadow-soft">
            <p className="text-xs text-graphite-muted font-semibold uppercase tracking-wide">Execuções totais</p>
            <p className="text-3xl font-serif font-bold text-emerald-950 mt-1">{totalExec}</p>
            <p className="text-xs text-graphite-muted mt-0.5">desde a ativação</p>
          </div>
          <div className="bg-white border border-surface-border rounded-2xl p-4 shadow-soft">
            <p className="text-xs text-graphite-muted font-semibold uppercase tracking-wide">Agentes IA</p>
            <p className="text-3xl font-serif font-bold text-emerald-950 mt-1">
              {automations.filter((a) => a.category === 'ai' && a.active).length}
            </p>
            <p className="text-xs text-graphite-muted mt-0.5">rodando agora</p>
          </div>
        </div>

        {/* Filters + New */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { key: 'all', label: 'Todas' },
              { key: 'whatsapp', label: 'WhatsApp' },
              { key: 'funnel', label: 'Funil' },
              { key: 'task', label: 'Tarefas' },
              { key: 'ai', label: 'Agente IA' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterCategory(key)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border',
                  filterCategory === key
                    ? 'bg-emerald-950 text-white border-emerald-950'
                    : 'bg-white text-graphite-muted border-surface-border hover:border-emerald-950/30'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={() => toast('Em breve: criador de automações personalizado!', { icon: '🚧' })}
            className="btn-primary flex items-center gap-1.5 text-xs px-4 py-2"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Automação
          </button>
        </div>

        {/* Automation Cards */}
        <div className="space-y-3">
          {filtered.map((automation) => {
            const catConf = CATEGORY_CONFIG[automation.category];
            const CatIcon = catConf.icon;
            return (
              <div
                key={automation.id}
                className={cn(
                  'bg-white border rounded-2xl p-4 shadow-soft transition-all',
                  automation.active ? 'border-surface-border' : 'border-surface-border/50 opacity-60'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', catConf.color)}>
                      <CatIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-graphite">{automation.name}</h3>
                        <span className={cn('text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full', catConf.color)}>
                          {catConf.label}
                        </span>
                        {automation.category === 'ai' && (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200">
                            ✨ Inteligência Artificial
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-graphite-muted mt-0.5 leading-relaxed">{automation.description}</p>

                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5 text-[10px] text-graphite-muted">
                          <Bell className="w-3 h-3" />
                          <span className="font-semibold">Gatilho:</span>
                          <span>{automation.trigger}</span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-graphite-muted/50" />
                        <div className="flex items-center gap-1.5 text-[10px] text-graphite-muted">
                          <Zap className="w-3 h-3" />
                          <span className="font-semibold">Ação:</span>
                          <span>{automation.action}</span>
                        </div>
                      </div>

                      <p className="text-[10px] text-graphite-muted mt-1.5">
                        {automation.executions} execuções realizadas
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleAutomation(automation.id)}
                    className="flex-shrink-0 transition-colors"
                    title={automation.active ? 'Desativar' : 'Ativar'}
                  >
                    {automation.active ? (
                      <ToggleRight className="w-8 h-8 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-graphite-muted" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Agent highlight box */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-graphite">Agente IA — Leitor de Pedidos</h3>
              <p className="text-xs text-graphite-muted mt-1 leading-relaxed">
                Quando ativado, o agente lê as mensagens do WhatsApp e identifica automaticamente pedidos finalizados —
                extraindo nome do cliente, data, valor e produtos comprados. Os dados são salvos no histórico de cada cliente.
              </p>
              <button
                onClick={() => {
                  toggleAutomation('a5');
                }}
                className="mt-3 px-4 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-semibold hover:bg-purple-700 transition-colors flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                {automations.find((a) => a.id === 'a5')?.active ? 'Desativar Agente' : 'Ativar Agente IA'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
