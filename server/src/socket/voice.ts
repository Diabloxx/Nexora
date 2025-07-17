import { Server as SocketServer, Socket } from 'socket.io';
import { IUser } from '../models/User';
import Channel from '../models/Channel';
import ServerModel from '../models/Server';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: IUser;
  currentVoiceChannel?: string;
}

const socketVoice = (io: SocketServer) => {
  io.on('connection', (socket: AuthenticatedSocket) => {
    
    // Join voice channel
    socket.on('voice:join', async (data: {
      channelId: string;
      muted?: boolean;
      deafened?: boolean;
    }) => {
      try {
        const { channelId, muted = false, deafened = false } = data;
        
        const channel = await Channel.findById(channelId);
        if (!channel || channel.type !== 'voice') {
          return socket.emit('voice:error', { message: 'Invalid voice channel' });
        }

        // Check if user has access to the channel
        if (channel.server) {
          const server = await ServerModel.findOne({
            _id: channel.server,
            'members.user': socket.userId
          });
          if (!server) {
            return socket.emit('voice:error', { message: 'No access to this channel' });
          }
        }

        // Check user limit
        if (channel.userLimit && channel.userLimit > 0) {
          const usersInChannel = await io.in(`voice:${channelId}`).fetchSockets();
          if (usersInChannel.length >= channel.userLimit) {
            return socket.emit('voice:error', { message: 'Channel is full' });
          }
        }

        // Leave current voice channel if any
        if (socket.currentVoiceChannel) {
          socket.leave(`voice:${socket.currentVoiceChannel}`);
          socket.to(`voice:${socket.currentVoiceChannel}`).emit('voice:user_left', {
            userId: socket.userId,
            username: socket.user?.username,
            channelId: socket.currentVoiceChannel
          });
        }

        // Join new voice channel
        socket.join(`voice:${channelId}`);
        socket.currentVoiceChannel = channelId;

        // Notify others in the channel
        socket.to(`voice:${channelId}`).emit('voice:user_joined', {
          userId: socket.userId,
          username: socket.user?.username,
          displayName: socket.user?.displayName,
          avatar: socket.user?.avatar,
          channelId,
          muted,
          deafened
        });

        // Send current users in channel to the new user
        const usersInChannel = await io.in(`voice:${channelId}`).fetchSockets();
        const channelUsers = usersInChannel
          .filter(s => s.id !== socket.id)
          .map(s => {
            const authSocket = s as any;
            return {
              userId: authSocket.userId,
              username: authSocket.user?.username,
              displayName: authSocket.user?.displayName,
              avatar: authSocket.user?.avatar,
              muted: authSocket.muted || false,
              deafened: authSocket.deafened || false
            };
          });

        socket.emit('voice:joined', {
          channelId,
          users: channelUsers
        });

        // Broadcast to server that user joined voice channel
        if (channel.server) {
          socket.to(`server:${channel.server}`).emit('voice:user_status', {
            userId: socket.userId,
            username: socket.user?.username,
            channelId,
            status: 'joined'
          });
        }

      } catch (error) {
        console.error('Voice join error:', error);
        socket.emit('voice:error', { message: 'Failed to join voice channel' });
      }
    });

    // Leave voice channel
    socket.on('voice:leave', () => {
      try {
        if (!socket.currentVoiceChannel) return;

        const channelId = socket.currentVoiceChannel;
        
        // Leave the voice channel room
        socket.leave(`voice:${channelId}`);
        
        // Notify others in the channel
        socket.to(`voice:${channelId}`).emit('voice:user_left', {
          userId: socket.userId,
          username: socket.user?.username,
          channelId
        });

        // Broadcast to server that user left voice channel
        socket.broadcast.emit('voice:user_status', {
          userId: socket.userId,
          username: socket.user?.username,
          channelId,
          status: 'left'
        });

        socket.currentVoiceChannel = undefined;
        socket.emit('voice:left', { channelId });

      } catch (error) {
        console.error('Voice leave error:', error);
      }
    });

    // Mute/unmute
    socket.on('voice:mute', (muted: boolean) => {
      try {
        if (!socket.currentVoiceChannel) return;

        (socket as any).muted = muted;

        socket.to(`voice:${socket.currentVoiceChannel}`).emit('voice:user_muted', {
          userId: socket.userId,
          username: socket.user?.username,
          muted
        });

      } catch (error) {
        console.error('Voice mute error:', error);
      }
    });

    // Deafen/undeafen
    socket.on('voice:deafen', (deafened: boolean) => {
      try {
        if (!socket.currentVoiceChannel) return;

        (socket as any).deafened = deafened;

        socket.to(`voice:${socket.currentVoiceChannel}`).emit('voice:user_deafened', {
          userId: socket.userId,
          username: socket.user?.username,
          deafened
        });

      } catch (error) {
        console.error('Voice deafen error:', error);
      }
    });

    // WebRTC signaling
    socket.on('voice:offer', (data: {
      targetUserId: string;
      offer: any; // RTCSessionDescriptionInit
    }) => {
      try {
        socket.to(`user:${data.targetUserId}`).emit('voice:offer', {
          fromUserId: socket.userId,
          fromUsername: socket.user?.username,
          offer: data.offer
        });
      } catch (error) {
        console.error('Voice offer error:', error);
      }
    });

    socket.on('voice:answer', (data: {
      targetUserId: string;
      answer: any; // RTCSessionDescriptionInit
    }) => {
      try {
        socket.to(`user:${data.targetUserId}`).emit('voice:answer', {
          fromUserId: socket.userId,
          fromUsername: socket.user?.username,
          answer: data.answer
        });
      } catch (error) {
        console.error('Voice answer error:', error);
      }
    });

    socket.on('voice:ice-candidate', (data: {
      targetUserId: string;
      candidate: any; // RTCIceCandidateInit
    }) => {
      try {
        socket.to(`user:${data.targetUserId}`).emit('voice:ice-candidate', {
          fromUserId: socket.userId,
          fromUsername: socket.user?.username,
          candidate: data.candidate
        });
      } catch (error) {
        console.error('Voice ICE candidate error:', error);
      }
    });

    // Screen sharing
    socket.on('screen:start', () => {
      try {
        if (!socket.currentVoiceChannel) return;

        socket.to(`voice:${socket.currentVoiceChannel}`).emit('screen:started', {
          userId: socket.userId,
          username: socket.user?.username
        });

      } catch (error) {
        console.error('Screen share start error:', error);
      }
    });

    socket.on('screen:stop', () => {
      try {
        if (!socket.currentVoiceChannel) return;

        socket.to(`voice:${socket.currentVoiceChannel}`).emit('screen:stopped', {
          userId: socket.userId,
          username: socket.user?.username
        });

      } catch (error) {
        console.error('Screen share stop error:', error);
      }
    });

    // Handle disconnection - leave voice channel
    socket.on('disconnect', () => {
      try {
        if (socket.currentVoiceChannel) {
          socket.to(`voice:${socket.currentVoiceChannel}`).emit('voice:user_left', {
            userId: socket.userId,
            username: socket.user?.username,
            channelId: socket.currentVoiceChannel
          });

          // Broadcast to server that user left voice channel
          socket.broadcast.emit('voice:user_status', {
            userId: socket.userId,
            username: socket.user?.username,
            channelId: socket.currentVoiceChannel,
            status: 'disconnected'
          });
        }
      } catch (error) {
        console.error('Voice disconnect error:', error);
      }
    });
  });
};

export default socketVoice;
