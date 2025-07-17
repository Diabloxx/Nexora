import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Channel from '../models/Channel';
import Server from '../models/Server';
import Message from '../models/Message';
import authMiddleware, { AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get messages for a channel
router.get('/:channelId/messages', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { channelId } = req.params;
    const { limit = 50, before } = req.query;
    const userId = req.user!._id;

    // Verify user has access to this channel
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    let hasAccess = false;
    if (channel.type === 'dm' || channel.type === 'group_dm') {
      hasAccess = channel.participants?.includes(userId as any) || false;
    } else if (channel.server) {
      const server = await Server.findOne({
        _id: channel.server,
        'members.user': userId
      });
      hasAccess = !!server;
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'No access to this channel' });
    }

    // Build query
    const query: any = { channel: channelId };
    if (before) {
      query._id = { $lt: before };
    }

    const messages = await Message.find(query)
      .populate('author', 'username displayName avatar')
      .populate('mentions.users', 'username displayName')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    const hasMore = messages.length === Number(limit);

    res.json({
      success: true,
      messages: messages.reverse(),
      hasMore
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new channel
router.post('/', authMiddleware, [
  body('name').isLength({ min: 1, max: 100 }).trim(),
  body('type').isIn(['text', 'voice', 'category']),
  body('serverId').isMongoId()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, type, serverId, parentId, topic, nsfw } = req.body;
    const userId = req.user!._id;

    // Check if user has permission to create channels in this server
    const server = await Server.findOne({
      _id: serverId,
      $or: [
        { owner: userId },
        { 'members.user': userId }
      ]
    });

    if (!server) {
      return res.status(404).json({ error: 'Server not found or no access' });
    }

    // Get the next position
    const maxPosition = await Channel.findOne({ server: serverId })
      .sort({ position: -1 })
      .select('position');
    
    const position = maxPosition ? maxPosition.position + 1 : 0;

    const channel = new Channel({
      name,
      type,
      server: serverId,
      position,
      parentId,
      topic,
      nsfw: nsfw || false
    });

    await channel.save();

    // Add channel to server
    server.channels.push(channel._id as any);
    await server.save();

    res.status(201).json({
      success: true,
      channel
    });
  } catch (error) {
    console.error('Create channel error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get channel by ID
router.get('/:channelId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { channelId } = req.params;
    const userId = req.user!._id;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Verify access
    let hasAccess = false;
    if (channel.type === 'dm' || channel.type === 'group_dm') {
      hasAccess = channel.participants?.includes(userId as any) || false;
    } else if (channel.server) {
      const server = await Server.findOne({
        _id: channel.server,
        'members.user': userId
      });
      hasAccess = !!server;
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'No access to this channel' });
    }

    res.json({
      success: true,
      channel
    });
  } catch (error) {
    console.error('Get channel error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update channel
router.patch('/:channelId', authMiddleware, [
  body('name').optional().isLength({ min: 1, max: 100 }).trim(),
  body('topic').optional().isLength({ max: 1024 }),
  body('nsfw').optional().isBoolean(),
  body('slowMode').optional().isInt({ min: 0, max: 21600 })
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { channelId } = req.params;
    const userId = req.user!._id;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Check permissions (must be server owner or have manage channels permission)
    if (channel.server) {
      const server = await Server.findOne({
        _id: channel.server,
        owner: userId
      });

      if (!server) {
        return res.status(403).json({ error: 'No permission to edit this channel' });
      }
    }

    const allowedUpdates = ['name', 'topic', 'nsfw', 'slowMode', 'position'];
    const updates = Object.keys(req.body).filter(key => allowedUpdates.includes(key));
    
    updates.forEach(update => {
      (channel as any)[update] = req.body[update];
    });

    await channel.save();

    res.json({
      success: true,
      channel
    });
  } catch (error) {
    console.error('Update channel error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete channel
router.delete('/:channelId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { channelId } = req.params;
    const userId = req.user!._id;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Check permissions (must be server owner)
    if (channel.server) {
      const server = await Server.findOne({
        _id: channel.server,
        owner: userId
      });

      if (!server) {
        return res.status(403).json({ error: 'No permission to delete this channel' });
      }

      // Remove channel from server
      server.channels = server.channels.filter(id => id.toString() !== channelId);
      await server.save();
    }

    // Delete all messages in the channel
    await Message.deleteMany({ channel: channelId });

    // Delete the channel
    await Channel.findByIdAndDelete(channelId);

    res.json({
      success: true,
      message: 'Channel deleted successfully'
    });
  } catch (error) {
    console.error('Delete channel error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
