'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@components/layout/Header';
import Avatar from '@components/ui/Avatar';
import Badge from '@components/ui/Badge';
import { dbService, Lead, Pipeline } from '@lib/dbService';
import { formatDate, formatPhone, timeAgo } from '@lib/utils';
import { Plus, MessageSquare, Briefcase, Mail, Phone, UserPlus } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const SOURCE_VARIANT: Record<string, 'success' | 'info' | 'gold' | 'default'> = {
  Facebook: 'info',
  Website: 'success',
  WhatsApp: 'gold',
  Manual: 'default',
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // New Lead Modal State
  const [addModal, setAddModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [source, setSource] = useState<'WhatsApp' | 'Website' | 'Facebook' | 'Manual'>('WhatsApp');
  const [stageId, setStageId] = useState('');

  const fetchLeads = useCallback(async () => {
    try {
      const data = await dbService.getLeads();
      setLeads(data);
      const pipeData = await dbService.getPipelines();
      setPipelines(pipeData);
      if (pipeData[0]?.stages[0]) {
        setStageId(pipeData[0].stages[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    const unsub = dbService.subscribeLeads(fetchLeads);
    return () => unsub();
  }, [fetchLeads]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !stageId) {
      toast.error('Preencha os campos obrigatórios (*)');
      return;
    }

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      await dbService.createLead({
        name,
        phone: cleanPhone,
        email,
        companyName,
        source,
        currentStageId: stageId,
      });

      setAddModal(false);
      setName('');
      setPhone('');
      setEmail('');
      setCompanyName('');
      setSource('WhatsApp');
      toast.success('Lead cadastrado com sucesso');
      fetchLeads();
    } catch (e) {
      toast.error('Erro ao cadastrar lead');
    }
  };

  const filtered = leads.filter((l) =>
    !search ||
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.phone.includes(search) ||
    l.companyName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="Central de Leads"
        subtitle={`${leads.length} leads cadastrados`}
        showSearch
        onSearch={setSearch}
        actions={
          <button onClick={() => setAddModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Novo Lead
          </button>
        }
      />

      <div className="flex-1 overflow-auto p-6 scrollbar-thin">
        <div className="bg-white rounded-3xl border border-surface-border shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-surface-border bg-emerald-950/[0.01]">
                  <th className="text-left text-xs font-semibold text-graphite-muted uppercase tracking-wider px-6 py-4">Lead</th>
                  <th className="text-left text-xs font-semibold text-graphite-muted uppercase tracking-wider px-4 py-4">Telefone</th>
                  <th className="text-left text-xs font-semibold text-graphite-muted uppercase tracking-wider px-4 py-4">Canal</th>
                  <th className="text-left text-xs font-semibold text-graphite-muted uppercase tracking-wider px-4 py-4">Etapa</th>
                  <th className="text-left text-xs font-semibold text-graphite-muted uppercase tracking-wider px-4 py-4">Responsável</th>
                  <th className="text-left text-xs font-semibold text-graphite-muted uppercase tracking-wider px-4 py-4">Criado</th>
                  <th className="px-4 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-4">
                          <div className="h-4 bg-surface-raised rounded-full animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-graphite-muted text-sm font-medium">
                      {search ? 'Nenhum lead encontrado para a busca' : 'Nenhum lead cadastrado ainda'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((lead) => {
                    const allStages = pipelines.flatMap((p) => p.stages);
                    const stage = allStages.find((s) => s.id === lead.currentStageId);

                    return (
                      <tr key={lead.id} className="hover:bg-surface-raised/40 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={lead.name} size="sm" />
                            <div>
                              <p className="text-sm font-bold text-graphite">{lead.name}</p>
                              {lead.companyName && (
                                <p className="text-xs text-graphite-muted font-medium">{lead.companyName}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-graphite-light font-bold">
                            {formatPhone(lead.phone)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <Badge
                            label={lead.source}
                            variant={SOURCE_VARIANT[lead.source] ?? 'default'}
                            dot
                          />
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-xs font-bold text-emerald-950 bg-emerald-950/5 px-2.5 py-1 rounded-full border border-emerald-950/10">
                            {stage?.name ?? 'Sem Etapa'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Avatar name="Juliana Silva" size="sm" />
                            <span className="text-sm text-graphite-light font-semibold">
                              Juliana
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-xs text-graphite-muted font-medium">{timeAgo(lead.createdAt)}</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Link
                            href={`/chat?leadId=${lead.id}`}
                            className="inline-flex w-8 h-8 items-center justify-center rounded-xl hover:bg-emerald-950/8 text-graphite-muted hover:text-emerald-950 transition-colors"
                            title="Abrir chat do lead"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Lead Modal */}
      {addModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setAddModal(false)}>
          <form onSubmit={handleCreateLead} className="bg-white rounded-3xl shadow-modal p-8 max-w-sm w-full border border-surface-border" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-lg text-emerald-950 font-bold mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-gold" />
              <span>Novo Lead Maxxi</span>
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-graphite mb-1">Nome Completo *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos de Oliveira"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-base"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-graphite mb-1">Telefone *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Ex: (11) 98888-8888"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-base"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-graphite mb-1">E-mail</label>
                <input
                  type="email"
                  placeholder="Ex: carlos@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-base"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-graphite mb-1">Nome da Empresa</label>
                <input
                  type="text"
                  placeholder="Ex: Mercado Compre Bem"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="input-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-graphite mb-1">Canal de Origem</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value as any)}
                    className="input-base font-semibold"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Website">Website</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-graphite mb-1">Etapa Inicial</label>
                  <select
                    value={stageId}
                    onChange={(e) => setStageId(e.target.value)}
                    className="input-base font-semibold text-xs"
                  >
                    {pipelines.map((p) => (
                      <optgroup key={p.id} label={p.name}>
                        {p.stages.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button type="button" onClick={() => setAddModal(false)} className="btn-secondary flex-1">
                Cancelar
              </button>
              <button type="submit" className="btn-primary flex-1 shadow-soft">
                Cadastrar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
