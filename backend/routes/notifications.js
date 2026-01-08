import express from 'express';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/notifications/user/:userId
// @desc    Get user notifications
// @access  Private
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // For now, return empty notifications
    // In production, implement notification system
    res.json({
      success: true,
      data: {
        notifications: []
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;

