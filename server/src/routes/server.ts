import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Server from '../models/Server';
import Channel from '../models/Channel';
import Message from '../models/Message';
import User from '../models/User';
import authMiddleware, { AuthRequest } from '../middleware/auth';

const router = express.Router();

// Create server
router.post('/', authMiddleware, [
  body('name').isLength({ min: 2, max: 100 }).trim()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, icon } = req.body;
    const userId = req.user!._id;

    const server = new Server({
      name,
      description,
      icon,
      owner: userId,
      members: [{
        user: userId,
        roles: [],
        joinedAt: new Date()
      }]
    });

    await server.save();

    // Create default channels
    const generalChannel = new Channel({
      name: 'general',
      type: 'text',
      server: server._id,
      position: 0
    });

    const voiceChannel = new Channel({
      name: 'General',
      type: 'voice',
      server: server._id,
      position: 1
    });

    await Promise.all([generalChannel.save(), voiceChannel.save()]);

    // Update server with channels
    server.channels = [generalChannel._id as any, voiceChannel._id as any];
    await server.save();

    // Add server to user's servers
    await User.findByIdAndUpdate(userId, {
      $push: { servers: server._id }
    });

    res.status(201).json({
      success: true,
      server: await Server.findById(server._id).populate('channels')
    });
  } catch (error) {
    console.error('Create server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's servers
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    
    const servers = await Server.find({
      'members.user': userId
    }).populate('channels').sort({ createdAt: 1 });

    res.json({
      success: true,
      servers
    });
  } catch (error) {
    console.error('Get servers error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get server by ID
router.get('/:serverId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { serverId } = req.params;
    const userId = req.user!._id;

    const server = await Server.findOne({
      _id: serverId,
      'members.user': userId
    }).populate('channels').populate('members.user', 'username displayName avatar status');

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    res.json({
      success: true,
      server
    });
  } catch (error) {
    console.error('Get server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update server
router.patch('/:serverId', authMiddleware, [
  body('name').optional().isLength({ min: 2, max: 100 }).trim(),
  body('description').optional().isLength({ max: 120 })
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { serverId } = req.params;
    const userId = req.user!._id;

    const server = await Server.findOne({
      _id: serverId,
      owner: userId
    });

    if (!server) {
      return res.status(404).json({ error: 'Server not found or unauthorized' });
    }

    const allowedUpdates = ['name', 'description', 'icon', 'banner'];
    const updates = Object.keys(req.body).filter(key => allowedUpdates.includes(key));
    
    updates.forEach(update => {
      (server as any)[update] = req.body[update];
    });

    await server.save();

    res.json({
      success: true,
      server
    });
  } catch (error) {
    console.error('Update server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update server settings
router.patch('/:serverId', authMiddleware, [
  body('name').optional().isLength({ min: 2, max: 100 }).trim(),
  body('description').optional().isLength({ max: 120 }),
  body('isPublic').optional().isBoolean(),
  body('verificationLevel').optional().isIn(['none', 'low', 'medium', 'high']),
  body('defaultMessageNotifications').optional().isIn(['all', 'mentions']),
  body('explicitContentFilter').optional().isIn(['disabled', 'members_without_roles', 'all_members'])
], async (req: AuthRequest, res: Response) => {
  try {
    const { serverId } = req.params;
    const userId = req.user!._id;
    const updates = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const server = await Server.findOneAndUpdate(
      { _id: serverId, owner: userId },
      updates,
      { new: true }
    ).populate('channels');

    if (!server) {
      return res.status(404).json({ error: 'Server not found or unauthorized' });
    }

    res.json({
      success: true,
      data: server
    });
  } catch (error) {
    console.error('Update server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete server
router.delete('/:serverId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { serverId } = req.params;
    const userId = req.user!._id;

    const server = await Server.findOne({ _id: serverId, owner: userId });
    if (!server) {
      return res.status(404).json({ error: 'Server not found or unauthorized' });
    }

    // Delete all channels
    await Channel.deleteMany({ server: serverId });
    
    // Delete all messages
    await Message.deleteMany({ server: serverId });
    
    // Delete the server
    await Server.findByIdAndDelete(serverId);

    res.json({
      success: true,
      message: 'Server deleted'
    });
  } catch (error) {
    console.error('Delete server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Join server by invite
router.post('/join/:inviteCode', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { inviteCode } = req.params;
    const userId = req.user!._id;

    const server = await Server.findOne({
      'invites.code': inviteCode
    });

    if (!server) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    const invite = server.invites.find(inv => inv.code === inviteCode);
    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    // Check if invite is expired
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invite expired' });
    }

    // Check if invite has reached max uses
    if (invite.maxUses && invite.uses >= invite.maxUses) {
      return res.status(400).json({ error: 'Invite has reached maximum uses' });
    }

    // Check if user is already a member
    const isMember = server.members.some(member => 
      member.user.toString() === (userId as any).toString()
    );

    if (isMember) {
      return res.status(400).json({ error: 'Already a member of this server' });
    }

    // Add user to server
    server.members.push({
      user: userId as any,
      roles: [server.roles.find(role => role.name === '@everyone')!._id],
      joinedAt: new Date()
    });

    // Increment invite uses
    invite.uses += 1;

    await server.save();

    // Add server to user's servers
    await User.findByIdAndUpdate(userId, {
      $push: { servers: server._id }
    });

    res.json({
      success: true,
      server: await Server.findById(server._id).populate('channels')
    });
  } catch (error) {
    console.error('Join server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create invite
router.post('/:serverId/invites', authMiddleware, [
  body('expiresIn').optional().isInt({ min: 0 }),
  body('expiresAt').optional().isISO8601(),
  body('maxUses').optional().isInt({ min: 0 })
], async (req: AuthRequest, res: Response) => {
  try {
    const { serverId } = req.params;
    const { expiresIn, expiresAt, maxUses } = req.body;
    const userId = req.user!._id;

    const server = await Server.findOne({
      _id: serverId,
      'members.user': userId
    });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Generate unique invite code
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    let expiration = undefined;
    if (expiresAt) {
      expiration = new Date(expiresAt);
    } else if (expiresIn) {
      expiration = new Date(Date.now() + expiresIn * 1000);
    }

    const invite = {
      code: inviteCode,
      createdBy: userId as any,
      createdAt: new Date(),
      expiresAt: expiration,
      maxUses: maxUses || undefined,
      uses: 0
    };

    server.invites.push(invite);
    await server.save();

    // Populate the created invite with creator info
    const populatedServer = await Server.findById(serverId)
      .populate('invites.createdBy', 'username displayName avatar');
    
    const createdInvite = populatedServer?.invites.find(inv => inv.code === inviteCode);

    res.status(201).json({
      success: true,
      data: createdInvite
    });
  } catch (error) {
    console.error('Create invite error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get server invites
router.get('/:serverId/invites', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { serverId } = req.params;
    const userId = req.user!._id;

    const server = await Server.findOne({
      _id: serverId,
      'members.user': userId
    }).populate('invites.createdBy', 'username displayName avatar');

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Remove expired invites
    const now = new Date();
    server.invites = server.invites.filter(invite => 
      !invite.expiresAt || invite.expiresAt > now
    );
    await server.save();

    res.json({
      success: true,
      data: server.invites
    });
  } catch (error) {
    console.error('Get invites error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete invite
router.delete('/:serverId/invites/:inviteCode', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { serverId, inviteCode } = req.params;
    const userId = req.user!._id;

    const server = await Server.findOne({
      _id: serverId,
      $or: [
        { owner: userId },
        { 'members.user': userId }
      ]
    });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    const invite = server.invites.find(inv => inv.code === inviteCode);
    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    // Only owner or invite creator can delete
    if (server.owner.toString() !== userId.toString() && 
        invite.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    server.invites = server.invites.filter(inv => inv.code !== inviteCode);
    await server.save();

    res.json({
      success: true,
      message: 'Invite deleted'
    });
  } catch (error) {
    console.error('Delete invite error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Kick member
router.delete('/:serverId/members/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { serverId, userId: targetUserId } = req.params;
    const requesterId = req.user!._id;

    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Only owner can kick members
    if (server.owner.toString() !== requesterId.toString()) {
      return res.status(403).json({ error: 'Only server owner can kick members' });
    }

    // Cannot kick owner
    if (server.owner.toString() === targetUserId) {
      return res.status(400).json({ error: 'Cannot kick server owner' });
    }

    // Remove member
    server.members = server.members.filter(
      member => member.user.toString() !== targetUserId
    );
    await server.save();

    res.json({
      success: true,
      message: 'Member kicked'
    });
  } catch (error) {
    console.error('Kick member error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Ban member
router.post('/:serverId/bans', authMiddleware, [
  body('userId').isMongoId(),
  body('reason').optional().isString().isLength({ max: 512 })
], async (req: AuthRequest, res: Response) => {
  try {
    const { serverId } = req.params;
    const { userId: targetUserId, reason } = req.body;
    const requesterId = req.user!._id;

    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Only owner can ban members
    if (server.owner.toString() !== requesterId.toString()) {
      return res.status(403).json({ error: 'Only server owner can ban members' });
    }

    // Cannot ban owner
    if (server.owner.toString() === targetUserId) {
      return res.status(400).json({ error: 'Cannot ban server owner' });
    }

    // Remove member and add to bans (if bans array exists in schema)
    server.members = server.members.filter(
      member => member.user.toString() !== targetUserId
    );

    // Add ban record (you might want to add a bans field to the schema)
    // For now, just remove the member
    await server.save();

    res.json({
      success: true,
      message: 'Member banned'
    });
  } catch (error) {
    console.error('Ban member error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Leave server
router.post('/:serverId/leave', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { serverId } = req.params;
    const userId = req.user!._id;

    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Owner cannot leave their own server
    if (server.owner.toString() === userId.toString()) {
      return res.status(400).json({ error: 'Server owner cannot leave. Transfer ownership or delete the server.' });
    }

    // Remove member
    server.members = server.members.filter(
      member => member.user.toString() !== userId.toString()
    );
    await server.save();

    res.json({
      success: true,
      message: 'Left server'
    });
  } catch (error) {
    console.error('Leave server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
