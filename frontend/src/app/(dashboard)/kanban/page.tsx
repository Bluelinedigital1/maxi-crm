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
import { dbService, Lead, Task } from '@lib/dbService';
import { timeAgo, cn } from '@lib/utils';
import { MessageSquare, CheckSquare, ArrowRightLeft, AlertCircle } from 'lucide-react';
import type { PipelineType } from '@/types/pipeline';
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
        'bg-white border rounded-2xl p-4 cursor-grab active:cursor-grabbing transition-all duration-300 space-y-3 border-surface-border relative overflow-hidden border-l-4 hover:border-l-gold hover:border-r-gold/20 hover:border-y-gold/20 hover:shadow-[0_8px_30px_rgba(197,160,89,0.05)]',
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

export default function KanbanPage() {
  const {
    activePipelineType, pipelines, leadsByStage, isLoading,
    setPipelineType, setPipelines, setLeadsByStage, setLoading, moveLeadLocally
  } = useKanbanStore();
  const [draggingLead, setDraggingLead] = useState<Lead | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const activePipeline = pipelines.find((p) => p.type === activePipelineType);
  const isConsignment = activePipelineType === 'CONSIGNMENT';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const pipelinesData = await dbService.getPipelines();
      setPipelines(pipelinesData);

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
      toast.error('Erro ao carregar dados do Kanban');
    } finally {
      setLoading(false);
    }
  }, [setLeadsByStage, setPipelines, setLoading]);

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

  const togglePipeline = (type: PipelineType) => setPipelineType(type);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Pipeline de Joias"
        subtitle={activePipeline?.name}
        actions={
          <div className="flex items-center bg-surface-raised border border-surface-border/50 rounded-full p-1 gap-1">
            {(['DIRECT_SALE', 'CONSIGNMENT'] as PipelineType[]).map((type) => (
              <button
                key={type}
                onClick={() => togglePipeline(type)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs transition-all duration-300',
                  activePipelineType === type
                    ? 'bg-emerald-950 text-white font-bold shadow-soft border border-gold/30'
                    : 'text-graphite-muted hover:text-emerald-950 font-semibold hover:bg-emerald-950/5'
                )}
              >
                <ArrowRightLeft className={cn("w-3 h-3", activePipelineType === type ? "text-gold animate-pulse" : "text-gold/80")} />
                {type === 'DIRECT_SALE' ? 'Venda Direta' : 'Consignação'}
              </button>
            ))}
          </div>
        }
      />

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
    </div>
  );
}
