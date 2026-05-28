'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@components/layout/Header';
import Avatar from '@components/ui/Avatar';
import { dbService, Message, WhatsappInstance, Lead, Task, Tag } from '@lib/dbService';
import { cn, timeAgo, formatPhone } from '@lib/utils';
import {
  Send, Search, Sparkles, Plus, CheckSquare, Square,
  Tag as TagIcon, X, Calendar, DollarSign, Briefcase, Info, AlertCircle, Check, CheckCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { triggerMockSocketMessage } from '@lib/socket';
import { useAuthStore } from '@store/authStore';

export default function ChatPage() {
  const searchParams = useSearchParams();
  const initialLeadId = searchParams.get('leadId');

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [instances, setInstances] = useState<WhatsappInstance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState('');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [convSearch, setConvSearch] = useState('');
  const [isClientTyping, setIsClientTyping] = useState(false);
  const { user } = useAuthStore();

  // Filters for conversations
  const [chatFilter, setChatFilter] = useState<'my' | 'all'>('my');

  // Context Drawer states
  const [globalTags, setGlobalTags] = useState<Tag[]>([]);
  const [leadTasks, setLeadTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  
  // Consignment editing state
  const [consignmentVal, setConsignmentVal] = useState<number>(0);
  const [settledVal, setSettledVal] = useState<number>(0);
  const [updatingConsignment, setUpdatingConsignment] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const data = await dbService.getConversations();
      setConversations(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const openConversation = useCallback(async (leadId: string) => {
    setActiveLeadId(leadId);
    try {
      const msgs = await dbService.getMessages(leadId);
      setMessages(msgs);
      await dbService.markAsRead(leadId);
      
      const leads = await dbService.getLeads();
      const currentLead = leads.find((l) => l.id === leadId);
      if (currentLead) {
        setActiveLead(currentLead);
        setConsignmentVal(currentLead.consignmentValue ?? 0);
        setSettledVal(currentLead.settledValue ?? 0);
      }

      const allTasks = await dbService.getTasks();
      const currentTasks = allTasks.filter((t) => t.leadId === leadId);
      setLeadTasks(currentTasks);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Fetch initial data
  useEffect(() => {
    loadConversations();
    
    // Load WhatsApp Instances
    dbService.getWhatsappInstances().then((data) => {
      setInstances(data);
      const firstConnected = data.find((i) => i.status === 'CONNECTED');
      if (firstConnected) {
        setSelectedInstance(firstConnected.id);
      } else if (data[0]) {
        setSelectedInstance(data[0].id);
      }
    });

    // Load Global Tags
    dbService.getTags().then((tags) => {
      setGlobalTags(tags);
    });

    // Subscribe to conversations changes
    const unsubConvs = dbService.subscribeConversations(() => {
      loadConversations();
    });

    return () => unsubConvs();
  }, [loadConversations]);

  // Initial load from URL param
  useEffect(() => {
    if (initialLeadId) {
      openConversation(initialLeadId);
    }
  }, [initialLeadId, openConversation]);

  // Subscribe to messages/tasks for active lead
  useEffect(() => {
    if (!activeLeadId) return;

    const unsubMsgs = dbService.subscribeMessages(activeLeadId, async () => {
      const msgs = await dbService.getMessages(activeLeadId);
      setMessages(msgs);
      await dbService.markAsRead(activeLeadId);
    });

    const unsubLeads = dbService.subscribeLeads(async () => {
      const leads = await dbService.getLeads();
      const currentLead = leads.find((l) => l.id === activeLeadId);
      if (currentLead) {
        setActiveLead(currentLead);
      }
    });

    const unsubTasks = dbService.subscribeTasks(async () => {
      const allTasks = await dbService.getTasks();
      const currentTasks = allTasks.filter((t) => t.leadId === activeLeadId);
      setLeadTasks(currentTasks);
    });

    return () => {
      unsubMsgs();
      unsubLeads();
      unsubTasks();
    };
  }, [activeLeadId]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Periodic message simulator (Every 15 seconds)
  useEffect(() => {
    const chatSimulator = setInterval(async () => {
      if (!activeLeadId || !activeLead) return;

      const responses = [
        'Olá! Já deu uma olhada nas condições do catálogo de atacado?',
        'Adorei as joias de esmeralda. Conseguimos alocar mais delas na maleta?',
        'Tudo bem, vou preencher a ficha de análise de crédito e te envio.',
        'O acerto de contas está pronto. Tivemos uma ótima saída das peças gold.',
        'Me avise quando o mostruário for postado, por favor.',
      ];

      const body = responses[Math.floor(Math.random() * responses.length)];
      
      // Simulate real-time inbound message via dbService direct update
      const newMsg: Message = {
        id: 'sim_in_' + Math.random().toString(36).substr(2, 9),
        leadId: activeLeadId,
        whatsappInstanceId: selectedInstance || 'w1',
        direction: 'INBOUND',
        body,
        timestamp: new Date().toISOString(),
        isRead: false,
      };

      const storageKey = 'maxxi_crm_messages';
      const stored = localStorage.getItem(storageKey);
      const allMsgs = stored ? JSON.parse(stored) : [];
      localStorage.setItem(storageKey, JSON.stringify([...allMsgs, newMsg]));

      // Update lead message count
      const leadsKey = 'maxxi_crm_leads';
      const storedLeads = localStorage.getItem(leadsKey);
      if (storedLeads) {
        const leadsList = JSON.parse(storedLeads) as Lead[];
        const updated = leadsList.map((l) =>
          l.id === activeLeadId ? { ...l, _count: { messages: (l._count?.messages ?? 0) + 1 } } : l
        );
        localStorage.setItem(leadsKey, JSON.stringify(updated));
      }

      // Notify updates
      const eventName = 'messages_' + activeLeadId;
      // Triggers pub/sub listeners
      if ((window as any).maxxi_notify) {
        (window as any).maxxi_notify(eventName);
        (window as any).maxxi_notify('conversations');
        (window as any).maxxi_notify('leads');
      }

      // Trigger Webhook/WebSocket notification sound
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav');
        audio.volume = 0.2;
        audio.play();
      } catch {}

      // Trigger socket event
      try {
        triggerMockSocketMessage(activeLeadId, activeLead.name, newMsg);
      } catch {}

      toast('Nova mensagem recebida de ' + activeLead.name, {
        icon: '💬',
        duration: 3000,
      });
    }, 15000);

    return () => clearInterval(chatSimulator);
  }, [activeLeadId, activeLead, selectedInstance]);

  // Send message action
  const handleSendMessage = async () => {
    if (!input.trim() || !activeLeadId || !selectedInstance) return;

    setSending(true);
    try {
      await dbService.sendMessage(activeLeadId, selectedInstance, input.trim());
      setInput('');
      // Force reload messages
      const msgs = await dbService.getMessages(activeLeadId);
      setMessages(msgs);
      loadConversations();

      // Trigger client typing state to match fake API reply latency
      setIsClientTyping(true);
      setTimeout(() => {
        setIsClientTyping(false);
      }, 1700);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  // Add tag to lead
  const addTagToLead = async (tag: Tag) => {
    if (!activeLead) return;
    const exists = activeLead.tags.some((t) => t.id === tag.id);
    if (exists) return;

    const newTags = [...activeLead.tags, tag];
    try {
      await dbService.updateLeadTags(activeLead.id, newTags);
      toast.success('Etiqueta adicionada');
    } catch {
      toast.error('Erro ao adicionar etiqueta');
    }
  };

  // Remove tag from lead
  const removeTagFromLead = async (tagId: string) => {
    if (!activeLead) return;
    const newTags = activeLead.tags.filter((t) => t.id !== tagId);
    try {
      await dbService.updateLeadTags(activeLead.id, newTags);
      toast.success('Etiqueta removida');
    } catch {
      toast.error('Erro ao remover etiqueta');
    }
  };

  // Update consignment values
  const handleUpdateConsignment = async () => {
    if (!activeLead) return;
    setUpdatingConsignment(true);
    try {
      await dbService.updateLead(activeLead.id, {
        consignmentValue: Number(consignmentVal),
        settledValue: Number(settledVal),
      });
      toast.success('Valores de consignação atualizados');
    } catch {
      toast.error('Erro ao atualizar valores');
    } finally {
      setUpdatingConsignment(false);
    }
  };

  // Quick task creator
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskDate || !activeLeadId) return;

    try {
      await dbService.createTask({
        title: newTaskTitle.trim(),
        dueDate: new Date(newTaskDate).toISOString(),
        leadId: activeLeadId,
        assignedUserId: activeLead?.assignedUserId || 'u2',
      });
      setNewTaskTitle('');
      setNewTaskDate('');
      toast.success('Tarefa criada com sucesso');
    } catch {
      toast.error('Erro ao criar tarefa');
    }
  };

  // Complete a task in drawer
  const handleCompleteTask = async (taskId: string) => {
    try {
      await dbService.completeTask(taskId);
      toast.success('Tarefa concluída');
    } catch {
      toast.error('Erro ao concluir tarefa');
    }
  };

  // Filter conversations
  const filteredConvs = conversations.filter((c) => {
    // search query
    const matchSearch = !convSearch ||
      c.leadName.toLowerCase().includes(convSearch.toLowerCase()) ||
      c.phone.includes(convSearch);

    // active chat ownership simulation (Juliana is u2, André is u1)
    if (chatFilter === 'my') {
      const lead = conversations.find((x) => x.leadId === c.leadId);
      // in our seeds, roberto(l1), ana(l2), vanessa(l4), claudia(l5) are u2 (Juliana)
      // marcos(l3), leticia(l6) are u1 (André)
      // let's display Juliana's leads for 'my'
      const leadObj = conversations.find((l) => l.leadId === c.leadId);
      // to keep it simple, filter by Juliana's assigned leads
      const assignedUser = leadObj?.leadId === 'l3' || leadObj?.leadId === 'l6' ? 'u1' : 'u2';
      return matchSearch && assignedUser === 'u2';
    }

    return matchSearch;
  });

  const activeConv = conversations.find((c) => c.leadId === activeLeadId);
  const activeInstance = instances.find((i) => i.id === selectedInstance);
  
  // Check if active lead is in Consignment Funnel (Stages s5 - s8)
  const isConsignmentFunnel = activeLead && [
    's5', 's6', 's7', 's8'
  ].includes(activeLead.currentStageId);

  return (
    <div className="flex h-full overflow-hidden">
      {/* COLUMN 1: Conversation list */}
      <div className="w-80 flex-shrink-0 border-r border-surface-border bg-white flex flex-col">
        <div className="p-4 border-b border-surface-border bg-emerald-950/[0.02] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-base text-emerald-950 font-bold flex items-center gap-1.5">
              <span>Chats WhatsApp</span>
              <Sparkles className="w-3.5 h-3.5 text-gold" />
            </h2>
            
            {/* Filter Toggle */}
            <div className="flex bg-surface-raised rounded-lg p-0.5 text-2xs font-semibold">
              <button
                onClick={() => setChatFilter('my')}
                className={cn(
                  'px-2 py-1 rounded-md transition-all',
                  chatFilter === 'my' ? 'bg-white text-emerald-950 shadow-soft' : 'text-graphite-muted'
                )}
              >
                Meus
              </button>
              <button
                onClick={() => setChatFilter('all')}
                className={cn(
                  'px-2 py-1 rounded-md transition-all',
                  chatFilter === 'all' ? 'bg-white text-emerald-950 shadow-soft' : 'text-graphite-muted'
                )}
              >
                Fila Geral
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-graphite-muted" />
            <input
              value={convSearch}
              onChange={(e) => setConvSearch(e.target.value)}
              placeholder="Buscar conversa..."
              className="w-full pl-8 pr-3 py-2 bg-background border border-surface-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-950/10 focus:border-emerald-950 transition-all placeholder:text-graphite-muted/70"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-surface-border/40">
          {filteredConvs.length === 0 ? (
            <p className="text-center text-xs text-graphite-muted py-12">Nenhuma conversa encontrada</p>
          ) : (
            filteredConvs.map((conv) => {
              // Find matching lead to identify WhatsApp instance assignment
              const leadDetails = conversations.find(l => l.leadId === conv.leadId);
              // Mock WhatsApp instance name labels based on lead source/funnel
              const instanceLabel = conv.leadId === 'l4' || conv.leadId === 'l5' 
                ? 'Consignado SP' 
                : 'Vendas Direct 01';

              return (
                <button
                  key={conv.leadId}
                  onClick={() => openConversation(conv.leadId)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-raised/40 transition-colors text-left border-l-4 border-l-transparent',
                    activeLeadId === conv.leadId && 'bg-emerald-950/[0.04] border-l-emerald-950'
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar name={conv.leadName} size="md" />
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-emerald-950 text-white text-[9px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center border-2 border-white">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={cn('text-xs truncate', conv.unreadCount > 0 ? 'font-bold text-graphite' : 'font-semibold text-graphite-light')}>
                        {conv.leadName}
                      </p>
                      <span className="text-[9px] text-graphite-muted flex-shrink-0 ml-1">
                        {timeAgo(conv.lastMessage.timestamp)}
                      </span>
                    </div>
                    
                    <p className={cn('text-2xs truncate mt-0.5', conv.unreadCount > 0 ? 'text-graphite font-medium' : 'text-graphite-muted')}>
                      {conv.lastMessage.direction === 'OUTBOUND' && <span className="text-emerald-950 font-bold">Você: </span>}
                      {conv.lastMessage.body}
                    </p>

                    {/* WhatsApp instance indicator */}
                    <div className="mt-1 flex items-center">
                      <span className="text-[8px] bg-emerald-950/10 text-emerald-950 font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide">
                        {instanceLabel}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* COLUMN 2: Message window */}
      <div className="flex-1 flex flex-col bg-background overflow-hidden border-r border-surface-border">
        {!activeLeadId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-graphite-muted text-xs gap-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/5 flex items-center justify-center text-emerald-950 mb-2">
              <Send className="w-5 h-5 rotate-45" />
            </div>
            <p className="font-semibold text-graphite-light text-sm">Nenhuma conversa selecionada</p>
            <p className="text-2xs text-graphite-muted/80">Escolha uma conversa na barra lateral para interagir.</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="h-16 bg-white border-b border-surface-border flex items-center justify-between px-6 flex-shrink-0 shadow-sm z-10">
              <div className="flex items-center gap-3">
                <Avatar name={activeConv?.leadName ?? '?'} />
                <div>
                  <p className="text-xs font-bold text-graphite">{activeConv?.leadName}</p>
                  <p className="text-[10px] text-graphite-muted font-medium">{formatPhone(activeConv?.phone ?? '')}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-2xs text-graphite-muted hidden md:inline font-semibold">Canal:</span>
                <select
                  value={selectedInstance}
                  onChange={(e) => setSelectedInstance(e.target.value)}
                  className="text-2xs border border-surface-border rounded-xl px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-950/10 bg-white font-medium text-graphite"
                >
                  {instances.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.status === 'CONNECTED' ? 'Conectado' : 'Desconectado'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Messages body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 scrollbar-thin bg-gradient-to-b from-[#FAF9F5] to-[#F5F3EC]">
              {messages.length === 0 ? (
                <div className="text-center text-2xs text-graphite-muted py-8 font-medium">Inicie a conversa enviando uma mensagem.</div>
              ) : (
                messages.map((msg) => {
                  const isOut = msg.direction === 'OUTBOUND';
                  return (
                    <div key={msg.id} className={cn('flex', isOut ? 'justify-end' : 'justify-start')}>
                      <div className={cn(
                        'max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-soft transition-all duration-300 relative',
                        isOut
                          ? 'bg-emerald-950 text-white rounded-tr-none border border-gold/15'
                          : 'bg-white border border-surface-border text-graphite rounded-tl-none'
                      )}>
                        <p className="whitespace-pre-wrap">{msg.body}</p>
                        <div className="flex items-center justify-end gap-1.5 mt-1 text-[9px] font-semibold select-none">
                          <span className={cn(isOut ? 'text-white/60' : 'text-graphite-muted')}>
                            {timeAgo(msg.timestamp)}
                          </span>
                          {isOut && (
                            <CheckCheck className="w-3.5 h-3.5 text-gold" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {isClientTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-surface-border text-graphite rounded-2xl rounded-tl-none px-4 py-3 text-xs shadow-soft flex items-center gap-2">
                    <span className="font-bold text-emerald-950">{activeConv?.leadName}</span>
                    <span className="text-graphite-muted/85 font-medium">está digitando</span>
                    <span className="flex gap-1 items-center pt-1">
                      <span className="w-1.5 h-1.5 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input form */}
            <div className="bg-white border-t border-surface-border p-4 flex-shrink-0 shadow-md">
              <div className="flex flex-wrap justify-between items-center mb-2 px-1 text-[10px] text-graphite-muted font-bold uppercase tracking-wider gap-2">
                <span>Atendimento por: <strong className="text-emerald-950 font-serif capitalize">{user?.name}</strong> ({user?.role === 'ADMIN' ? '👑 Admin' : '💼 Vendedor'})</span>
                {activeInstance && (
                  <span className="bg-emerald-950/5 text-emerald-950 border border-emerald-950/15 px-2 py-0.5 rounded-full">
                    via {activeInstance.name}
                  </span>
                )}
              </div>
              {activeInstance?.status !== 'CONNECTED' && (
                <div className="mb-2.5 text-center text-[10px] text-amber-700 bg-amber-50/50 py-1.5 px-3 rounded-xl border border-amber-200/50 font-bold tracking-wide">
                  Aviso: O canal selecionado está desconectado. Conecte-o na aba "WhatsApp" para simular o envio.
                </div>
              )}
              <div className="flex items-end gap-3 bg-[#FAF9F5] border border-surface-border rounded-2xl px-3 py-2 focus-within:ring-2 focus-within:ring-emerald-950/10 focus-within:border-emerald-950 transition-all">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Mensagem..."
                  rows={1}
                  className="flex-1 bg-transparent text-xs text-graphite placeholder:text-graphite-muted/80 resize-none focus:outline-none py-1 max-h-20 scrollbar-thin"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sending || !input.trim() || activeInstance?.status !== 'CONNECTED'}
                  className="w-8 h-8 flex-shrink-0 bg-emerald-950 text-white rounded-xl flex items-center justify-center hover:bg-emerald-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-0.5 shadow-soft"
                  title="Enviar mensagem"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* COLUMN 3: Right Context Drawer */}
      <div className="w-[300px] flex-shrink-0 bg-white border-l border-surface-border flex flex-col overflow-y-auto scrollbar-thin">
        {!activeLeadId || !activeLead ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-graphite-muted text-xs gap-1.5">
            <Info className="w-6 h-6 opacity-25" />
            <span className="font-semibold text-graphite-light">Informações do Contato</span>
            <span className="text-[10px] text-graphite-muted/80 leading-normal">
              Selecione um cliente para visualizar o perfil detalhado, tarefas e etiquetas.
            </span>
          </div>
        ) : (
          <div className="p-4 space-y-5">
            {/* Header info */}
            <div className="border-b border-surface-border pb-4 text-center space-y-1.5">
              <div className="flex justify-center">
                <Avatar name={activeLead.name} size="lg" />
              </div>
              <h3 className="font-serif text-sm font-bold text-graphite leading-tight">{activeLead.name}</h3>
              <p className="text-[10px] text-graphite-muted">{formatPhone(activeLead.phone)}</p>
              {activeLead.companyName && (
                <p className="text-[10px] bg-emerald-950/[0.04] text-emerald-950 font-semibold px-2 py-0.5 rounded-full inline-block">
                  🏢 {activeLead.companyName}
                </p>
              )}
            </div>

            {/* Consignment Panel (Displays and updates consignment values if the lead is in the consignment pipeline) */}
            {isConsignmentFunnel ? (
              <div className="bg-emerald-950/[0.02] border border-emerald-950/5 rounded-2xl p-3 space-y-3.5">
                <h4 className="text-2xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-gold" />
                  Valores Consignação
                </h4>
                
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-graphite-muted">Valor em Campo (Maleta):</label>
                    <div className="relative rounded-xl border border-surface-border overflow-hidden bg-white">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-2xs text-graphite-muted font-bold">R$</span>
                      <input
                        type="number"
                        value={consignmentVal}
                        onChange={(e) => setConsignmentVal(Number(e.target.value))}
                        className="w-full pl-8 pr-3 py-1 bg-transparent text-2xs focus:outline-none font-semibold text-graphite"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-graphite-muted">Valor Acertado / Faturado:</label>
                    <div className="relative rounded-xl border border-surface-border overflow-hidden bg-white">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-2xs text-graphite-muted font-bold">R$</span>
                      <input
                        type="number"
                        value={settledVal}
                        onChange={(e) => setSettledVal(Number(e.target.value))}
                        className="w-full pl-8 pr-3 py-1 bg-transparent text-2xs focus:outline-none font-semibold text-graphite"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleUpdateConsignment}
                    disabled={updatingConsignment}
                    className="w-full btn-gold text-xs py-1.5 font-bold shadow-soft flex items-center justify-center gap-1.5"
                  >
                    <DollarSign className="w-3 h-3" />
                    {updatingConsignment ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </div>
            ) : null}

            {/* Tags / Etiquetas Section */}
            <div className="space-y-2.5 border-b border-surface-border pb-4">
              <h4 className="text-2xs font-bold text-graphite uppercase tracking-wider flex items-center gap-1">
                <TagIcon className="w-3 h-3 text-gold" />
                Etiquetas
              </h4>
              
              {/* Active Tags */}
              <div className="flex flex-wrap gap-1.5">
                {activeLead.tags.length === 0 ? (
                  <span className="text-[10px] text-graphite-muted italic">Nenhuma etiqueta ativa</span>
                ) : (
                  activeLead.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold text-white shadow-soft"
                      style={{ backgroundColor: tag.colorHex }}
                    >
                      {tag.name}
                      <button
                        onClick={() => removeTagFromLead(tag.id)}
                        className="hover:bg-white/20 rounded-full w-3 h-3 flex items-center justify-center text-[8px]"
                        title="Remover"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Add tags selection */}
              <div className="space-y-1 pt-1.5">
                <label className="text-[9px] text-graphite-muted font-semibold uppercase">Vincular Etiqueta:</label>
                <div className="flex flex-wrap gap-1.5">
                  {globalTags
                    .filter((t) => !activeLead.tags.some((x) => x.id === t.id))
                    .map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => addTagToLead(tag)}
                        className="text-[9px] font-semibold border rounded-full px-2 py-0.5 hover:bg-surface-raised transition-colors flex items-center gap-1 text-graphite-light"
                        style={{ borderColor: tag.colorHex }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.colorHex }} />
                        {tag.name}
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {/* Tasks / Atividades Section */}
            <div className="space-y-3.5 pb-4">
              <h4 className="text-2xs font-bold text-graphite uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-950" />
                Planejamento de Tarefas
              </h4>

              {/* Task Creator Form */}
              <form onSubmit={handleCreateTask} className="space-y-2.5 bg-surface-raised/40 border border-surface-border/50 rounded-2xl p-2.5">
                <div className="space-y-1">
                  <input
                    type="text"
                    placeholder="Título da tarefa..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    required
                    className="w-full text-2xs px-2.5 py-1.5 border border-surface-border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-emerald-950"
                  />
                </div>
                <div className="space-y-1">
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-graphite-muted" />
                    <input
                      type="datetime-local"
                      value={newTaskDate}
                      onChange={(e) => setNewTaskDate(e.target.value)}
                      required
                      className="w-full pl-8 pr-2.5 py-1.5 border border-surface-border rounded-xl bg-white text-2xs focus:outline-none focus:ring-1 focus:ring-emerald-950 text-graphite font-medium"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full btn-primary text-2xs py-1.5 font-semibold flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Criar Tarefa
                </button>
              </form>

              {/* Lead Task List */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-bold text-graphite-light uppercase">Tarefas do Cliente</h5>
                {leadTasks.length === 0 ? (
                  <p className="text-[10px] text-graphite-muted italic">Nenhuma tarefa agendada</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
                    {leadTasks.map((task) => {
                      const isCompleted = task.status === 'COMPLETED';
                      const isOverdue = !isCompleted && new Date(task.dueDate) < new Date();
                      
                      return (
                        <div
                          key={task.id}
                          className={cn(
                            'p-2 rounded-xl border flex items-start gap-2 bg-white transition-colors',
                            isCompleted ? 'border-surface-border/50 bg-surface-raised/20' : 'border-surface-border'
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => !isCompleted && handleCompleteTask(task.id)}
                            className={cn(
                              'mt-0.5 flex-shrink-0 transition-colors',
                              isCompleted ? 'text-green-500 cursor-default' : 'text-graphite-muted hover:text-emerald-950'
                            )}
                          >
                            {isCompleted ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                          </button>
                          
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              'text-2xs font-semibold leading-tight truncate',
                              isCompleted ? 'line-through text-graphite-muted' : 'text-graphite'
                            )}>
                              {task.title}
                            </p>
                            <p className={cn(
                              'text-[9px] mt-0.5 flex items-center gap-0.5',
                              isOverdue ? 'text-red-500 font-bold' : 'text-graphite-muted'
                            )}>
                              {isOverdue && <AlertCircle className="w-2.5 h-2.5" />}
                              {new Date(task.dueDate).toLocaleString('pt-BR', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
