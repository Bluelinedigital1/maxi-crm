'use client';

import { useEffect, useState } from 'react';
import Header from '@components/layout/Header';
import Avatar from '@components/ui/Avatar';
import Badge from '@components/ui/Badge';
import { dbService, User, Tag as TagType } from '@lib/dbService';
import { cn } from '@lib/utils';
import { useAuthStore } from '@store/authStore';
import {
  Users, Tag, ChevronRight, Plus, Trash2, Pencil, Check, X,
} from 'lucide-react';
import toast from 'react-hot-toast';

type Tab = 'users' | 'tags';

const ROLE_BADGE: Record<string, 'default' | 'gold' | 'info'> = {
  ADMIN: 'gold',
  MANAGER: 'info',
  SELLER: 'default',
};

const TAG_COLORS = ['#0F4C3A', '#D4AF37', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899', '#F97316', '#14B8A6'];

export default function SettingsPage() {
  const { user: me } = useAuthStore();
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [loading, setLoading] = useState(false);

  const [newTag, setNewTag] = useState({ name: '', colorHex: TAG_COLORS[0] });
  const [addingTag, setAddingTag] = useState(false);
  const [savingTag, setSavingTag] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'users') {
        const usersData = await dbService.getUsers();
        setUsers(usersData);
      } else {
        const tagsData = await dbService.getTags();
        setTags(tagsData);
      }
    } catch (e) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tab]);

  const toggleUserActive = async (user: User) => {
    try {
      const updatedUser = await dbService.updateUser(user.id, { isActive: !user.isActive });
      setUsers((prev) => prev.map((u) => u.id === user.id ? updatedUser : u));
      toast.success(user.isActive ? 'Usuário desativado' : 'Usuário ativado');
    } catch {
      toast.error('Erro ao atualizar usuário');
    }
  };

  const saveTag = async () => {
    if (!newTag.name.trim()) return;
    setSavingTag(true);
    try {
      const created = await dbService.createTag(newTag);
      setTags((prev) => [...prev, created]);
      setNewTag({ name: '', colorHex: TAG_COLORS[0] });
      setAddingTag(false);
      toast.success('Etiqueta criada');
    } catch {
      toast.error('Erro ao criar etiqueta');
    } finally {
      setSavingTag(false);
    }
  };

  const removeTag = async (id: string) => {
    if (!confirm('Remover esta etiqueta?')) return;
    try {
      await dbService.deleteTag(id);
      setTags((prev) => prev.filter((t) => t.id !== id));
      toast.success('Etiqueta removida');
    } catch {
      toast.error('Erro ao remover etiqueta');
    }
  };

  const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
    { key: 'users', label: 'Usuários', icon: Users },
    { key: 'tags', label: 'Etiquetas', icon: Tag },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header title="Configurações" subtitle="Usuários, etiquetas e preferências" />

      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Tab nav */}
          <div className="flex items-center gap-1 bg-white border border-surface-border rounded-2xl p-1 w-fit shadow-soft">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
                  tab === key ? 'bg-emerald-950 text-white shadow-soft' : 'text-graphite-muted hover:text-graphite',
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Users tab */}
          {tab === 'users' && (
            <div className="bg-white rounded-3xl border border-surface-border shadow-soft overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-emerald-950/[0.02]">
                <h3 className="font-serif text-base text-emerald-950 font-bold">Equipe</h3>
                {me?.role === 'ADMIN' && (
                  <button className="btn-primary flex items-center gap-2 text-xs py-2 shadow-soft">
                    <Plus className="w-3.5 h-3.5" />
                    Novo Usuário
                  </button>
                )}
              </div>

              {loading ? (
                <div className="divide-y divide-surface-border">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                      <div className="w-9 h-9 rounded-full bg-surface-raised flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-surface-raised rounded-full w-1/3" />
                        <div className="h-3 bg-surface-raised rounded-full w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-surface-border">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center gap-4 px-6 py-4 hover:bg-surface-raised/30 transition-colors">
                      <div className="relative flex-shrink-0">
                        <Avatar name={user.name} />
                        {!user.isActive && (
                          <span className="absolute inset-0 rounded-full bg-white/60 flex items-center justify-center">
                            <X className="w-3 h-3 text-graphite-muted" />
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn('text-sm font-bold', !user.isActive && 'text-graphite-muted line-through')}>
                            {user.name}
                          </p>
                          <Badge label={user.role} variant={ROLE_BADGE[user.role]} />
                        </div>
                        <p className="text-xs text-graphite-muted font-medium">{user.email}</p>
                      </div>

                      {me?.role === 'ADMIN' && user.id !== me.id && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => toggleUserActive(user)}
                            className={cn(
                              'text-xs px-3 py-1.5 rounded-xl border font-bold transition-colors shadow-soft',
                              user.isActive
                                ? 'border-red-200 text-red-500 hover:bg-red-50'
                                : 'border-green-200 text-green-600 hover:bg-green-50',
                            )}
                          >
                            {user.isActive ? 'Desativar' : 'Ativar'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tags tab */}
          {tab === 'tags' && (
            <div className="bg-white rounded-3xl border border-surface-border shadow-soft overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border bg-emerald-950/[0.02]">
                <h3 className="font-serif text-base text-emerald-950 font-bold">Etiquetas</h3>
                {me?.role !== 'SELLER' && (
                  <button
                    onClick={() => setAddingTag(true)}
                    className="btn-primary flex items-center gap-2 text-xs py-2 shadow-soft"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Nova Etiqueta
                  </button>
                )}
              </div>

              {addingTag && (
                <div className="px-6 py-4 border-b border-surface-border bg-surface-raised/40 flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {TAG_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewTag((p) => ({ ...p, colorHex: color }))}
                        className={cn(
                          'w-6 h-6 rounded-full transition-all duration-200 flex items-center justify-center',
                          newTag.colorHex === color && 'ring-2 ring-offset-2 ring-graphite scale-110',
                        )}
                        style={{ backgroundColor: color }}
                      >
                        {newTag.colorHex === color && <Check className="w-3 h-3 text-white" />}
                      </button>
                    ))}
                  </div>
                  <input
                    value={newTag.name}
                    onChange={(e) => setNewTag((p) => ({ ...p, name: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && saveTag()}
                    placeholder="Nome da etiqueta..."
                    className="input-base flex-1 min-w-0 font-medium"
                    autoFocus
                  />
                  <button
                    onClick={saveTag}
                    disabled={savingTag || !newTag.name.trim()}
                    className="btn-primary py-2 text-xs shadow-soft"
                  >
                    {savingTag ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button onClick={() => setAddingTag(false)} className="btn-secondary py-2 text-xs shadow-soft">
                    Cancelar
                  </button>
                </div>
              )}

              {loading ? (
                <div className="divide-y divide-surface-border">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                      <div className="w-4 h-4 rounded-full bg-surface-raised" />
                      <div className="h-4 bg-surface-raised rounded-full w-1/4" />
                    </div>
                  ))}
                </div>
              ) : tags.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-graphite-muted">
                  <Tag className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm font-semibold text-graphite">Nenhuma etiqueta criada</p>
                </div>
              ) : (
                <div className="divide-y divide-surface-border">
                  {tags.map((tag) => (
                    <div key={tag.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-surface-raised/30 transition-colors group">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tag.colorHex }}
                      />
                      <Badge label={tag.name} style={{ backgroundColor: tag.colorHex + '20', color: tag.colorHex }} className="font-semibold text-[10px]" />
                      <span className="flex-1" />
                      {me?.role === 'ADMIN' && (
                        <button
                          onClick={() => removeTag(tag.id)}
                          className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg text-graphite-muted hover:text-red-500 transition-all border border-transparent hover:border-red-100 hover:bg-red-50 shadow-soft"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
