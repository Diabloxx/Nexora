import express, { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import Message from '../models/Message';
import Channel from '../models/Channel';
import Server from '../models/Server';
import authMiddleware, { AuthRequest } from '../middleware/auth';
import { IUser } from '../models/User';
import socketManager from '../utils/socketManager';

const router = express.Router();

/**
 * Create a new message in a channel
 * POST /api/messages/:channelId
 */
router.post('/:channelId', authMiddleware, [
  param('channelId').isMongoId().withMessage('Invalid channel ID'),
  body('content').optional().trim()
    .isLength({ max: 2000 }).withMessage('Message content must be less than 2000 characters'),
  body('type').optional().isIn(['default', 'system', 'reply', 'thread_starter_message']).withMessage('Invalid message type'),
  body('replyTo').optional().isMongoId().withMessage('Invalid reply message ID'),
  body('attachments').optional().isArray().withMessage('Attachments must be an array')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { channelId } = req.params;
    const { content, type = 'default', replyTo, attachments = [] } = req.body;
    const authReq = req as AuthRequest;
    const user = authReq.user as IUser;

    // Validate that either content or attachments are provided
    if (!content?.trim() && (!attachments || attachments.length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Message must have content or attachments'
      });
    }

    // Check if channel exists
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Channel not found'
      });
    }

    // Check if user has access to the channel
    const server = await Server.findById(channel.server);
    if (!server) {
      return res.status(404).json({
        success: false,
        error: 'Server not found'
      });
    }

    const isMember = server.members.some(member => 
      member.user.toString() === (user._id as any).toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: 'You are not a member of this server'
      });
    }

    // Create message
    const messageData: any = {
      content: content || '',
      type,
      author: user._id,
      channel: channelId
    };

    // Add reply reference if provided
    if (replyTo) {
      const replyMessage = await Message.findById(replyTo);
      if (replyMessage && replyMessage.channel.toString() === channelId) {
        messageData.reference = {
          messageId: replyTo,
          channelId: channelId,
          serverId: server._id
        };
      }
    }

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      messageData.attachments = attachments;
    }

    const message = new Message(messageData);

    await message.save();

    // Populate author details for response
    await message.populate('author', 'username displayName avatar');

    // If this is a reply, also populate the referenced message
    if (message.reference) {
      await message.populate('reference.messageId', 'content author');
      await message.populate('reference.messageId.author', 'username displayName avatar');
    }

    // Emit the new message to all users in the channel
    console.log(`Emitting new_message to channel:${channelId}`, message.toJSON());
    socketManager.emitToChannel(channelId, 'new_message', message.toJSON());

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get messages for a channel
 * GET /api/messages/:channelId
 */
router.get('/:channelId', authMiddleware, [
  param('channelId').isMongoId().withMessage('Invalid channel ID')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { channelId } = req.params;
    const { limit = 50, before } = req.query;
    const authReq = req as AuthRequest;
    const user = authReq.user as IUser;

    // Check if channel exists
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Channel not found'
      });
    }

    // Check if user has access to the channel
    const server = await Server.findById(channel.server);
    if (!server) {
      return res.status(404).json({
        success: false,
        error: 'Server not found'
      });
    }

    const isMember = server.members.some(member => 
      member.user.toString() === (user._id as any).toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: 'You are not a member of this server'
      });
    }

    // Build query
    const query: any = { channel: channelId };
    if (before) {
      query.createdAt = { $lt: new Date(before as string) };
    }

    // Get messages
    const messages = await Message.find(query)
      .populate('author', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      data: messages.reverse() // Return in chronological order
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Update a message
 * PUT /api/messages/:messageId
 */
router.put('/:messageId', authMiddleware, [
  param('messageId').isMongoId().withMessage('Invalid message ID'),
  body('content').trim().notEmpty().withMessage('Message content is required')
    .isLength({ max: 2000 }).withMessage('Message content must be less than 2000 characters')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { messageId } = req.params;
    const { content } = req.body;
    const authReq = req as AuthRequest;
    const user = authReq.user as IUser;

    // Find message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    // Check if user is the author
    if (message.author.toString() !== (user._id as any).toString()) {
      return res.status(403).json({
        success: false,
        error: 'You can only edit your own messages'
      });
    }

    // Update message
    message.content = content;
    message.editedAt = new Date();
    await message.save();

    await message.populate('author', 'username displayName avatar');

    // Emit message update event
    socketManager.getIO().to(message.channel.toString()).emit('message:update', message);

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Delete a message
 * DELETE /api/messages/:messageId
 */
router.delete('/:messageId', authMiddleware, [
  param('messageId').isMongoId().withMessage('Invalid message ID')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { messageId } = req.params;
    const authReq = req as AuthRequest;
    const user = authReq.user as IUser;

    // Find message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    // Check if user is the author or has permission to delete
    const channel = await Channel.findById(message.channel);
    const server = await Server.findById(channel?.server);
    
    const isAuthor = message.author.toString() === (user._id as any).toString();
    const isServerOwner = server?.owner.toString() === (user._id as any).toString();
    
    if (!isAuthor && !isServerOwner) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own messages or you must be the server owner'
      });
    }

    // Delete message
    await Message.findByIdAndDelete(messageId);

    // Emit message deletion event
    socketManager.getIO().to(message.channel.toString()).emit('message:delete', messageId);

    res.json({
      success: true,
      data: { message: 'Message deleted successfully' }
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Add or remove a reaction to/from a message
 * POST /api/messages/:messageId/reactions
 */
router.post('/:messageId/reactions', authMiddleware, [
  param('messageId').isMongoId().withMessage('Invalid message ID'),
  body('emoji').notEmpty().withMessage('Emoji is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { messageId } = req.params;
    const { emoji } = req.body;
    const authReq = req as AuthRequest;
    const user = authReq.user as IUser;

    // Find the message
    const message = await Message.findById(messageId).populate('channel');
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    // Check if user has access to the channel
    const channel = await Channel.findById(message.channel);
    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Channel not found'
      });
    }

    const server = await Server.findById(channel.server);
    if (!server) {
      return res.status(404).json({
        success: false,
        error: 'Server not found'
      });
    }

    const isMember = server.members.some(member => 
      member.user.toString() === (user._id as any).toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: 'You are not a member of this server'
      });
    }

    // Find existing reaction
    const existingReactionIndex = message.reactions.findIndex(
      reaction => reaction.emoji === emoji
    );

    if (existingReactionIndex > -1) {
      // Reaction exists, check if user already reacted
      const userReactionIndex = message.reactions[existingReactionIndex].users.findIndex(
        userId => userId.toString() === (user._id as any).toString()
      );

      if (userReactionIndex > -1) {
        // User already reacted, remove their reaction
        message.reactions[existingReactionIndex].users.splice(userReactionIndex, 1);
        message.reactions[existingReactionIndex].count -= 1;

        // Remove reaction if no users left
        if (message.reactions[existingReactionIndex].count === 0) {
          message.reactions.splice(existingReactionIndex, 1);
        }
      } else {
        // User hasn't reacted, add their reaction
        message.reactions[existingReactionIndex].users.push(user._id as any);
        message.reactions[existingReactionIndex].count += 1;
      }
    } else {
      // New reaction
      message.reactions.push({
        emoji,
        count: 1,
        users: [user._id as any]
      });
    }

    await message.save();

    // Emit reaction update to channel
    const io = socketManager.getIO();
    if (io) {
      io.to(`channel_${channel._id}`).emit('message_reaction', {
        messageId: message._id,
        reactions: message.reactions
      });
    }

    res.json({
      success: true,
      data: message.reactions
    });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add reaction'
    });
  }
});

/**
 * Get message history with pagination
 * GET /api/messages/:channelId/history
 */
router.get('/:channelId/history', authMiddleware, [
  param('channelId').isMongoId().withMessage('Invalid channel ID')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { channelId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const before = req.query.before as string; // Message ID to get messages before
    const after = req.query.after as string; // Message ID to get messages after
    const search = req.query.search as string;
    
    const authReq = req as AuthRequest;
    const user = authReq.user as IUser;

    // Check if channel exists and user has access
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({
        success: false,
        error: 'Channel not found'
      });
    }

    const server = await Server.findById(channel.server);
    if (!server) {
      return res.status(404).json({
        success: false,
        error: 'Server not found'
      });
    }

    const isMember = server.members.some(member => 
      member.user.toString() === (user._id as any).toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: 'You are not a member of this server'
      });
    }

    // Build query
    const query: any = { channel: channelId };

    // Add search filter
    if (search) {
      query.content = { $regex: search, $options: 'i' };
    }

    // Add pagination filters
    if (before) {
      const beforeMessage = await Message.findById(before);
      if (beforeMessage) {
        query.createdAt = { $lt: beforeMessage.createdAt };
      }
    }

    if (after) {
      const afterMessage = await Message.findById(after);
      if (afterMessage) {
        query.createdAt = { $gt: afterMessage.createdAt };
      }
    }

    // Fetch messages
    const messages = await Message.find(query)
      .populate('author', 'username displayName avatar')
      .populate('reference.messageId', 'content author')
      .sort({ createdAt: after ? 1 : -1 }) // Ascending if getting newer messages, descending for older
      .limit(Math.min(limit, 100)) // Max 100 messages per request
      .lean();

    // If we got messages in ascending order (after), reverse them
    if (after) {
      messages.reverse();
    }

    res.json({
      success: true,
      data: {
        messages,
        hasMore: messages.length === limit,
        oldest: messages.length > 0 ? messages[messages.length - 1]._id : null,
        newest: messages.length > 0 ? messages[0]._id : null
      }
    });
  } catch (error) {
    console.error('Error fetching message history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch message history'
    });
  }
});

export default router;
