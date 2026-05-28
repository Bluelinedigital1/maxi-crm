'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@components/layout/Header';
import Badge from '@components/ui/Badge';
import Avatar from '@components/ui/Avatar';
import { api } from '@lib/api';
import { cn } from '@lib/utils';
import { dbService, WhatsappInstance, User } from '@lib/dbService';
import {
  Smartphone, Plus, RefreshCw, Power, Trash2, QrCode, Wifi, WifiOff, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

const STATUS_BADGE: Record<WhatsappInstance['status'], { variant: 'success' | 'danger' | 'warning'; label: string }> = {
  CONNECTED: { variant: 'success', label: 'Conectado' },
  DISCONNECTED: { variant: 'danger', label: 'Desconectado' },
  CONNECTING: { variant: 'warning', label: 'Conectando...' },
};

export default function WhatsappPage() {
  const [instances, setInstances] = useState<WhatsappInstance[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [qrModal, setQrModal] = useState<{ instanceId: string; qr: string } | null>(null);
  const [loadingQr, setLoadingQr] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Instance Form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newUserId, setNewUserId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/whatsapp/instances');
      setInstances(data);
      
      const usersData = await dbService.getUsers();
      setUsers(usersData);
      if (usersData[0]) {
        setNewUserId(usersData[0].id);
      }
    } catch {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  // Set up live pub/sub subscriptions for real-time connection status updates
  useEffect(() => {
    load();

    const unsub = dbService.subscribeWhatsapp(() => {
      dbService.getWhatsappInstances().then((data) => {
        setInstances(data);
        
        // If QR modal is open and status became CONNECTED, close modal and show toast
        if (qrModal) {
          const current = data.find((i) => i.id === qrModal.instanceId);
          if (current && current.status === 'CONNECTED') {
            setQrModal(null);
            toast.success(`WhatsApp "${current.name}" conectado com sucesso!`);
          }
        }
      });
    });

    return () => unsub();
  }, [load, qrModal]);

  const getQr = async (id: string) => {
    setLoadingQr(id);
    try {
      const { data } = await api.get(`/api/whatsapp/instances/${id}/qr`);
      if (data.qrCodeBase64) {
        setQrModal({ instanceId: id, qr: data.qrCodeBase64 });
      } else {
        toast.error('QR Code não disponível');
      }
    } catch {
      toast.error('Erro ao gerar QR Code');
    } finally {
      setLoadingQr(null);
    }
  };

  const disconnect = async (id: string) => {
    try {
      await api.patch(`/api/whatsapp/instances/${id}/disconnect`);
      toast.success('Instância desconectada');
    } catch {
      toast.error('Erro ao desconectar');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Remover esta instância? Esta ação não pode ser desfeita.')) return;
    try {
      await api.delete(`/api/whatsapp/instances/${id}`);
      toast.success('Instância removida');
    } catch {
      toast.error('Erro ao remover instância');
    }
  };

  const handleAddInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim() || !newUserId) return;

    setSubmitting(true);
    try {
      const selectedUser = users.find((u) => u.id === newUserId);
      const payload = {
        name: newName.trim(),
        phoneNumber: newPhone.trim(),
        userId: newUserId,
        user: { id: newUserId, name: selectedUser?.name || 'Vendedor' }
      };
      
      await api.post('/api/whatsapp/instances', payload);
      
      setNewName('');
      setNewPhone('');
      setShowAddModal(false);
      toast.success('Instância cadastrada! Agora clique em conectar.');
    } catch {
      toast.error('Erro ao cadastrar instância');
    } finally {
      setSubmitting(false);
    }
  };

  const connected = instances.filter((i) => i.status === 'CONNECTED').length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Configurações do WhatsApp"
        subtitle={`${connected} de ${instances.length} instâncias conectadas`}
        actions={
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-gold" />
            Nova Instância
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Conectadas', value: connected, color: 'text-green-600 bg-green-50' },
            { label: 'Desconectadas', value: instances.filter((i) => i.status === 'DISCONNECTED').length, color: 'text-red-500 bg-red-50' },
            { label: 'Total', value: instances.length, color: 'text-emerald-950 bg-emerald-950/5' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-3xl border border-surface-border shadow-soft p-5 flex items-center gap-4">
              <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center', color)}>
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-graphite leading-none mb-1">{value}</p>
                <p className="text-xs font-medium text-graphite-muted">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Instance grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-3xl border border-surface-border shadow-soft p-6 space-y-4 animate-pulse">
                <div className="h-5 bg-surface-raised rounded-full w-2/3" />
                <div className="h-4 bg-surface-raised rounded-full w-1/2" />
                <div className="h-8 bg-surface-raised rounded-xl" />
              </div>
            ))}
          </div>
        ) : instances.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-graphite-muted bg-white border border-surface-border rounded-3xl">
            <Smartphone className="w-12 h-12 mb-4 opacity-20 text-gold" />
            <p className="text-sm font-semibold text-graphite">Nenhuma instância vinculada</p>
            <p className="text-xs text-graphite-muted mt-1">Clique em "Nova Instância" para conectar um número.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {instances.map((instance) => {
              const badge = STATUS_BADGE[instance.status];
              return (
                <div key={instance.id} className="bg-white rounded-3xl border border-surface-border shadow-soft p-6 flex flex-col justify-between gap-4">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-2xl flex items-center justify-center',
                          instance.status === 'CONNECTED' ? 'bg-green-50' : 'bg-surface-raised',
                        )}>
                          {instance.status === 'CONNECTED'
                            ? <Wifi className="w-5 h-5 text-green-600" />
                            : <WifiOff className="w-5 h-5 text-graphite-muted" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-graphite">{instance.name}</p>
                          <p className="text-xs text-graphite-muted">{instance.phoneNumber}</p>
                        </div>
                      </div>
                      <Badge label={badge.label} variant={badge.variant} dot />
                    </div>

                    <div className="flex items-center gap-2 text-xs text-graphite-light bg-surface-raised/50 rounded-xl px-3 py-2 border border-surface-border/30">
                      <Avatar name={instance.user?.name || '?'} size="sm" />
                      <span className="font-medium">Responsável: {instance.user?.name}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-surface-border/40">
                    {instance.status !== 'CONNECTED' && (
                      <button
                        onClick={() => getQr(instance.id)}
                        disabled={loadingQr === instance.id || instance.status === 'CONNECTING'}
                        className="flex-1 flex items-center justify-center gap-1.5 btn-primary text-xs py-2 shadow-soft"
                      >
                        {loadingQr === instance.id || instance.status === 'CONNECTING'
                          ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          : <QrCode className="w-3.5 h-3.5" />}
                        {instance.status === 'CONNECTING' ? 'Gerando QR...' : 'Conectar'}
                      </button>
                    )}
                    {instance.status === 'CONNECTED' && (
                      <button
                        onClick={() => disconnect(instance.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 btn-secondary text-xs py-2 border border-surface-border"
                      >
                        <Power className="w-3.5 h-3.5 text-red-500" />
                        Desconectar
                      </button>
                    )}
                    <button
                      onClick={() => remove(instance.id)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl border border-surface-border text-graphite-muted hover:text-red-500 hover:border-red-200 transition-colors"
                      title="Remover Instância"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Instance Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddInstance}
            className="bg-white rounded-3xl shadow-modal p-6 max-w-sm w-full space-y-4 border border-surface-border"
          >
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="font-serif text-base font-bold text-graphite">Nova Instância WhatsApp</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-lg hover:bg-surface-raised flex items-center justify-center text-graphite-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-2xs font-bold text-graphite-muted uppercase">Nome da Instância</label>
                <input
                  type="text"
                  placeholder="Ex: Vendas WhatsApp 02"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="input-base"
                />
              </div>

              <div className="space-y-1">
                <label className="text-2xs font-bold text-graphite-muted uppercase">Número de Telefone</label>
                <input
                  type="text"
                  placeholder="Ex: +55 11 99999-0000"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  required
                  className="input-base"
                />
              </div>

              <div className="space-y-1">
                <label className="text-2xs font-bold text-graphite-muted uppercase">Vendedor Responsável</label>
                <select
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  className="input-base text-xs text-graphite"
                  required
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="btn-secondary flex-1 py-2 text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary flex-1 py-2 text-xs"
              >
                {submitting ? 'Cadastrando...' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* QR Connection Modal */}
      {qrModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setQrModal(null)}>
          <div className="bg-white rounded-3xl shadow-modal p-6 max-w-sm w-full border border-surface-border text-center space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-surface-border pb-3 text-left">
              <h3 className="font-serif text-base font-bold text-graphite">Conectar Dispositivo</h3>
              <button
                type="button"
                onClick={() => setQrModal(null)}
                className="w-7 h-7 rounded-lg hover:bg-surface-raised flex items-center justify-center text-graphite-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-graphite-muted leading-relaxed">
              <p>Abra o WhatsApp no seu smartphone corporativo.</p>
              <p className="font-medium text-graphite-light">Mais opções (⋮) → Aparelhos conectados → Conectar aparelho</p>
            </div>

            <div className="flex justify-center pt-2">
              <div className="w-48 h-48 bg-surface-raised/40 border border-surface-border rounded-2xl flex items-center justify-center p-4 relative overflow-hidden">
                <Image
                  src={qrModal.qr}
                  alt="QR Code WhatsApp corporativo"
                  width={160}
                  height={160}
                  className="rounded-xl border border-surface-border shadow-soft"
                />
                
                {/* Simulated laser scan line */}
                <div className="scanner-laser top-4 z-10" />

                {/* Subdued text indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-emerald-950/90 backdrop-blur-sm border border-gold/25 text-white text-[8px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg select-none flex items-center gap-1.5 shadow-card">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin text-gold" />
                  <span>Aguardando leitura...</span>
                </div>
              </div>
            </div>

            <button onClick={() => setQrModal(null)} className="btn-secondary w-full py-2 text-xs">
              Cancelar Sincronização
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
