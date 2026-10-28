// // socketService.ts
import { io, Socket } from 'socket.io-client';
import { getAsyncStorage } from '@/utils/helper.utils';
import { ASYNC_KEYS } from '@/utils/contant.utils';
import { SOCKET_URL } from '../config';

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private eventListeners: Map<string, Set<Function>> = new Map();
  private isConnecting: boolean = false;

  private constructor() {}

  public static getInstance() {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  async connect() {
    if (this.socket) {
      if (this.socket.connected) {
        console.log('✅ Socket already connected');
        return;
      }
      console.log('🔌 Socket exists but not connected. Re-connecting...');
      this.socket.connect();
      return;
    }

    if (this.isConnecting) {
      console.log('⏳ Socket connection in progress...');
      return;
    }

    this.isConnecting = true;

    try {
      const token = await getAsyncStorage(ASYNC_KEYS.ACCESS_TOKEN);

      if (!token) {
        console.log('⚠️ No token found. Socket not connected.');
        this.isConnecting = false;
        return;
      }

      this.socket = io(`${SOCKET_URL}/sessions`, {
        transports: ['polling', 'websocket'],
        auth: { token: `${token}` },
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket Connected:', this.socket?.id);
        this.isConnecting = false;
      });

      this.socket.on('disconnect', reason => {
        console.log('🔌 Socket Disconnected. Reason:', reason);
        this.isConnecting = false;
      });

      this.socket.on('connect_error', err => {
        console.log('❌ Socket Connect Error:', err);
        this.isConnecting = false;
      });

      // Unified event dispatcher
      this.socket.onAny((event, ...args) => {
        if (!['connect', 'disconnect', 'connect_error'].includes(event)) {
          this.triggerEventListeners(event, ...args);
        }
      });
    } catch (error) {
      console.error('Socket connection error:', error);
      this.isConnecting = false;
    }
  }

  // Register event listener
  on(event: string, handler: (...args: any[]) => void) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)?.add(handler);
  }

  // Remove event listener
  off(event: string, handler?: (...args: any[]) => void) {
    if (handler) {
      this.eventListeners.get(event)?.delete(handler);
    } else {
      this.eventListeners.delete(event);
    }
  }

  // Trigger registered listeners
  private triggerEventListeners(event: string, ...args: any[]) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in listener for event ${event}:`, error);
        }
      });
    }
  }

  // Emit to backend
  emit(event: string, data?: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
      console.log(`📤 Emitting event: ${event}`, data);
    } else {
      console.warn(`⚠️ Socket not connected. Cannot emit: ${event}`);
    }
  }

  // Disconnect socket
  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.eventListeners.clear();
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export default SocketService.getInstance();
