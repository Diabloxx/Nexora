import { Server as SocketServer, Socket } from 'socket.io';
import { IUser } from '../models/User';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: IUser;
}

const socketPresence = (io: SocketServer) => {
  io.on('connection', (socket: AuthenticatedSocket) => {
    
    // Handle presence updates
    socket.on('presence:update', async (data: {
      status: 'online' | 'away' | 'busy' | 'offline';
      customStatus?: string;
    }) => {
      try {
        if (!socket.user) return;

        const { status, customStatus } = data;
        
        // Update user status
        socket.user.status = status;
        await socket.user.save();

        // Broadcast presence update to all servers user is in
        socket.user.servers.forEach(serverId => {
          socket.to(`server:${serverId}`).emit('presence:update', {
            userId: socket.userId,
            username: socket.user?.username,
            status,
            customStatus,
            timestamp: new Date()
          });
        });

        // Also broadcast to friends
        socket.user.friends.forEach(friendId => {
          socket.to(`user:${friendId}`).emit('presence:update', {
            userId: socket.userId,
            username: socket.user?.username,
            status,
            customStatus,
            timestamp: new Date()
          });
        });

      } catch (error) {
        console.error('Presence update error:', error);
      }
    });

    // Handle activity updates (like "Playing a game", "Listening to Spotify", etc.)
    socket.on('activity:update', (data: {
      type: 'playing' | 'streaming' | 'listening' | 'watching' | 'custom';
      name: string;
      details?: string;
      state?: string;
      url?: string;
    }) => {
      try {
        if (!socket.user) return;

        // Broadcast activity update to all servers user is in
        socket.user.servers.forEach(serverId => {
          socket.to(`server:${serverId}`).emit('activity:update', {
            userId: socket.userId,
            username: socket.user?.username,
            activity: data,
            timestamp: new Date()
          });
        });

        // Also broadcast to friends
        socket.user.friends.forEach(friendId => {
          socket.to(`user:${friendId}`).emit('activity:update', {
            userId: socket.userId,
            username: socket.user?.username,
            activity: data,
            timestamp: new Date()
          });
        });

      } catch (error) {
        console.error('Activity update error:', error);
      }
    });

    // Clear activity
    socket.on('activity:clear', () => {
      try {
        if (!socket.user) return;

        // Broadcast activity clear to all servers user is in
        socket.user.servers.forEach(serverId => {
          socket.to(`server:${serverId}`).emit('activity:clear', {
            userId: socket.userId,
            username: socket.user?.username,
            timestamp: new Date()
          });
        });

        // Also broadcast to friends
        socket.user.friends.forEach(friendId => {
          socket.to(`user:${friendId}`).emit('activity:clear', {
            userId: socket.userId,
            username: socket.user?.username,
            timestamp: new Date()
          });
        });

      } catch (error) {
        console.error('Activity clear error:', error);
      }
    });

    // Get online users in a server
    socket.on('presence:get_online_users', async (serverId: string) => {
      try {
        // Get all sockets in the server room
        const socketsInRoom = await io.in(`server:${serverId}`).fetchSockets();
        
        const onlineUsers = socketsInRoom.map(s => {
          const authSocket = s as unknown as AuthenticatedSocket;
          return {
            userId: authSocket.userId,
            username: authSocket.user?.username,
            displayName: authSocket.user?.displayName,
            avatar: authSocket.user?.avatar,
            status: authSocket.user?.status,
            isOnline: true
          };
        });

        socket.emit('presence:online_users', {
          serverId,
          users: onlineUsers
        });

      } catch (error) {
        console.error('Get online users error:', error);
      }
    });

    // Request user presence
    socket.on('presence:request', (userIds: string[]) => {
      try {
        userIds.forEach(userId => {
          // Send presence request to the specific user
          socket.to(`user:${userId}`).emit('presence:request', {
            requesterId: socket.userId,
            requesterUsername: socket.user?.username
          });
        });
      } catch (error) {
        console.error('Presence request error:', error);
      }
    });

    // Send presence response
    socket.on('presence:response', (data: {
      requesterId: string;
      status: string;
      customStatus?: string;
      activity?: any;
    }) => {
      try {
        socket.to(`user:${data.requesterId}`).emit('presence:response', {
          userId: socket.userId,
          username: socket.user?.username,
          displayName: socket.user?.displayName,
          avatar: socket.user?.avatar,
          status: data.status,
          customStatus: data.customStatus,
          activity: data.activity,
          lastSeen: socket.user?.lastSeen
        });
      } catch (error) {
        console.error('Presence response error:', error);
      }
    });
  });
};

export default socketPresence;
