export type MessageDirection = 'INBOUND' | 'OUTBOUND';

export interface Message {
  id: string;
  leadId: string;
  whatsappInstanceId: string;
  whatsappInstance?: { id: string; name: string; phoneNumber: string };
  direction: MessageDirection;
  body: string;
  mediaUrl?: string;
  mediaType?: string;
  isRead: boolean;
  timestamp: string;
}

export interface Conversation {
  leadId: string;
  leadName: string;
  phone: string;
  assignedUser: { id: string; name: string };
  lastMessage: {
    body: string;
    direction: MessageDirection;
    timestamp: string;
    isRead: boolean;
  };
  unreadCount: number;
}
