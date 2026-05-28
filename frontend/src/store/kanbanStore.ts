import { create } from 'zustand';
import type { Lead } from '@lib/dbService';
import type { Pipeline, PipelineType } from '@/types/pipeline';

interface KanbanState {
  activePipelineType: PipelineType;
  pipelines: Pipeline[];
  leadsByStage: Record<string, Lead[]>;
  isLoading: boolean;
  setPipelineType: (type: PipelineType) => void;
  setPipelines: (pipelines: Pipeline[]) => void;
  setLeadsByStage: (leadsByStage: Record<string, Lead[]>) => void;
  moveLeadLocally: (leadId: string, fromStageId: string, toStageId: string) => void;
  setLoading: (v: boolean) => void;
}

export const useKanbanStore = create<KanbanState>((set, get) => ({
  activePipelineType: 'DIRECT_SALE',
  pipelines: [],
  leadsByStage: {},
  isLoading: false,

  setPipelineType: (type) => set({ activePipelineType: type }),
  setPipelines: (pipelines) => set({ pipelines }),
  setLeadsByStage: (leadsByStage) => set({ leadsByStage }),
  setLoading: (v) => set({ isLoading: v }),

  moveLeadLocally: (leadId, fromStageId, toStageId) => {
    const { leadsByStage } = get();
    const fromLeads = leadsByStage[fromStageId] ?? [];
    const lead = fromLeads.find((l) => l.id === leadId);
    if (!lead) return;

    set({
      leadsByStage: {
        ...leadsByStage,
        [fromStageId]: fromLeads.filter((l) => l.id !== leadId),
        [toStageId]: [...(leadsByStage[toStageId] ?? []), { ...lead, currentStageId: toStageId }],
      },
    });
  },
}));
