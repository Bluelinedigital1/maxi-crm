import type { AuthUser } from './user';
import type { Tag } from './pipeline';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  companyName?: string;
  source: string;
  currentStageId: string;
  currentStage: { id: string; name: string; position: number; pipelineId: string };
  assignedUserId: string;
  assignedUser: Pick<AuthUser, 'id' | 'name' | 'email' | 'role'>;
  tags: Array<{ tag: Tag }>;
  tasks: Task[];
  _count: { messages: number };
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE';
  leadId: string;
  assignedUserId: string;
  createdAt: string;
}
