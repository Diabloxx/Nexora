import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: IUser;
}

const socketAuth = (io: Server) => {
  // Authentication middleware for Socket.IO
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = (user._id as any).toString();
      socket.user = user;
      
      // Update user online status
      user.isOnline = true;
      user.lastSeen = new Date();
      await user.save();

      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.user?.username} connected`);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Join user to their server rooms
    if (socket.user?.servers) {
      socket.user.servers.forEach(serverId => {
        socket.join(`server:${serverId}`);
      });
    }

    // Handle user status updates
    socket.on('status:update', async (status: string) => {
      try {
        if (!socket.user) return;

        const validStatuses = ['online', 'away', 'busy', 'offline'];
        if (!validStatuses.includes(status)) return;

        socket.user.status = status as any;
        await socket.user.save();

        // Broadcast status update to all servers user is in
        socket.user.servers.forEach(serverId => {
          socket.to(`server:${serverId}`).emit('user:status', {
            userId: socket.userId,
            status
          });
        });
      } catch (error) {
        console.error('Status update error:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      try {
        if (socket.user) {
          console.log(`User ${socket.user.username} disconnected`);
          
          // Update user offline status
          socket.user.isOnline = false;
          socket.user.lastSeen = new Date();
          await socket.user.save();

          // Broadcast offline status to all servers user is in
          socket.user.servers.forEach(serverId => {
            socket.to(`server:${serverId}`).emit('user:status', {
              userId: socket.userId,
              status: 'offline',
              lastSeen: new Date()
            });
          });
        }
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    });
  });
};

export default socketAuth;
