import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import authMiddleware, { AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get user profile
router.get('/profile/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .select('-password -email')
      .populate('servers', 'name icon');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.patch('/profile', authMiddleware, [
  body('displayName').optional().isLength({ min: 1, max: 32 }).trim(),
  body('bio').optional().isLength({ max: 190 }),
  body('status').optional().isIn(['online', 'away', 'busy', 'offline'])
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user!._id;
    const allowedUpdates = ['displayName', 'bio', 'status', 'avatar'];
    const updates = Object.keys(req.body).filter(key => allowedUpdates.includes(key));
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    updates.forEach(update => {
      (user as any)[update] = req.body[update];
    });

    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        avatar: user.avatar,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search users
router.get('/search', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { displayName: { $regex: q, $options: 'i' } }
      ]
    })
    .select('username displayName avatar status')
    .limit(20);

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send friend request
router.post('/friends/request', authMiddleware, [
  body('username').isLength({ min: 2, max: 32 }).trim()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username } = req.body;
    const currentUser = req.user!;

    const targetUser = await User.findOne({ username });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser._id.toString() === currentUser._id.toString()) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if already friends
    if (currentUser.friends.includes(targetUser._id as any)) {
      return res.status(400).json({ error: 'Already friends' });
    }

    // Check if request already sent
    if (currentUser.friendRequests.sent.includes(targetUser._id as any)) {
      return res.status(400).json({ error: 'Friend request already sent' });
    }

    // Check if target user already sent a request
    if (currentUser.friendRequests.received.includes(targetUser._id as any)) {
      return res.status(400).json({ error: 'This user has already sent you a friend request' });
    }

    // Check if user is blocked
    if (currentUser.blocked.includes(targetUser._id as any) || 
        targetUser.blocked.includes(currentUser._id as any)) {
      return res.status(400).json({ error: 'Cannot send friend request to this user' });
    }

    // Add to sent requests
    currentUser.friendRequests.sent.push(targetUser._id as any);
    await currentUser.save();

    // Add to received requests
    targetUser.friendRequests.received.push(currentUser._id as any);
    await targetUser.save();

    res.json({
      success: true,
      message: 'Friend request sent'
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Accept friend request
router.post('/friends/accept/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user!;

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if request exists
    if (!currentUser.friendRequests.received.includes(targetUser._id as any)) {
      return res.status(400).json({ error: 'No friend request from this user' });
    }

    // Add to friends
    currentUser.friends.push(targetUser._id as any);
    targetUser.friends.push(currentUser._id as any);

    // Remove from requests
    currentUser.friendRequests.received = currentUser.friendRequests.received.filter(
      id => id.toString() !== targetUser._id.toString()
    );
    targetUser.friendRequests.sent = targetUser.friendRequests.sent.filter(
      id => id.toString() !== currentUser._id.toString()
    );

    await Promise.all([currentUser.save(), targetUser.save()]);

    res.json({
      success: true,
      message: 'Friend request accepted'
    });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Decline friend request
router.post('/friends/decline/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user!;

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove from requests
    currentUser.friendRequests.received = currentUser.friendRequests.received.filter(
      id => id.toString() !== targetUser._id.toString()
    );
    targetUser.friendRequests.sent = targetUser.friendRequests.sent.filter(
      id => id.toString() !== currentUser._id.toString()
    );

    await Promise.all([currentUser.save(), targetUser.save()]);

    res.json({
      success: true,
      message: 'Friend request declined'
    });
  } catch (error) {
    console.error('Decline friend request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove friend
router.delete('/friends/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user!;

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove from friends
    currentUser.friends = currentUser.friends.filter(
      id => id.toString() !== targetUser._id.toString()
    );
    targetUser.friends = targetUser.friends.filter(
      id => id.toString() !== currentUser._id.toString()
    );

    await Promise.all([currentUser.save(), targetUser.save()]);

    res.json({
      success: true,
      message: 'Friend removed'
    });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get friends list
router.get('/friends', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!._id)
      .populate('friends', 'username displayName avatar status isOnline lastSeen')
      .populate('friendRequests.sent', 'username displayName avatar')
      .populate('friendRequests.received', 'username displayName avatar');

    res.json({
      success: true,
      friends: user?.friends || [],
      friendRequests: user?.friendRequests || { sent: [], received: [] }
    });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Block user
router.post('/block/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user!;

    if (userId === currentUser._id.toString()) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already blocked
    if (currentUser.blocked.includes(targetUser._id as any)) {
      return res.status(400).json({ error: 'User already blocked' });
    }

    // Add to blocked list
    currentUser.blocked.push(targetUser._id as any);

    // Remove from friends if they were friends
    currentUser.friends = currentUser.friends.filter(
      id => id.toString() !== targetUser._id.toString()
    );
    targetUser.friends = targetUser.friends.filter(
      id => id.toString() !== currentUser._id.toString()
    );

    // Remove any pending friend requests
    currentUser.friendRequests.sent = currentUser.friendRequests.sent.filter(
      id => id.toString() !== targetUser._id.toString()
    );
    currentUser.friendRequests.received = currentUser.friendRequests.received.filter(
      id => id.toString() !== targetUser._id.toString()
    );
    targetUser.friendRequests.sent = targetUser.friendRequests.sent.filter(
      id => id.toString() !== currentUser._id.toString()
    );
    targetUser.friendRequests.received = targetUser.friendRequests.received.filter(
      id => id.toString() !== currentUser._id.toString()
    );

    await Promise.all([currentUser.save(), targetUser.save()]);

    res.json({
      success: true,
      message: 'User blocked'
    });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Unblock user
router.delete('/block/:userId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user!;

    currentUser.blocked = currentUser.blocked.filter(
      id => id.toString() !== userId
    );

    await currentUser.save();

    res.json({
      success: true,
      message: 'User unblocked'
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
