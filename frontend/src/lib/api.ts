import { dbService } from './dbService';

type PatternParams = Record<string, string>;

const matchPath = (pattern: string, url: string): PatternParams | null => {
  const cleanUrl = url.split('?')[0];
  const patternParts = pattern.split('/');
  const urlParts = cleanUrl.split('/');
  if (patternParts.length !== urlParts.length) return null;

  const params: PatternParams = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = urlParts[i];
    } else if (patternParts[i] !== urlParts[i]) {
      return null;
    }
  }
  return params;
};

export const api = {
  interceptors: {
    request: { use: (cb: any) => {} },
    response: { use: (cb: any, errCb?: any) => {} },
  },
  get: async (url: string, config?: any) => {
    // Small artificial delay to mimic network latency
    await new Promise((r) => setTimeout(r, 150));

    if (url.startsWith('/api/leads')) {
      const leads = await dbService.getLeads();
      const pipelines = await dbService.getPipelines();
      const users = await dbService.getUsers();
      const stages = pipelines.flatMap((p) => p.stages);

      const populated = leads.map((l) => ({
        ...l,
        currentStage: stages.find((s) => s.id === l.currentStageId),
        assignedUser: users.find((u) => u.id === l.assignedUserId),
      }));
      return { data: populated };
    }

    if (url.startsWith('/api/messages/unread/count')) {
      const convs = await dbService.getConversations();
      const total = convs.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
      return { data: total };
    }

    if (url.startsWith('/api/whatsapp/instances')) {
      const qrMatch = matchPath('/api/whatsapp/instances/:id/qr', url);
      if (qrMatch) {
        const qr = await dbService.getQrCode(qrMatch.id);
        return { data: { qrCodeBase64: qr } };
      }
      const instances = await dbService.getWhatsappInstances();
      return { data: instances };
    }

    if (url.startsWith('/api/users')) {
      const users = await dbService.getUsers();
      return { data: users };
    }

    if (url.startsWith('/api/tags')) {
      const tags = await dbService.getTags();
      return { data: tags };
    }

    if (url.startsWith('/api/tasks/my')) {
      const tasks = await dbService.getTasks();
      const leads = await dbService.getLeads();
      const users = await dbService.getUsers();
      const populated = tasks.map((t) => ({
        ...t,
        lead: leads.find((l) => l.id === t.leadId),
        assignedUser: users.find((u) => u.id === t.assignedUserId),
      }));
      return { data: populated };
    }

    if (url.startsWith('/api/analytics/overview')) {
      const leads = await dbService.getLeads();
      const tasks = await dbService.getTasks();

      // Calculate pending / overdue
      const now = new Date();
      const pendingTasks = tasks.filter((t) => t.status === 'PENDING' && new Date(t.dueDate) >= now);
      const overdueTasks = tasks.filter((t) => t.status === 'PENDING' && new Date(t.dueDate) < now);

      // Source breakdown
      const sources: Record<string, number> = {};
      leads.forEach((l) => {
        sources[l.source] = (sources[l.source] || 0) + 1;
      });
      const leadsBySource = Object.entries(sources).map(([source, count]) => ({ source, count }));

      // messagesInbound estimation
      const conversations = await dbService.getConversations();
      const messagesInbound = conversations.reduce((acc, c) => acc + (c.unreadCount || 0) + 8, 0);

      // Consignment values
      const totalConsignment = leads.reduce((sum, l) => sum + (l.consignmentValue || 0), 0);
      const totalSettled = leads.reduce((sum, l) => sum + (l.settledValue || 0), 0);

      // Conversion rate
      const wonLeads = leads.filter((l) => l.currentStageId === 's4' || l.currentStageId === 's8');
      const conversionRate = leads.length > 0 ? Math.round((wonLeads.length / leads.length) * 100) : 0;

      return {
        data: {
          totalLeads: leads.length,
          leadsBySource,
          tasks: {
            pending: pendingTasks.length,
            overdue: overdueTasks.length,
          },
          messagesInbound,
          totalConsignment,
          totalSettled,
          conversionRate,
        },
      };
    }

    if (url.startsWith('/api/analytics/sellers')) {
      const leads = await dbService.getLeads();
      const tasks = await dbService.getTasks();
      const users = await dbService.getUsers();

      const sellers = users.filter((u) => u.role === 'SELLER' || u.role === 'ADMIN').map((u) => {
        const sellerLeads = leads.filter((l) => l.assignedUserId === u.id);
        const wonLeads = sellerLeads.filter((l) => l.currentStageId === 's4' || l.currentStageId === 's8'); // won
        const completedTasks = tasks.filter((t) => t.assignedUserId === u.id && t.status === 'COMPLETED');
        const conversionRate = sellerLeads.length > 0 ? Math.round((wonLeads.length / sellerLeads.length) * 100) : 0;

        return {
          seller: { id: u.id, name: u.name, role: u.role },
          totalLeads: sellerLeads.length,
          wonLeads: wonLeads.length,
          conversionRate,
          completedTasks: completedTasks.length,
        };
      });

      return { data: sellers };
    }

    if (url.startsWith('/api/analytics/trends')) {
      const leads = await dbService.getLeads();
      const trends: Record<string, number> = {};

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        trends[dateStr] = 0;
      }

      leads.forEach((l) => {
        const dateStr = l.createdAt.split('T')[0];
        if (trends[dateStr] !== undefined) {
          trends[dateStr]++;
        }
      });

      const trendsArray = Object.entries(trends).map(([date, count]) => ({ date, count }));
      return { data: trendsArray };
    }

    throw new Error('Not Found mock GET ' + url);
  },

  post: async (url: string, data?: any, config?: any) => {
    await new Promise((r) => setTimeout(r, 150));

    if (url.startsWith('/api/tags')) {
      const tag = await dbService.createTag(data);
      return { data: tag };
    }

    if (url.startsWith('/api/whatsapp/instances')) {
      const instance = await dbService.createWhatsappInstance(data);
      return { data: instance };
    }

    throw new Error('Not Found mock POST ' + url);
  },

  patch: async (url: string, data?: any, config?: any) => {
    await new Promise((r) => setTimeout(r, 150));

    const userMatch = matchPath('/api/users/:id', url);
    if (userMatch) {
      const updated = await dbService.updateUser(userMatch.id, data);
      return { data: updated };
    }

    const disconnectMatch = matchPath('/api/whatsapp/instances/:id/disconnect', url);
    if (disconnectMatch) {
      await dbService.disconnectWhatsappInstance(disconnectMatch.id);
      return { data: { success: true } };
    }

    const taskCompleteMatch = matchPath('/api/tasks/:id/complete', url);
    if (taskCompleteMatch) {
      await dbService.completeTask(taskCompleteMatch.id);
      return { data: { success: true } };
    }

    throw new Error('Not Found mock PATCH ' + url);
  },

  delete: async (url: string, config?: any) => {
    await new Promise((r) => setTimeout(r, 150));

    const tagMatch = matchPath('/api/tags/:id', url);
    if (tagMatch) {
      await dbService.deleteTag(tagMatch.id);
      return { data: { success: true } };
    }

    const whatsappMatch = matchPath('/api/whatsapp/instances/:id', url);
    if (whatsappMatch) {
      await dbService.deleteWhatsappInstance(whatsappMatch.id);
      return { data: { success: true } };
    }

    throw new Error('Not Found mock DELETE ' + url);
  },
};
export type api = typeof api;
