'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@components/layout/Header';
import Avatar from '@components/ui/Avatar';
import Badge from '@components/ui/Badge';
import { dbService, Task, Lead } from '@lib/dbService';
import { formatDate, cn } from '@lib/utils';
import { CheckCircle2, Circle, Clock, Plus, AlertCircle, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

type Filter = 'all' | 'pending' | 'overdue' | 'completed';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'overdue', label: 'Atrasadas' },
  { key: 'completed', label: 'Concluídas' },
];

function isOverdue(task: Task) {
  return task.status === 'PENDING' && new Date(task.dueDate) < new Date();
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<Filter>('pending');
  const [loading, setLoading] = useState(true);

  // New task modal state
  const [addModal, setAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState('');

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dbService.getTasks();
      setTasks(data);
      const leadsData = await dbService.getLeads();
      setLeads(leadsData);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar tarefas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    const unsub = dbService.subscribeTasks(loadTasks);
    return () => unsub();
  }, [loadTasks]);

  const complete = async (id: string) => {
    try {
      await dbService.completeTask(id);
      toast.success('Tarefa concluída');
      loadTasks();
    } catch {
      toast.error('Erro ao concluir tarefa');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    try {
      await dbService.createTask({
        title,
        description,
        dueDate: new Date(dueDate).toISOString(),
        leadId: selectedLeadId,
        assignedUserId: 'u2', // default to active user
      });
      setAddModal(false);
      setTitle('');
      setDescription('');
      setDueDate('');
      setSelectedLeadId('');
      toast.success('Tarefa criada com sucesso');
      loadTasks();
    } catch {
      toast.error('Erro ao criar tarefa');
    }
  };

  const filtered = tasks.filter((t) => {
    if (filter === 'pending') return t.status === 'PENDING' && !isOverdue(t);
    if (filter === 'overdue') return isOverdue(t);
    if (filter === 'completed') return t.status === 'COMPLETED';
    return true;
  });

  const counts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === 'PENDING' && !isOverdue(t)).length,
    overdue: tasks.filter(isOverdue).length,
    completed: tasks.filter((t) => t.status === 'COMPLETED').length,
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Tarefas"
        subtitle="Suas atividades do dia"
        actions={
          <button onClick={() => setAddModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nova Tarefa
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin space-y-4">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-white border border-surface-border rounded-2xl p-1 w-fit shadow-soft">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
                filter === key
                  ? 'bg-emerald-950 text-white shadow-soft'
                  : 'text-graphite-muted hover:text-graphite',
              )}
            >
              {label}
              {counts[key] > 0 && (
                <span className={cn(
                  'text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1',
                  filter === key
                    ? 'bg-white/20 text-white'
                    : key === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-surface-raised text-graphite-muted',
                )}>
                  {counts[key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Task list */}
        <div className="bg-white rounded-3xl border border-surface-border shadow-soft overflow-hidden">
          {loading ? (
            <div className="divide-y divide-surface-border">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-5 h-5 rounded-full bg-surface-raised animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-surface-raised rounded-full w-3/4 animate-pulse" />
                    <div className="h-3 bg-surface-raised rounded-full w-1/3 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-graphite-muted">
              <CheckCircle2 className="w-10 h-10 mb-3 opacity-30 text-emerald-950" />
              <p className="text-sm font-semibold text-graphite">Nenhuma tarefa nesta categoria</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-border">
              {filtered.map((task) => {
                const overdue = isOverdue(task);
                const done = task.status === 'COMPLETED';
                const associatedLead = leads.find((l) => l.id === task.leadId);

                return (
                  <div
                    key={task.id}
                    className="flex items-start gap-4 px-6 py-4 hover:bg-surface-raised/30 transition-colors group"
                  >
                    <button
                      onClick={() => !done && complete(task.id)}
                      className={cn(
                        'mt-0.5 flex-shrink-0 transition-colors',
                        done ? 'text-green-500 cursor-default' : 'text-graphite-muted hover:text-emerald-950',
                      )}
                    >
                      {done
                        ? <CheckCircle2 className="w-5 h-5" />
                        : overdue
                          ? <AlertCircle className="w-5 h-5 text-red-500" />
                          : <Circle className="w-5 h-5" />
                      }
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm font-bold',
                        done ? 'line-through text-graphite-muted' : 'text-graphite',
                      )}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-graphite-muted mt-1 font-medium">{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {associatedLead && (
                          <span className="text-2xs font-semibold text-emerald-950 bg-emerald-950/5 px-2.5 py-0.5 rounded-lg border border-emerald-950/10">
                            Lead: {associatedLead.name}
                          </span>
                        )}
                        <div className={cn(
                          'flex items-center gap-1 text-[11px] font-semibold',
                          overdue ? 'text-red-500' : 'text-graphite-muted',
                        )}>
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(task.dueDate, "dd/MM/yyyy 'às' HH:mm")}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {overdue && <Badge label="Atrasada" variant="danger" />}
                      {done && <Badge label="Concluída" variant="success" />}
                      <Avatar name="Juliana Silva" size="sm" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      {addModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setAddModal(false)}>
          <form onSubmit={handleCreateTask} className="bg-white rounded-3xl shadow-modal p-8 max-w-sm w-full border border-surface-border" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-lg text-emerald-950 font-bold mb-4">Nova Tarefa</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-graphite mb-1">Título *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Enviar catálogo"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-base"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-graphite mb-1">Descrição</label>
                <textarea
                  placeholder="Detalhes sobre a tarefa..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-base min-h-[60px]"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-graphite mb-1">Data e Hora de Vencimento *</label>
                <input
                  type="datetime-local"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="input-base"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-graphite mb-1">Vincular a Lead</label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="input-base font-medium"
                >
                  <option value="">Nenhum lead</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>{l.name} ({l.companyName || 'Avulso'})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button type="button" onClick={() => setAddModal(false)} className="btn-secondary flex-1">
                Cancelar
              </button>
              <button type="submit" className="btn-primary flex-1">
                Adicionar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
