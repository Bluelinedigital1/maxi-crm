import { triggerMockSocketMessage } from './socket';

// Define TS types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'SELLER';
  isActive: boolean;
}

export interface Pipeline {
  id: string;
  name: string;
  type: 'DIRECT_SALE' | 'CONSIGNMENT';
  stages: Stage[];
  createdAt: string;
}

export interface Stage {
  id: string;
  name: string;
  position: number;
  pipelineId: string;
}

export interface Tag {
  id: string;
  name: string;
  colorHex: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  companyName?: string;
  source: 'WhatsApp' | 'Website' | 'Facebook' | 'Manual';
  currentStageId: string;
  assignedUserId: string;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
  consignmentValue?: number; // Total jewelry value in field
  settledValue?: number;     // Total resolved/billed
  _count: { messages: number };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  status: 'PENDING' | 'COMPLETED';
  leadId: string;
  assignedUserId: string;
  createdAt: string;
}

export interface Message {
  id: string;
  leadId: string;
  whatsappInstanceId: string;
  direction: 'INBOUND' | 'OUTBOUND';
  body: string;
  timestamp: string;
  isRead: boolean;
}

export interface WhatsappInstance {
  id: string;
  name: string;
  phoneNumber: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';
  qrCodeBase64?: string;
  userId: string;
  user: { id: string; name: string };
}

// Default Seed Data for Local Storage
const DEFAULT_USERS: User[] = [
  { id: 'u1', name: 'André Cardoso', email: 'admin@maxxi.com', role: 'ADMIN', isActive: true },
  { id: 'u2', name: 'Juliana Silva', email: 'vendedor@maxxi.com', role: 'SELLER', isActive: true },
];

const DEFAULT_PIPELINES: Pipeline[] = [
  {
    id: 'p1',
    name: 'Venda Direta',
    type: 'DIRECT_SALE',
    createdAt: '2024-01-01T00:00:00.000Z',
    stages: [
      { id: 's1', name: 'Lead', position: 0, pipelineId: 'p1' },
      { id: 's2', name: 'Contato', position: 1, pipelineId: 'p1' },
      { id: 's3', name: 'Proposta', position: 2, pipelineId: 'p1' },
      { id: 's4', name: 'Fechado', position: 3, pipelineId: 'p1' },
    ],
  },
  {
    id: 'p2',
    name: 'Consignação',
    type: 'CONSIGNMENT',
    createdAt: '2024-01-01T00:00:00.000Z',
    stages: [
      { id: 's5', name: 'Análise', position: 0, pipelineId: 'p2' },
      { id: 's6', name: 'Maleta Alocada', position: 1, pipelineId: 'p2' },
      { id: 's7', name: 'Em Campo', position: 2, pipelineId: 'p2' },
      { id: 's8', name: 'Acerto', position: 3, pipelineId: 'p2' },
    ],
  },
];

const DEFAULT_TAGS: Tag[] = [
  { id: 't1', name: 'Premium', colorHex: '#D4AF37' },
  { id: 't2', name: 'Atacado', colorHex: '#0F4C3A' },
  { id: 't3', name: 'Urgente', colorHex: '#EF4444' },
];

const DEFAULT_LEADS: Lead[] = [
  {
    id: 'l1',
    name: 'Roberto de Souza',
    phone: '11988887777',
    email: 'roberto@paoouro.com.br',
    companyName: 'Supermercado Pão de Ouro',
    source: 'WhatsApp',
    currentStageId: 's2', // Contato
    assignedUserId: 'u2',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [DEFAULT_TAGS[0]],
    consignmentValue: 0,
    settledValue: 0,
    _count: { messages: 4 },
  },
  {
    id: 'l2',
    name: 'Ana Carolina',
    phone: '21977776666',
    email: 'ana@villamercado.com',
    companyName: 'Mercado da Vila',
    source: 'Website',
    currentStageId: 's1', // Lead
    assignedUserId: 'u2',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [DEFAULT_TAGS[1]],
    consignmentValue: 0,
    settledValue: 0,
    _count: { messages: 0 },
  },
  {
    id: 'l3',
    name: 'Marcos Almeida',
    phone: '31966665555',
    email: 'marcos@valerio.com',
    companyName: 'Distribuidora Vale do Rio',
    source: 'Facebook',
    currentStageId: 's3', // Proposta
    assignedUserId: 'u1',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [DEFAULT_TAGS[2]],
    consignmentValue: 0,
    settledValue: 0,
    _count: { messages: 6 },
  },
  {
    id: 'l4',
    name: 'Vanessa Lima',
    phone: '11955554444',
    email: 'vanessa@vanessajoias.com',
    companyName: 'Vanessa Semijoias & Acessórios',
    source: 'Facebook',
    currentStageId: 's7', // Em Campo
    assignedUserId: 'u2',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [DEFAULT_TAGS[0], DEFAULT_TAGS[1]],
    consignmentValue: 18500,
    settledValue: 3200,
    _count: { messages: 3 },
  },
  {
    id: 'l5',
    name: 'Cláudia Regina',
    phone: '21944443333',
    email: 'claudia.regina@realezajoias.com',
    companyName: 'Realeza Joias Consignadas',
    source: 'Website',
    currentStageId: 's8', // Acerto
    assignedUserId: 'u2',
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [DEFAULT_TAGS[0]],
    consignmentValue: 24000,
    settledValue: 19800,
    _count: { messages: 1 },
  },
  {
    id: 'l6',
    name: 'Letícia Costa',
    phone: '31933332222',
    email: 'leticiacosta@gmail.com',
    companyName: 'Letícia Designer',
    source: 'WhatsApp',
    currentStageId: 's5', // Análise
    assignedUserId: 'u1',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [],
    consignmentValue: 0,
    settledValue: 0,
    _count: { messages: 2 },
  },
];

const DEFAULT_TASKS: Task[] = [
  {
    id: 'tk1',
    title: 'Ligar para Roberto',
    description: 'Apresentar nova tabela de preços de atacado',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: 'PENDING',
    leadId: 'l1',
    assignedUserId: 'u2',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tk2',
    title: 'Enviar proposta comercial',
    description: 'Enviar PDF com as condições de consignação',
    dueDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // overdue
    status: 'PENDING',
    leadId: 'l3',
    assignedUserId: 'u2',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tk3',
    title: 'Cobrar acerto de contas',
    description: 'Verificar joias vendidas e devoluções da maleta',
    dueDate: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // overdue
    status: 'PENDING',
    leadId: 'l5',
    assignedUserId: 'u2',
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_MESSAGES: Message[] = [
  { id: 'm1', leadId: 'l1', whatsappInstanceId: 'w1', direction: 'INBOUND', body: 'Olá, gostaria de saber os preços do catálogo de atacado de vocês.', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), isRead: true },
  { id: 'm2', leadId: 'l1', whatsappInstanceId: 'w1', direction: 'OUTBOUND', body: 'Olá Roberto! Sou a Juliana da Maxxi. Vou te enviar o catálogo agora mesmo.', timestamp: new Date(Date.now() - 1.9 * 60 * 60 * 1000).toISOString(), isRead: true },
  { id: 'm3', leadId: 'l1', whatsappInstanceId: 'w1', direction: 'OUTBOUND', body: 'Segue em anexo o arquivo. Quais produtos mais te interessaram?', timestamp: new Date(Date.now() - 1.8 * 60 * 60 * 1000).toISOString(), isRead: true },
  { id: 'm4', leadId: 'l1', whatsappInstanceId: 'w1', direction: 'INBOUND', body: 'Gostei muito das pulseiras folheadas e brincos. Qual o pedido mínimo?', timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), isRead: false },

  { id: 'm5', leadId: 'l3', whatsappInstanceId: 'w1', direction: 'INBOUND', body: 'Olá, vi o anúncio no Facebook sobre as maletas consignadas.', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), isRead: true },
  { id: 'm6', leadId: 'l3', whatsappInstanceId: 'w1', direction: 'OUTBOUND', body: 'Olá Marcos! Sou o André. Como posso te ajudar hoje?', timestamp: new Date(Date.now() - 23.9 * 60 * 60 * 1000).toISOString(), isRead: true },

  { id: 'm7', leadId: 'l4', whatsappInstanceId: 'w1', direction: 'INBOUND', body: 'Olá! A maleta com as peças chegou. Vou começar as vendas amanhã.', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), isRead: true },
  { id: 'm8', leadId: 'l4', whatsappInstanceId: 'w1', direction: 'OUTBOUND', body: 'Excelente Vanessa! Sucesso nas vendas. Qualquer dúvida me chame.', timestamp: new Date(Date.now() - 1.9 * 24 * 60 * 60 * 1000).toISOString(), isRead: true },

  { id: 'm9', leadId: 'l5', whatsappInstanceId: 'w1', direction: 'INBOUND', body: 'Já fiz o levantamento. Vendi quase tudo da maleta de Brushed Gold.', timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(), isRead: false },
];

const DEFAULT_WHATSAPP: WhatsappInstance[] = [
  { id: 'w1', name: 'Maxxi Vendas 01', phoneNumber: '+55 11 99999-8888', status: 'CONNECTED', userId: 'u2', user: { id: 'u2', name: 'Juliana Silva' } },
  { id: 'w2', name: 'Número Consignados', phoneNumber: '+55 11 98888-1111', status: 'DISCONNECTED', userId: 'u1', user: { id: 'u1', name: 'André Cardoso' } },
];

// PubSub for Mock database listeners
type Listener = () => void;
const listeners: Record<string, Set<Listener>> = {};

function notify(event: string) {
  if (listeners[event]) {
    listeners[event].forEach((cb) => cb());
  }
}

if (typeof window !== 'undefined') {
  (window as any).maxxi_notify = notify;
}

function subscribe(event: string, callback: Listener): () => void {
  if (!listeners[event]) {
    listeners[event] = new Set();
  }
  listeners[event].add(callback);
  return () => {
    listeners[event].delete(callback);
  };
}

// Local Storage Helper
const LS_PREFIX = 'maxxi_crm_';
function getLS<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  const stored = localStorage.getItem(LS_PREFIX + key);
  if (!stored) {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  return JSON.parse(stored) as T;
}

function setLS<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
}

// Seed Local Storage if empty
if (typeof window !== 'undefined') {
  getLS('users', DEFAULT_USERS);
  getLS('pipelines', DEFAULT_PIPELINES);
  getLS('tags', DEFAULT_TAGS);
  getLS('leads', DEFAULT_LEADS);
  getLS('tasks', DEFAULT_TASKS);
  getLS('messages', DEFAULT_MESSAGES);
  getLS('whatsapp', DEFAULT_WHATSAPP);
}

// AI/Rule-based Auto responder simulator
const BOT_RESPONSES = [
  'Maravilha! Vou consultar aqui no catálogo e te retorno com as fotos.',
  'Qual o melhor dia para fazermos o acerto de contas da maleta?',
  'Consegue me mandar a lista das peças que mais venderam?',
  'Perfeito, o cadastro de crédito foi aprovado. A maleta já está em alocação.',
  'Vou solicitar a liberação do lote de Brushed Gold e te envio o código de rastreio.',
];

function simulateLeadAutoReply(leadId: string) {
  setTimeout(() => {
    const messages = getLS<Message[]>('messages', DEFAULT_MESSAGES);
    const leads = getLS<Lead[]>('leads', DEFAULT_LEADS);
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    const body = BOT_RESPONSES[Math.floor(Math.random() * BOT_RESPONSES.length)];
    const newMessage: Message = {
      id: 'm_sim_' + Math.random().toString(36).substr(2, 9),
      leadId,
      whatsappInstanceId: 'w1',
      direction: 'INBOUND',
      body,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    // Save message
    setLS('messages', [...messages, newMessage]);

    // Update message count in lead
    setLS('leads', leads.map((l) => l.id === leadId ? { ...l, _count: { messages: (l._count?.messages ?? 0) + 1 } } : l));

    // Play notification sound if available
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav');
      audio.volume = 0.3;
      audio.play();
    } catch {}

    // Emit live mock websocket event
    try {
      triggerMockSocketMessage(leadId, lead.name, newMessage);
    } catch (err) {
      console.error(err);
    }

    notify('messages_' + leadId);
    notify('conversations');
    notify('leads');
  }, 1800);
}

// EXPORTED DATABASE SERVICE
export const dbService = {
  // Users
  async getUsers(): Promise<User[]> {
    return getLS('users', DEFAULT_USERS);
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const users = getLS<User[]>('users', DEFAULT_USERS);
    const updated = users.map((u) => u.id === id ? { ...u, ...updates } : u);
    setLS('users', updated);
    notify('users');
    const user = updated.find(u => u.id === id);
    if (!user) throw new Error('User not found');
    return user;
  },

  // Tags
  async getTags(): Promise<Tag[]> {
    return getLS('tags', DEFAULT_TAGS);
  },

  async createTag(tag: Partial<Tag>): Promise<Tag> {
    const newTag: Tag = {
      id: 'tag_' + Math.random().toString(36).substr(2, 9),
      name: tag.name ?? 'Etiqueta',
      colorHex: tag.colorHex ?? '#6C757D',
    };
    const tags = getLS<Tag[]>('tags', DEFAULT_TAGS);
    setLS('tags', [...tags, newTag]);
    notify('tags');
    return newTag;
  },

  async deleteTag(id: string): Promise<void> {
    const tags = getLS<Tag[]>('tags', DEFAULT_TAGS);
    setLS('tags', tags.filter((t) => t.id !== id));
    notify('tags');
  },

  // Pipelines
  async getPipelines(): Promise<Pipeline[]> {
    return getLS('pipelines', DEFAULT_PIPELINES);
  },

  // Leads
  async getLeads(): Promise<Lead[]> {
    return getLS('leads', DEFAULT_LEADS);
  },

  async createLead(lead: Partial<Lead>): Promise<Lead> {
    const newLead: Lead = {
      id: lead.id ?? 'lead_' + Math.random().toString(36).substr(2, 9),
      name: lead.name ?? 'Novo Lead',
      phone: lead.phone ?? '',
      email: lead.email ?? '',
      companyName: lead.companyName ?? '',
      source: lead.source ?? 'Manual',
      currentStageId: lead.currentStageId ?? 's1',
      assignedUserId: lead.assignedUserId ?? 'u2',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: lead.tags ?? [],
      consignmentValue: lead.consignmentValue ?? 0,
      settledValue: lead.settledValue ?? 0,
      _count: { messages: lead._count?.messages ?? 0 },
    };

    const leads = getLS<Lead[]>('leads', DEFAULT_LEADS);
    setLS('leads', [newLead, ...leads]);
    notify('leads');
    notify('conversations');
    return newLead;
  },

  async moveLead(leadId: string, stageId: string): Promise<void> {
    const leads = getLS<Lead[]>('leads', DEFAULT_LEADS);
    const updated = leads.map((l) => l.id === leadId ? { ...l, currentStageId: stageId, updatedAt: new Date().toISOString() } : l);
    setLS('leads', updated);
    notify('leads');
  },

  async updateLead(leadId: string, updates: Partial<Lead>): Promise<Lead> {
    const leads = getLS<Lead[]>('leads', DEFAULT_LEADS);
    const updated = leads.map((l) => l.id === leadId ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l);
    setLS('leads', updated);
    notify('leads');
    notify('conversations');
    const lead = updated.find((l) => l.id === leadId);
    if (!lead) throw new Error('Lead not found');
    return lead;
  },

  async updateLeadTags(leadId: string, tags: Tag[]): Promise<void> {
    const leads = getLS<Lead[]>('leads', DEFAULT_LEADS);
    const updated = leads.map((l) => l.id === leadId ? { ...l, tags, updatedAt: new Date().toISOString() } : l);
    setLS('leads', updated);
    notify('leads');
  },

  // Tasks
  async getTasks(): Promise<Task[]> {
    return getLS('tasks', DEFAULT_TASKS);
  },

  async createTask(task: Partial<Task>): Promise<Task> {
    const newTask: Task = {
      id: 'task_' + Math.random().toString(36).substr(2, 9),
      title: task.title ?? 'Sem título',
      description: task.description ?? '',
      dueDate: task.dueDate ?? new Date().toISOString(),
      status: 'PENDING',
      leadId: task.leadId ?? '',
      assignedUserId: task.assignedUserId ?? 'u2',
      createdAt: new Date().toISOString(),
    };

    const tasks = getLS<Task[]>('tasks', DEFAULT_TASKS);
    setLS('tasks', [newTask, ...tasks]);
    notify('tasks');
    notify('leads');
    return newTask;
  },

  async completeTask(taskId: string): Promise<void> {
    const tasks = getLS<Task[]>('tasks', DEFAULT_TASKS);
    const updated = tasks.map((t) => t.id === taskId ? { ...t, status: 'COMPLETED' as const } : t);
    setLS('tasks', updated);
    notify('tasks');
    notify('leads');
  },

  // Conversations (Sidebar view of messages)
  async getConversations(): Promise<any[]> {
    const leads = await this.getLeads();
    const messages = getLS<Message[]>('messages', DEFAULT_MESSAGES);

    return leads.map((lead) => {
      const leadMsgs = messages.filter((m) => m.leadId === lead.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const lastMessage = leadMsgs[0] ?? {
        body: 'Sem mensagens anteriores',
        direction: 'INBOUND',
        timestamp: lead.createdAt,
        isRead: true,
      };

      const unreadCount = leadMsgs.filter((m) => m.direction === 'INBOUND' && !m.isRead).length;

      return {
        leadId: lead.id,
        leadName: lead.name,
        phone: lead.phone,
        unreadCount,
        lastMessage,
      };
    }).sort((a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime());
  },

  // Messages
  async getMessages(leadId: string): Promise<Message[]> {
    const messages = getLS<Message[]>('messages', DEFAULT_MESSAGES);
    return messages.filter((m) => m.leadId === leadId).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  async sendMessage(leadId: string, instanceId: string, body: string): Promise<Message> {
    const newMsg: Message = {
      id: 'm_' + Math.random().toString(36).substr(2, 9),
      leadId,
      whatsappInstanceId: instanceId,
      direction: 'OUTBOUND',
      body,
      timestamp: new Date().toISOString(),
      isRead: true,
    };

    const messages = getLS<Message[]>('messages', DEFAULT_MESSAGES);
    setLS('messages', [...messages, newMsg]);

    notify('messages_' + leadId);
    notify('conversations');

    // Simulate auto-reply from the client
    simulateLeadAutoReply(leadId);

    return newMsg;
  },

  async markAsRead(leadId: string): Promise<void> {
    const messages = getLS<Message[]>('messages', DEFAULT_MESSAGES);
    const updated = messages.map((m) => m.leadId === leadId && m.direction === 'INBOUND' ? { ...m, isRead: true } : m);
    setLS('messages', updated);
    notify('conversations');
    notify('messages_' + leadId);
  },

  // WhatsApp Settings
  async getWhatsappInstances(): Promise<WhatsappInstance[]> {
    return getLS('whatsapp', DEFAULT_WHATSAPP);
  },

  async createWhatsappInstance(instance: Partial<WhatsappInstance>): Promise<WhatsappInstance> {
    const newInst: WhatsappInstance = {
      id: 'w_' + Math.random().toString(36).substr(2, 9),
      name: instance.name ?? 'WhatsApp Instance',
      phoneNumber: instance.phoneNumber ?? '',
      status: 'DISCONNECTED',
      userId: instance.userId ?? 'u2',
      user: { id: 'u2', name: 'Juliana Silva' },
    };

    const instances = getLS<WhatsappInstance[]>('whatsapp', DEFAULT_WHATSAPP);
    setLS('whatsapp', [...instances, newInst]);
    notify('whatsapp');
    return newInst;
  },

  async disconnectWhatsappInstance(id: string): Promise<void> {
    const instances = getLS<WhatsappInstance[]>('whatsapp', DEFAULT_WHATSAPP);
    const updated = instances.map((i) => i.id === id ? { ...i, status: 'DISCONNECTED' as const, qrCodeBase64: undefined } : i);
    setLS('whatsapp', updated);
    notify('whatsapp');
  },

  async deleteWhatsappInstance(id: string): Promise<void> {
    const instances = getLS<WhatsappInstance[]>('whatsapp', DEFAULT_WHATSAPP);
    setLS('whatsapp', instances.filter((i) => i.id !== id));
    notify('whatsapp');
  },

  async getQrCode(id: string): Promise<string> {
    const instances = getLS<WhatsappInstance[]>('whatsapp', DEFAULT_WHATSAPP);
    const qrMock = 'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg';

    const updated = instances.map((i) => i.id === id ? { ...i, status: 'CONNECTING' as const, qrCodeBase64: qrMock } : i);
    setLS('whatsapp', updated);
    notify('whatsapp');

    // Simulate scan 4 seconds later
    setTimeout(() => {
      const currentInsts = getLS<WhatsappInstance[]>('whatsapp', DEFAULT_WHATSAPP);
      const matched = currentInsts.find((i) => i.id === id);
      if (matched && matched.status === 'CONNECTING') {
        setLS('whatsapp', currentInsts.map((i) => i.id === id ? { ...i, status: 'CONNECTED' as const, qrCodeBase64: undefined } : i));
        notify('whatsapp');
      }
    }, 4000);

    return qrMock;
  },

  // Subscriptions
  subscribeLeads(callback: Listener): () => void {
    return subscribe('leads', callback);
  },

  subscribeTasks(callback: Listener): () => void {
    return subscribe('tasks', callback);
  },

  subscribeConversations(callback: Listener): () => void {
    return subscribe('conversations', callback);
  },

  subscribeMessages(leadId: string, callback: Listener): () => void {
    return subscribe('messages_' + leadId, callback);
  },

  subscribeWhatsapp(callback: Listener): () => void {
    return subscribe('whatsapp', callback);
  },
};
