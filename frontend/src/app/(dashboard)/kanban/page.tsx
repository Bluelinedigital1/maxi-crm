'use client';

import { useEffect, useCallback, useState } from 'react';
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCorners,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Header from '@components/layout/Header';
import Avatar from '@components/ui/Avatar';
import { useKanbanStore } from '@store/kanbanStore';
import { dbService, Lead, Task, Pipeline } from '@lib/dbService';
import { timeAgo, cn } from '@lib/utils';
import { MessageSquare, CheckSquare, AlertCircle, Plus, X, Trash2, GitFork } from 'lucide-react';
import toast from 'react-hot-toast';

const formatCurrency = (val?: number) => {
  if (!val) return 'R$ 0,00';
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

function KanbanCard({
  lead,
  taskCount,
  hasOverdueTask,
  isConsignment,
}: {
  lead: Lead;
  taskCount: number;
  hasOverdueTask: boolean;
  isConsignment: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      {...attributes}
      {...listeners}
      className={cn(
        'bg-white border rounded-2xl p-4 cursor-grab active:cursor-grabbing transition-all duration-300 space-y-3 border-surface-border relative overflow-hidden border-l-4 hover:border-l-gold hover:shadow-soft',
        hasOverdueTask ? 'border-red-300 ring-2 ring-red-500/5' : 'border-l-gold/40'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold text-graphite leading-tight tracking-wide">{lead.name}</p>
        {lead.tags?.[0] && (
          <span
            className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-semibold text-white shadow-soft"
            style={{ backgroundColor: lead.tags[0].colorHex }}
          >
            {lead.tags[0].name}
          </span>
        )}
      </div>

      {lead.companyName && (
        <p className="text-[10px] text-graphite-muted font-medium tracking-wide uppercase leading-none">{lead.companyName}</p>
      )}

      {/* Consignment Metrics */}
      {isConsignment && lead.consignmentValue ? (
        <div className="bg-[#FAF9F5] border border-surface-border rounded-xl p-2.5 space-y-2">
          <div className="flex justify-between text-[10px] font-medium leading-none">
            <span className="text-graphite-muted">Maleta em Campo:</span>
            <span className="font-bold text-emerald-950">{formatCurrency(lead.consignmentValue)}</span>
          </div>
          <div className="flex justify-between text-[10px] font-medium leading-none">
            <span className="text-graphite-muted">Total Acertado:</span>
            <span className="font-bold text-gold-dark">{formatCurrency(lead.settledValue)}</span>
          </div>
          <div className="w-full bg-surface-raised h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gold h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  Math.round(((lead.settledValue ?? 0) / (lead.consignmentValue ?? 1)) * 100)
                )}%`,
              }}
            />
          </div>
        </div>
      ) : null}

      {/* Last purchase */}
      {lead.totalPurchased ? (
        <div className="text-[10px] text-graphite-muted font-medium">
          💰 Total comprado: <span className="text-emerald-950 font-bold">{formatCurrency(lead.totalPurchased)}</span>
        </div>
      ) : null}

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2 text-graphite-muted">
          {(lead._count?.messages ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-950">
              <MessageSquare className="w-3 h-3" />
              {lead._count.messages}
            </span>
          )}
          {taskCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-gold-dark">
              <CheckSquare className="w-3 h-3" />
              {taskCount}
            </span>
          )}
          {hasOverdueTask && (
            <span className="flex items-center gap-1 text-[9px] text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded-md border border-red-100">
              <AlertCircle className="w-2.5 h-2.5 text-red-500 animate-pulse" />
              Atrasada
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-medium text-graphite-muted">{timeAgo(lead.createdAt)}</span>
          <Avatar name={lead.name} size="sm" />
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({
  stageId,
  stageName,
  leads,
  tasks,
  isConsignment,
}: {
  stageId: string;
  stageName: string;
  leads: Lead[];
  tasks: Task[];
  isConsignment: boolean;
}) {
  return (
    <div className="flex flex-col w-[280px] flex-shrink-0">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold font-serif text-emerald-950 uppercase tracking-wider">{stageName}</span>
          <span className="bg-white border border-surface-border text-emerald-950 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-soft">
            {leads.length}
          </span>
        </div>
        <span className="w-1.5 h-1.5 rounded-full bg-gold" />
      </div>

      <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2.5 min-h-[150px] bg-surface-raised/40 border border-surface-border/50 rounded-2xl p-2.5 flex-1 overflow-y-auto scrollbar-thin">
          {leads.map((lead) => {
            const leadTasks = tasks.filter((t) => t.leadId === lead.id && t.status === 'PENDING');
            const hasOverdueTask = leadTasks.some((t) => new Date(t.dueDate) < new Date());
            return (
              <KanbanCard
                key={lead.id}
                lead={lead}
                taskCount={leadTasks.length}
                hasOverdueTask={hasOverdueTask}
                isConsignment={isConsignment}
              />
            );
          })}
        </div>
      </SortableContext>
    </div>
  );
}

// Modal to create a new pipeline
function NewFunnelModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'DIRECT_SALE' | 'CONSIGNMENT'>('DIRECT_SALE');
  const [stages, setStages] = useState(['Lead', 'Contato', 'Proposta', 'Fechado']);
  const [newStage, setNewStage] = useState('');
  const [loading, setLoading] = useState(false);

  const addStage = () => {
    if (!newStage.trim()) return;
    setStages((s) => [...s, newStage.trim()]);
    setNewStage('');
  };

  const removeStage = (i: number) => {
    if (stages.length <= 2) { toast.error('Mínimo de 2 etapas'); return; }
    setStages((s) => s.filter((_, idx) => idx !== i));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Nome do funil é obrigatório'); return; }
    setLoading(true);
    try {
      await dbService.createPipeline({ name: name.trim(), type, stages });
      toast.success(`Funil "${name}" criado com sucesso!`);
      onCreated();
      onClose();
    } catch {
      toast.error('Erro ao criar funil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-modal w-full max-w-md p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitFork className="w-5 h-5 text-gold" />
            <h2 className="font-serif text-lg font-bold text-graphite">Novo Funil de Vendas</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-raised transition-colors text-graphite-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-graphite">Nome do Funil *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Marketplace, Feira, Loja Física..."
              className="w-full px-3 py-2 border border-surface-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-950/10 focus:border-emerald-950"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-graphite">Tipo</label>
            <div className="flex gap-2">
              {([['DIRECT_SALE', 'Venda Direta'], ['CONSIGNMENT', 'Consignação']] as const).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setType(val)}
                  className={cn(
                    'flex-1 py-2 rounded-xl text-xs font-semibold border transition-all',
                    type === val ? 'bg-emerald-950 text-white border-emerald-950' : 'border-surface-border text-graphite-muted hover:border-emerald-950/30'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-graphite">Etapas do Funil</label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {stages.map((stage, i) => (
                <div key={i} className="flex items-center gap-2 bg-surface-raised/50 px-3 py-1.5 rounded-xl">
                  <span className="text-[10px] font-bold text-emerald-950/40 w-4">{i + 1}</span>
                  <span className="text-xs text-graphite flex-1">{stage}</span>
                  <button type="button" onClick={() => removeStage(i)} className="text-graphite-muted hover:text-red-500 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newStage}
                onChange={(e) => setNewStage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addStage(); } }}
                placeholder="Nome da etapa..."
                className="flex-1 px-3 py-1.5 border border-surface-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-950/10"
              />
              <button type="button" onClick={addStage} className="px-3 py-1.5 bg-surface-raised border border-surface-border rounded-xl text-xs font-semibold hover:bg-emerald-950/5 transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 btn-ghost text-sm py-2">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary text-sm py-2 font-bold">
              {loading ? 'Criando...' : 'Criar Funil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function KanbanPage() {
  const {
    pipelines, leadsByStage, isLoading,
    setPipelines, setLeadsByStage, setLoading, moveLeadLocally
  } = useKanbanStore();
  const [draggingLead, setDraggingLead] = useState<Lead | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activePipelineId, setActivePipelineId] = useState<string>('');
  const [showNewFunnel, setShowNewFunnel] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const activePipeline = pipelines.find((p) => p.id === activePipelineId) ?? pipelines[0];
  const isConsignment = activePipeline?.type === 'CONSIGNMENT';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const pipelinesData = await dbService.getPipelines();
      setPipelines(pipelinesData);
      if (!activePipelineId && pipelinesData[0]) {
        setActivePipelineId(pipelinesData[0].id);
      }

      const leads = await dbService.getLeads();
      const byStage: Record<string, Lead[]> = {};
      for (const lead of leads) {
        if (!byStage[lead.currentStageId]) byStage[lead.currentStageId] = [];
        byStage[lead.currentStageId].push(lead);
      }
      setLeadsByStage(byStage);

      const tasksData = await dbService.getTasks();
      setTasks(tasksData);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar dados do Funil');
    } finally {
      setLoading(false);
    }
  }, [setLeadsByStage, setPipelines, setLoading, activePipelineId]);

  useEffect(() => {
    load();
    const unsubLeads = dbService.subscribeLeads(load);
    const unsubTasks = dbService.subscribeTasks(load);
    return () => {
      unsubLeads();
      unsubTasks();
    };
  }, [load]);

  const handleDragStart = (event: DragStartEvent) => {
    const lead = Object.values(leadsByStage).flat().find((l) => l.id === event.active.id);
    setDraggingLead(lead ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setDraggingLead(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const fromStageId = Object.keys(leadsByStage).find((sid) =>
      leadsByStage[sid].some((l) => l.id === active.id)
    );
    const toStageId = activePipeline?.stages.find((s) => s.id === over.id)?.id
      ?? Object.keys(leadsByStage).find((sid) => leadsByStage[sid].some((l) => l.id === over.id));

    if (!fromStageId || !toStageId || fromStageId === toStageId) return;

    moveLeadLocally(String(active.id), fromStageId, toStageId);

    try {
      await dbService.moveLead(String(active.id), toStageId);
      toast.success('Lead movido com sucesso');
    } catch {
      moveLeadLocally(String(active.id), toStageId, fromStageId);
      toast.error('Erro ao mover lead');
    }
  };

  const handleDeletePipeline = async (pipeline: Pipeline) => {
    if (!confirm(`Excluir o funil "${pipeline.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await dbService.deletePipeline(pipeline.id);
      toast.success(`Funil "${pipeline.name}" excluído`);
      await load();
    } catch {
      toast.error('Erro ao excluir funil');
    }
  };

  const totalLeadsInPipeline = activePipeline?.stages.reduce(
    (sum, s) => sum + (leadsByStage[s.id]?.length ?? 0), 0
  ) ?? 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Funil de Vendas"
        subtitle={`${totalLeadsInPipeline} leads em ${activePipeline?.name ?? '...'}`}
        actions={
          <button
            onClick={() => setShowNewFunnel(true)}
            className="btn-primary flex items-center gap-1.5 text-xs px-4 py-2"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo Funil
          </button>
        }
      />

      {/* Pipeline tabs */}
      <div className="px-6 pt-4 flex items-center gap-2 flex-wrap border-b border-surface-border/40 pb-0">
        {pipelines.map((pipeline) => (
          <div key={pipeline.id} className="relative group">
            <button
              onClick={() => setActivePipelineId(pipeline.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 text-xs font-semibold transition-all duration-200 border-b-2 -mb-px rounded-t-lg',
                activePipeline?.id === pipeline.id
                  ? 'border-b-gold text-emerald-950 bg-surface-raised/50'
                  : 'border-b-transparent text-graphite-muted hover:text-emerald-950 hover:bg-surface-raised/30'
              )}
            >
              <GitFork className="w-3 h-3" />
              {pipeline.name}
              <span className={cn(
                'text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-1',
                pipeline.type === 'CONSIGNMENT' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
              )}>
                {pipeline.type === 'CONSIGNMENT' ? 'Consig.' : 'Venda'}
              </span>
            </button>
            {/* Delete button — only on hover, not for default pipelines */}
            {!['p1', 'p2'].includes(pipeline.id) && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDeletePipeline(pipeline); }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full hidden group-hover:flex items-center justify-center z-10"
                title="Excluir funil"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        {isLoading ? (
          <div className="flex gap-4 h-full">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-[280px] flex-shrink-0 space-y-2">
                <div className="h-5 w-32 bg-surface-raised rounded-full animate-pulse mb-3" />
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-28 bg-surface-raised rounded-2xl animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 h-full pb-4 items-stretch">
              {(activePipeline?.stages ?? []).map((stage) => (
                <KanbanColumn
                  key={stage.id}
                  stageId={stage.id}
                  stageName={stage.name}
                  leads={leadsByStage[stage.id] ?? []}
                  tasks={tasks}
                  isConsignment={isConsignment}
                />
              ))}
              {(!activePipeline?.stages || activePipeline.stages.length === 0) && (
                <div className="flex flex-col items-center justify-center flex-1 text-graphite-muted gap-2">
                  <GitFork className="w-10 h-10 opacity-20" />
                  <p className="text-sm font-semibold">Nenhuma etapa neste funil</p>
                </div>
              )}
            </div>
            <DragOverlay>
              {draggingLead && (
                <div className="bg-white border border-emerald-950/20 rounded-2xl p-4 shadow-modal w-[280px]">
                  <p className="text-sm font-semibold text-graphite">{draggingLead.name}</p>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {showNewFunnel && (
        <NewFunnelModal
          onClose={() => setShowNewFunnel(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}
