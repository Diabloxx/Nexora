import { Server as SocketServer, Socket } from 'socket.io';
import Message from '../models/Message';
import Channel from '../models/Channel';
import ServerModel from '../models/Server';
import { IUser } from '../models/User';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: IUser;
}

const socketMessage = (io: SocketServer) => {
  io.on('connection', (socket: AuthenticatedSocket) => {
    
    // Join channel
    socket.on('join_channel', async (data: { channelId: string }) => {
      try {
        const { channelId } = data;
        const channel = await Channel.findById(channelId);
        if (!channel) return;

        // Check if user has access to this channel
        if (channel.type === 'dm' || channel.type === 'group_dm') {
          if (!channel.participants?.includes(socket.userId as any)) return;
        } else if (channel.server) {
          const server = await ServerModel.findOne({
            _id: channel.server,
            'members.user': socket.userId
          });
          if (!server) return;
        }

        socket.join(`channel:${channelId}`);
        console.log(`User ${socket.user?.username} joined channel ${channelId}`);
      } catch (error) {
        console.error('Channel join error:', error);
      }
    });

    // Leave channel
    socket.on('leave_channel', (data: { channelId: string }) => {
      const { channelId } = data;
      socket.leave(`channel:${channelId}`);
      console.log(`User ${socket.user?.username} left channel ${channelId}`);
    });

    // Send message
    socket.on('message:send', async (data: {
      channelId: string;
      content: string;
      type?: string;
      reference?: any;
    }) => {
      try {
        const { channelId, content, type = 'default', reference } = data;
        
        if (!content.trim()) return;

        const channel = await Channel.findById(channelId);
        if (!channel) return;

        // Verify user has access to channel
        let hasAccess = false;
        if (channel.type === 'dm' || channel.type === 'group_dm') {
          hasAccess = channel.participants?.includes(socket.userId as any) || false;
        } else if (channel.server) {
          const server = await ServerModel.findOne({
            _id: channel.server,
            'members.user': socket.userId
          });
          hasAccess = !!server;
        }

        if (!hasAccess) return;

        // Create message
        const message = new Message({
          content,
          author: socket.userId,
          channel: channelId,
          server: channel.server,
          type,
          reference
        });

        await message.save();
        await message.populate('author', 'username displayName avatar');

        // Update channel's last message
        channel.lastMessageId = message._id as any;
        await channel.save();

        // Emit message to all users in the channel
        io.to(`channel:${channelId}`).emit('new_message', {
          id: message._id,
          content: message.content,
          author: message.author,
          channel: message.channel,
          server: message.server,
          type: message.type,
          reference: message.reference,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt
        });

      } catch (error) {
        console.error('Message send error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Edit message
    socket.on('message:edit', async (data: {
      messageId: string;
      content: string;
    }) => {
      try {
        const { messageId, content } = data;
        
        if (!content.trim()) return;

        const message = await Message.findOne({
          _id: messageId,
          author: socket.userId
        }).populate('author', 'username displayName avatar');

        if (!message) return;

        message.content = content;
        message.editedAt = new Date();
        await message.save();

        // Emit edited message to all users in the channel
        io.to(`channel:${message.channel}`).emit('message:edited', {
          id: message._id,
          content: message.content,
          editedAt: message.editedAt,
          author: message.author
        });

      } catch (error) {
        console.error('Message edit error:', error);
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    // Delete message
    socket.on('message:delete', async (messageId: string) => {
      try {
        const message = await Message.findOne({
          _id: messageId,
          author: socket.userId
        });

        if (!message) return;

        await Message.findByIdAndDelete(messageId);

        // Emit deleted message to all users in the channel
        io.to(`channel:${message.channel}`).emit('message_deleted', {
          messageId,
          channelId: message.channel
        });

      } catch (error) {
        console.error('Message delete error:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // Typing indicator
    socket.on('start_typing', (data: { channelId: string }) => {
      socket.to(`channel:${data.channelId}`).emit('user_typing', {
        userId: socket.userId,
        username: socket.user?.username,
        channelId: data.channelId
      });
    });

    socket.on('stop_typing', (data: { channelId: string }) => {
      socket.to(`channel:${data.channelId}`).emit('user_stop_typing', {
        userId: socket.userId,
        channelId: data.channelId
      });
    });

    // Message reactions
    socket.on('message:react', async (data: {
      messageId: string;
      emoji: string;
    }) => {
      try {
        const { messageId, emoji } = data;
        
        const message = await Message.findById(messageId);
        if (!message) return;

        const existingReaction = message.reactions.find(r => r.emoji === emoji);
        
        if (existingReaction) {
          const userIndex = existingReaction.users.indexOf(socket.userId as any);
          if (userIndex > -1) {
            // Remove reaction
            existingReaction.users.splice(userIndex, 1);
            existingReaction.count--;
            if (existingReaction.count === 0) {
              message.reactions = message.reactions.filter(r => r.emoji !== emoji);
            }
          } else {
            // Add reaction
            existingReaction.users.push(socket.userId as any);
            existingReaction.count++;
          }
        } else {
          // Create new reaction
          message.reactions.push({
            emoji,
            count: 1,
            users: [socket.userId as any]
          });
        }

        await message.save();

        // Emit reaction update to all users in the channel
        io.to(`channel:${message.channel}`).emit('message:reaction', {
          messageId,
          reactions: message.reactions
        });

      } catch (error) {
        console.error('Message reaction error:', error);
        socket.emit('error', { message: 'Failed to add reaction' });
      }
    });
  });
};

export default socketMessage;
