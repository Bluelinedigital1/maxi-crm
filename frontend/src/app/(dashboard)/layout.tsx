'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@components/layout/Sidebar';
import { useAuthStore } from '@store/authStore';
import { connectSocket, disconnectSocket, triggerMockSocketMessage } from '@lib/socket';
import { useChatStore } from '@store/chatStore';
import { api } from '@lib/api';
import { dbService } from '@lib/dbService';
import { Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const { setUnreadTotal, appendMessage } = useChatStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    const socket = connectSocket();

    socket.on('message:new', (payload: { leadId: string; leadName: string; message: any }) => {
      appendMessage(payload.message);
      api.get('/api/messages/unread/count').then(({ data }) => setUnreadTotal(data));
    });

    api.get('/api/messages/unread/count').then(({ data }) => setUnreadTotal(data));

    return () => {
      socket.off('message:new');
      disconnectSocket();
    };
  }, [isAuthenticated, router, appendMessage, setUnreadTotal]);

  const handleSimulateWebhook = async () => {
    try {
      const names = ['Mariana Mendes', 'Felipe Santos', 'Patrícia Rocha', 'Thiago Oliveira', 'Larissa Costa'];
      const companies = ['Mendes Semi-Joias', 'Santos Gold & Co', 'Rocha Design', 'Oliveira Atacado', 'Costa Acessórios'];
      
      const randomIdx = Math.floor(Math.random() * names.length);
      const name = names[randomIdx];
      const companyName = companies[randomIdx];
      const phone = '119' + Math.floor(10000000 + Math.random() * 90000000).toString();
      const email = name.toLowerCase().replace(' ', '.') + '@gmail.com';
      
      const users = await dbService.getUsers();
      const sellers = users.filter((u) => u.role === 'SELLER' || u.role === 'ADMIN');
      
      const leads = await dbService.getLeads();
      // Round-Robin assignment based on leads length
      const roundRobinSeller = sellers[leads.length % sellers.length] || sellers[0];
      
      const isConsignment = Math.random() > 0.5;
      const currentStageId = isConsignment ? 's5' : 's1'; // s5: Análise, s1: Lead
      
      // 1. Create lead
      const newLead = await dbService.createLead({
        name,
        phone,
        email,
        companyName,
        source: 'Facebook',
        currentStageId,
        assignedUserId: roundRobinSeller.id,
        consignmentValue: isConsignment ? 15000 : 0,
        settledValue: 0
      });
      
      // 2. Create initial message
      const initialMessageText = isConsignment 
        ? 'Olá! Vi seu anúncio sobre as maletas consignadas de joias no Facebook. Gostaria de solicitar um mostruário.'
        : 'Olá! Tenho interesse no catálogo de semijoias corporativas por atacado. Qual o pedido mínimo?';
        
      const storageKey = 'maxxi_crm_messages';
      const stored = localStorage.getItem(storageKey);
      const allMsgs = stored ? JSON.parse(stored) : [];
      const newMsg = {
        id: 'msg_webhook_' + Math.random().toString(36).substr(2, 9),
        leadId: newLead.id,
        whatsappInstanceId: 'w1',
        direction: 'INBOUND',
        body: initialMessageText,
        timestamp: new Date().toISOString(),
        isRead: false
      };
      
      localStorage.setItem(storageKey, JSON.stringify([...allMsgs, newMsg]));
      
      // 3. Update count on lead
      await dbService.updateLead(newLead.id, { _count: { messages: 1 } });
      
      // 4. Trigger Webhook sound
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav');
        audio.volume = 0.2;
        audio.play();
      } catch {}
      
      // 5. Notify active listeners (pub/sub)
      if ((window as any).maxxi_notify) {
        (window as any).maxxi_notify('leads');
        (window as any).maxxi_notify('conversations');
        (window as any).maxxi_notify('messages_' + newLead.id);
      }
      
      // 6. Emit mock socket event
      triggerMockSocketMessage(newLead.id, newLead.name, newMsg);
      
      // 7. Update unread count in store
      const { data: count } = await api.get('/api/messages/unread/count');
      setUnreadTotal(count);
      
      toast.success(
        `[Webhook Facebook] Novo Lead: "${name}" recebido e designado para "${roundRobinSeller.name}"!`,
        { duration: 5000, icon: '⚡' }
      );
    } catch (e) {
      console.error(e);
      toast.error('Erro ao simular webhook');
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <Sidebar />
      <main className="flex-1 ml-[72px] flex flex-col overflow-hidden">
        {children}
      </main>

      {/* Floating Webhook Simulator Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleSimulateWebhook}
          className="flex items-center gap-2 bg-emerald-950/95 backdrop-blur-md hover:bg-emerald-900 text-white font-sans font-semibold tracking-wide px-5 py-3.5 rounded-full shadow-modal border border-gold/40 hover:border-gold hover:scale-105 active:scale-95 transition-all duration-300"
          title="Simular Entrada de Lead por Webhook (Facebook Ads)"
        >
          <Sparkles className="w-4.5 h-4.5 text-gold animate-pulse" />
          <span className="text-xs">Simular Lead (Webhook)</span>
        </button>
      </div>
    </div>
  );
}
