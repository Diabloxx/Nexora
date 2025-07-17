import express from 'express';
import Announcement from '../models/Announcement';

const router = express.Router();

// Get public announcements (no authentication required)
router.get('/public', async (req, res) => {
  try {
    const announcements = await Announcement.find({
      isActive: true,
      targetAudience: { $in: ['all', 'public'] }
    })
      .populate('author', 'displayName globalRole')
      .sort({ isPinned: -1, priority: -1, publishedAt: -1 })
      .limit(10); // Limit to latest 10 announcements

    res.json({
      success: true,
      data: announcements
    });
  } catch (error) {
    console.error('Error fetching public announcements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch announcements'
    });
  }
});

export default router;
