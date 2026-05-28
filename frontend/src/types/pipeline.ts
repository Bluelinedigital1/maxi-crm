export type PipelineType = 'DIRECT_SALE' | 'CONSIGNMENT';

export interface Stage {
  id: string;
  name: string;
  position: number;
  pipelineId: string;
}

export interface Pipeline {
  id: string;
  name: string;
  type: PipelineType;
  stages: Stage[];
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  colorHex: string;
}
