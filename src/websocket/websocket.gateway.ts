import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { DecodeToken, JwtType } from '../utils/jwt';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  path: '/socket.io/',
  transports: ['websocket', 'polling'],
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps)
      if (!origin) {
        callback(null, true);
        return;
      }
      
      // Always allow localhost for development
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        callback(null, true);
        return;
      }
      
      // Allow configured frontend URLs
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        process.env.NEXT_PUBLIC_FRONTEND_URL,
        'https://leftover.ccdev.space',
        'https://savetheplate.ccdev.space',
        'https://leftover-be.ccdev.space',
      ].filter(Boolean);
      
      if (allowedOrigins.includes(origin) || origin.includes('.ccdev.space')) {
        callback(null, true);
        return;
      }
      
      // In development/staging, allow all
      if (process.env.NODE_ENV !== 'production') {
        callback(null, true);
        return;
      }
      
      callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST'],
  },
  namespace: '/',
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
})
export class AppWebSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;
  
  private readonly logger = new Logger(AppWebSocketGateway.name);

  constructor(private prisma: PrismaService) {}

  afterInit(server: Server) {
    this.logger.log('🚀 WebSocket server initialized');
    this.logger.log(`📡 Socket.IO path: /socket.io/`);
    this.logger.log(`🔄 Transports: websocket, polling`);
    this.logger.log(`🌐 CORS enabled for .ccdev.space domains`);
    
    // Log server configuration
    server.on('connection', (socket) => {
      this.logger.debug(`New socket connection: ${socket.id}`);
    });
    
    server.engine.on('connection_error', (err) => {
      this.logger.error('Socket.IO connection error:', err);
    });
  }

  async handleConnection(client: Socket) {
    try {
      console.log(`🔌 WebSocket connection attempt from origin: ${client.handshake.headers.origin || 'unknown'}`);
      console.log(`🔌 Transport: ${client.conn.transport.name}, ID: ${client.id}`);
      
      // Extract token from handshake auth or query
      const token =
        client.handshake.auth?.token ||
        client.handshake.query?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      // In development, allow connection without token for testing
      if (!token && process.env.NODE_ENV === 'development') {
        console.log('⚠️ WebSocket connection without token (development mode)');
        client.data.userId = null;
        client.data.userRole = null;
        return;
      }

      if (!token) {
        console.log('❌ WebSocket connection rejected: No token provided');
        // Use a small delay to ensure handshake completes before disconnecting
        setTimeout(() => {
          client.disconnect(true);
        }, 100);
        return;
      }

      // Verify token using the same method as AuthGuard
      try {
        const payload = await DecodeToken(token);

        if (payload.type !== JwtType.NormalToken) {
          console.log('❌ WebSocket connection rejected: Invalid token type');
          setTimeout(() => {
            client.disconnect(true);
          }, 100);
          return;
        }

        // Get user from database
        const user = await this.prisma.user.findFirst({
          where: { email: payload.email },
        });

        if (!user) {
          console.log('❌ WebSocket connection rejected: User not found');
          setTimeout(() => {
            client.disconnect(true);
          }, 100);
          return;
        }

        client.data.userId = parseInt(payload.id);
        client.data.userRole = user.role;
        client.join(`user:${user.id}`);
        console.log(`✅ Client ${user.id} joined room: user:${user.id}`);
        
        // Join role-based rooms
        if (user.role === 'PROVIDER') {
          client.join('providers');
          console.log(`✅ Provider ${user.id} joined 'providers' room`);
        }
        if (user.role === 'CLIENT') {
          client.join('clients');
          console.log(`✅ Client ${user.id} joined 'clients' room`);
        }

        console.log(`✅ Client connected: ${user.id} (${user.role})`);
      } catch (error) {
        console.error('❌ Invalid token:', error);
        setTimeout(() => {
          client.disconnect(true);
        }, 100);
      }
    } catch (error) {
      console.error('❌ Connection error:', error);
      setTimeout(() => {
        client.disconnect(true);
      }, 100);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.data.userId}`);
  }

  // Emit order update to relevant users
  emitOrderUpdate(order: any, eventType: 'created' | 'updated' | 'deleted') {
    // Notify the order owner (client)
    this.server.to(`user:${order.userId}`).emit('order:update', {
      type: eventType,
      order,
    });

    // Notify the offer owner (provider) if order is for their offer
    if (order.offer?.ownerId) {
      this.server.to(`user:${order.offer.ownerId}`).emit('order:update', {
        type: eventType,
        order,
      });
    }

    // Also emit to all providers for their dashboard
    this.server.to('providers').emit('order:update', {
      type: eventType,
      order,
    });
  }

  // Emit offer update to relevant users
  emitOfferUpdate(offer: any, eventType: 'created' | 'updated' | 'deleted') {
    if (!this.server) {
      console.error('❌ WebSocket server not initialized, cannot emit offer update');
      return;
    }

    console.log(`📢 Emitting offer:${eventType} for offer ${offer.id} to clients`);
    
    // Get all clients in the 'clients' room
    const clientsRoom = this.server.sockets.adapter.rooms.get('clients');
    const clientsCount = clientsRoom ? clientsRoom.size : 0;
    console.log(`👥 Clients in 'clients' room: ${clientsCount}`);
    
    // Notify all clients about offer changes
    this.server.to('clients').emit('offer:update', {
      type: eventType,
      offer,
    });
    console.log(`✅ Emitted offer:update to 'clients' room`);

    // Notify the offer owner (provider)
    if (offer.ownerId) {
      this.server.to(`user:${offer.ownerId}`).emit('offer:update', {
        type: eventType,
        offer,
      });
      console.log(`✅ Emitted offer:update to provider user:${offer.ownerId}`);
    }
  }

  // Allow clients to subscribe to specific events
  @SubscribeMessage('subscribe:orders')
  handleSubscribeOrders(@ConnectedSocket() client: Socket) {
    if (client.data.userRole === 'PROVIDER') {
      client.join('provider:orders');
    } else if (client.data.userRole === 'CLIENT') {
      client.join('client:orders');
    }
  }

  @SubscribeMessage('subscribe:offers')
  handleSubscribeOffers(@ConnectedSocket() client: Socket) {
    client.join('offers');
  }
}

