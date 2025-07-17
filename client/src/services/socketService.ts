import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { addMessage, updateMessage, removeMessage, addTypingUser, removeTypingUser } from '../store/slices/chatSlice';
import { updateMemberStatus } from '../store/slices/serverSlice';
import { addNotification, setConnectionStatus } from '../store/slices/uiSlice';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    store.dispatch(setConnectionStatus('connecting'));

    this.socket = io(process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
      auth: {
        token: token
      },
      transports: ['websocket'],
      upgrade: true,
    });

    this.setupEventListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    store.dispatch(setConnectionStatus('disconnected'));
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to server');
      store.dispatch(setConnectionStatus('connected'));
      this.reconnectAttempts = 0;
      
      store.dispatch(addNotification({
        title: 'Connected',
        message: 'Successfully connected to Nexora',
        type: 'success',
        autoHide: true,
      }));
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      store.dispatch(setConnectionStatus('disconnected'));
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect automatically
        store.dispatch(addNotification({
          title: 'Disconnected',
          message: 'You have been disconnected from the server',
          type: 'warning',
        }));
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      store.dispatch(setConnectionStatus('disconnected'));
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        store.dispatch(setConnectionStatus('reconnecting'));
        
        setTimeout(() => {
          if (this.socket) {
            this.socket.connect();
          }
        }, Math.pow(2, this.reconnectAttempts) * 1000); // Exponential backoff
      } else {
        store.dispatch(addNotification({
          title: 'Connection Failed',
          message: 'Unable to connect to server. Please check your internet connection.',
          type: 'error',
        }));
      }
    });

    // Authentication events
    this.socket.on('authenticated', (data) => {
      console.log('Socket authenticated:', data);
    });

    this.socket.on('auth_error', (error) => {
      console.error('Authentication error:', error);
      store.dispatch(addNotification({
        title: 'Authentication Error',
        message: 'Failed to authenticate with server',
        type: 'error',
      }));
    });

    // Message events
    this.socket.on('new_message', (message) => {
      store.dispatch(addMessage(message));
    });

    this.socket.on('message_updated', (message) => {
      store.dispatch(updateMessage(message));
    });

    this.socket.on('message_deleted', (data) => {
      store.dispatch(removeMessage({
        messageId: data.messageId,
        channelId: data.channelId
      }));
    });

    // Typing events
    this.socket.on('user_typing', (data) => {
      store.dispatch(addTypingUser({
        channelId: data.channelId,
        userId: data.userId
      }));
    });

    this.socket.on('user_stop_typing', (data) => {
      store.dispatch(removeTypingUser({
        channelId: data.channelId,
        userId: data.userId
      }));
    });

    // Presence events
    this.socket.on('user_status_update', (data) => {
      store.dispatch(updateMemberStatus({
        userId: data.userId,
        status: data.status,
        isOnline: data.isOnline
      }));
    });

    this.socket.on('user_joined_server', (data) => {
      store.dispatch(addNotification({
        title: 'New Member',
        message: `${data.user.displayName} joined the server`,
        type: 'info',
        autoHide: true,
      }));
    });

    this.socket.on('user_left_server', (data) => {
      store.dispatch(addNotification({
        title: 'Member Left',
        message: `${data.user.displayName} left the server`,
        type: 'info',
        autoHide: true,
      }));
    });

    // Voice chat events
    this.socket.on('voice_state_update', (data) => {
      // Handle voice state updates
      console.log('Voice state update:', data);
    });

    // Server events
    this.socket.on('server_updated', (server) => {
      // Handle server updates
      console.log('Server updated:', server);
    });

    this.socket.on('channel_created', (channel) => {
      // Handle new channel creation
      console.log('Channel created:', channel);
    });

    this.socket.on('channel_updated', (channel) => {
      // Handle channel updates
      console.log('Channel updated:', channel);
    });

    this.socket.on('channel_deleted', (data) => {
      // Handle channel deletion
      console.log('Channel deleted:', data);
    });
  }

  // Message methods
  sendMessage(channelId: string, content: string) {
    if (this.socket?.connected) {
      this.socket.emit('send_message', {
        channelId,
        content,
        type: 'text'
      });
    }
  }

  editMessage(messageId: string, content: string) {
    if (this.socket?.connected) {
      this.socket.emit('edit_message', {
        messageId,
        content
      });
    }
  }

  deleteMessage(messageId: string) {
    if (this.socket?.connected) {
      this.socket.emit('delete_message', {
        messageId
      });
    }
  }

  // Typing methods
  startTyping(channelId: string) {
    if (this.socket?.connected) {
      this.socket.emit('start_typing', { channelId });
    }
  }

  stopTyping(channelId: string) {
    if (this.socket?.connected) {
      this.socket.emit('stop_typing', { channelId });
    }
  }

  // Presence methods
  updateStatus(status: 'online' | 'away' | 'busy' | 'offline') {
    if (this.socket?.connected) {
      this.socket.emit('update_status', { status });
    }
  }

  // Voice methods
  joinVoiceChannel(channelId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join_voice', { channelId });
    }
  }

  leaveVoiceChannel() {
    if (this.socket?.connected) {
      this.socket.emit('leave_voice');
    }
  }

  // Channel methods
  joinChannel(channelId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join_channel', { channelId });
    }
  }

  leaveChannel(channelId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave_channel', { channelId });
    }
  }

  // Server methods
  joinServer(serverId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join_server', { serverId });
    }
  }

  leaveServer(serverId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave_server', { serverId });
    }
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // Event listener methods
  on(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event: string, data?: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }
}

export const socketService = new SocketService();
