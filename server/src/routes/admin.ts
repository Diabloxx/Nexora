import express from 'express';
import User, { IUser } from '../models/User';
import Announcement from '../models/Announcement';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/roles';

const router = express.Router();

// All admin routes require authentication
router.use(authenticateToken);

// Get all users (admin/staff only)
router.get('/users', requirePermission('MANAGE_USERS'), async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const role = req.query.role as string;

    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role && role !== 'all') {
      filter.globalRole = role;
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

// Update user role and permissions (admin only)
router.put('/users/:userId/role', requirePermission('MANAGE_USERS'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { globalRole, permissions } = req.body;
    const authReq = req as AuthRequest;
    const user = authReq.user as IUser;

    // Prevent non-admins from creating/modifying admins
    if (user?.globalRole !== 'admin' && (globalRole === 'admin' || permissions?.includes('MANAGE_USERS'))) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions to assign admin role'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        globalRole,
        permissions: permissions || [],
        ...(globalRole === 'staff' && {
          'staffInfo.assignedAt': new Date(),
          'staffInfo.assignedBy': user?._id
        })
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user role'
    });
  }
});

// Delete user (admin only)
router.delete('/users/:userId', requirePermission('MANAGE_USERS'), async (req, res) => {
  try {
    const { userId } = req.params;
    const authReq = req as AuthRequest;
    const user = authReq.user as IUser;

    // Prevent deleting admin users unless requester is admin
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (userToDelete.globalRole === 'admin' && user?.globalRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Cannot delete admin users'
      });
    }

    // Prevent self-deletion
    if (userId === user?._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
    }

    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      data: { message: 'User deleted successfully' }
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
});

// Get all announcements (staff/admin only)
router.get('/announcements', requirePermission('MANAGE_ANNOUNCEMENTS'), async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('author', 'displayName globalRole')
      .sort({ isPinned: -1, priority: -1, createdAt: -1 });

    res.json({
      success: true,
      data: announcements
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch announcements'
    });
  }
});

// Create announcement (staff/admin only)
router.post('/announcements', requirePermission('MANAGE_ANNOUNCEMENTS'), async (req, res) => {
  try {
    const {
      title,
      content,
      type,
      priority,
      targetAudience,
      isPinned,
      isActive
    } = req.body;
    const authReq = req as AuthRequest;
    const user = authReq.user as IUser;

    const announcement = new Announcement({
      title,
      content,
      type: type || 'info',
      priority: priority || 'normal',
      targetAudience: targetAudience || 'all',
      isPinned: isPinned || false,
      isActive: isActive !== false, // default to true
      author: user?._id,
      publishedAt: new Date()
    });

    await announcement.save();
    await announcement.populate('author', 'displayName globalRole');

    res.status(201).json({
      success: true,
      data: announcement
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create announcement'
    });
  }
});

// Update announcement (staff/admin only)
router.put('/announcements/:announcementId', requirePermission('MANAGE_ANNOUNCEMENTS'), async (req, res) => {
  try {
    const { announcementId } = req.params;
    const updateData = req.body;

    const announcement = await Announcement.findByIdAndUpdate(
      announcementId,
      updateData,
      { new: true }
    ).populate('author', 'displayName globalRole');

    if (!announcement) {
      return res.status(404).json({
        success: false,
        error: 'Announcement not found'
      });
    }

    res.json({
      success: true,
      data: announcement
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update announcement'
    });
  }
});

// Delete announcement (staff/admin only)
router.delete('/announcements/:announcementId', requirePermission('MANAGE_ANNOUNCEMENTS'), async (req, res) => {
  try {
    const { announcementId } = req.params;

    const announcement = await Announcement.findByIdAndDelete(announcementId);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        error: 'Announcement not found'
      });
    }

    res.json({
      success: true,
      data: { message: 'Announcement deleted successfully' }
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete announcement'
    });
  }
});

// Get admin dashboard statistics (admin/staff only)
router.get('/stats', requirePermission('VIEW_ANALYTICS'), async (req, res) => {
  try {
    const [
      totalUsers,
      totalOnlineUsers,
      totalStaff,
      totalAnnouncements,
      recentUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isOnline: true }),
      User.countDocuments({ globalRole: { $in: ['staff', 'admin'] } }),
      Announcement.countDocuments({ isActive: true }),
      User.find()
        .select('-password')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalOnlineUsers,
        totalStaff,
        totalAnnouncements,
        recentUsers
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

export default router;
