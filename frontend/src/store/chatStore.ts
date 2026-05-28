import { create } from 'zustand';
import type { Conversation, Message } from '@/types/message';

interface ChatState {
  conversations: Conversation[];
  activeLeadId: string | null;
  messages: Message[];
  unreadTotal: number;
  setConversations: (convs: Conversation[]) => void;
  setActiveLeadId: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  appendMessage: (message: Message) => void;
  setUnreadTotal: (n: number) => void;
  markConversationRead: (leadId: string) => void;
  prependNewConversation: (conv: Conversation) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeLeadId: null,
  messages: [],
  unreadTotal: 0,

  setConversations: (conversations) => set({ conversations }),
  setActiveLeadId: (id) => set({ activeLeadId: id }),
  setMessages: (messages) => set({ messages }),
  setUnreadTotal: (n) => set({ unreadTotal: n }),

  appendMessage: (message) => {
    set((state) => ({ messages: [...state.messages, message] }));

    const { conversations } = get();
    set({
      conversations: conversations.map((c) =>
        c.leadId === message.leadId
          ? {
              ...c,
              lastMessage: {
                body: message.body,
                direction: message.direction,
                timestamp: message.timestamp,
                isRead: message.isRead,
              },
              unreadCount: message.direction === 'INBOUND' && !message.isRead
                ? c.unreadCount + 1
                : c.unreadCount,
            }
          : c,
      ),
    });
  },

  markConversationRead: (leadId) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.leadId === leadId ? { ...c, unreadCount: 0 } : c,
      ),
    }));
  },

  prependNewConversation: (conv) => {
    set((state) => ({
      conversations: [conv, ...state.conversations.filter((c) => c.leadId !== conv.leadId)],
    }));
  },
}));
