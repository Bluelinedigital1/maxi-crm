import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

interface AuthSocket extends Socket {
  userId: string;
}

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL ?? 'http://localhost:3000', credentials: true },
  namespace: '/events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private userSockets = new Map<string, Set<string>>();

  constructor(private jwt: JwtService) {}

  async handleConnection(client: AuthSocket) {
    try {
      const token =
        client.handshake.auth?.token ??
        client.handshake.headers.authorization?.split(' ')[1];

      if (!token) throw new UnauthorizedException();

      const payload = this.jwt.verify<{ sub: string }>(token, {
        secret: process.env.JWT_SECRET,
      });

      client.userId = payload.sub;
      client.join(`user:${payload.sub}`);

      if (!this.userSockets.has(payload.sub)) {
        this.userSockets.set(payload.sub, new Set());
      }
      this.userSockets.get(payload.sub)!.add(client.id);

      this.logger.log(`Cliente conectado: ${client.id} (user ${payload.sub})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthSocket) {
    if (client.userId) {
      this.userSockets.get(client.userId)?.delete(client.id);
      this.logger.log(`Cliente desconectado: ${client.id}`);
    }
  }

  @SubscribeMessage('join:lead')
  handleJoinLead(@ConnectedSocket() client: Socket, @MessageBody() leadId: string) {
    client.join(`lead:${leadId}`);
  }

  @SubscribeMessage('leave:lead')
  handleLeaveLead(@ConnectedSocket() client: Socket, @MessageBody() leadId: string) {
    client.leave(`lead:${leadId}`);
  }

  emitNewMessage(assignedUserId: string, payload: unknown) {
    this.server.to(`user:${assignedUserId}`).emit('message:new', payload);
  }

  emitLeadMoved(payload: { leadId: string; fromStageId: string; toStageId: string }) {
    this.server.emit('lead:moved', payload);
  }

  emitLeadCreated(payload: unknown) {
    this.server.emit('lead:created', payload);
  }

  emitTaskAlert(assignedUserId: string, payload: unknown) {
    this.server.to(`user:${assignedUserId}`).emit('task:alert', payload);
  }
}
