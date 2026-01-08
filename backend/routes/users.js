import express from 'express';
import mongoose from 'mongoose';
import { protect, authorize } from '../middleware/auth.js';
import { validatePagination } from '../middleware/validation.js';
import User from '../models/User.js';
import Purchase from '../models/Purchase.js';
import Lottery from '../models/Lottery.js';

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/', protect, authorize('admin'), validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments();

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics (Admin only)
// @access  Private/Admin
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const trialUsers = await User.countDocuments({
      trialEndDate: { $gte: new Date() }
    });
    const totalPurchases = await Purchase.countDocuments({ paymentStatus: 'completed' });

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        trialUsers,
        totalPurchases
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/my-stats
// @desc    Get current user's personal statistics
// @access  Private
router.get('/my-stats', protect, async (req, res) => {
  console.log('✅ /my-stats endpoint called - userId:', req.user?.userId);
  try {
    const userId = req.user.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found'
      });
    }

    // Get user's purchases count - convert userId to ObjectId if needed
    let userObjectId = userId;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      try {
        userObjectId = new mongoose.Types.ObjectId(userId);
      } catch (e) {
        userObjectId = userId;
      }
    }
    
    // Count all purchases (both completed and pending) for total predictions
    const totalPurchasesCompleted = await Purchase.countDocuments({ 
      user: userObjectId, 
      paymentStatus: 'completed' 
    });
    
    // Also count pending purchases that might be in progress
    const totalPurchasesPending = await Purchase.countDocuments({ 
      user: userObjectId, 
      paymentStatus: 'pending' 
    });
    
    const totalPurchases = totalPurchasesCompleted + totalPurchasesPending;
    
    console.log('✅ Purchase counts for user:', {
      userId: userId,
      userObjectId: userObjectId.toString(),
      completed: totalPurchasesCompleted,
      pending: totalPurchasesPending,
      total: totalPurchases
    });

    // Get successful predictions (predictions with accuracy > 0 or verified results)
    const successfulPredictions = await Purchase.aggregate([
      {
        $match: {
          user: userId,
          paymentStatus: 'completed'
        }
      },
      {
        $lookup: {
          from: 'predictions',
          localField: 'prediction',
          foreignField: '_id',
          as: 'predictionData'
        }
      },
      {
        $unwind: '$predictionData'
      },
      {
        $match: {
          $or: [
            { 'predictionData.accuracy': { $exists: true, $gt: 0 } },
            { 'predictionData.isActive': false } // Consider inactive predictions as completed/verified
          ]
        }
      },
      {
        $count: 'successfulCount'
      }
    ]);

    const successfulCount = successfulPredictions[0]?.successfulCount || 0;

    // Get active lotteries count
    const activeLotteries = await Lottery.countDocuments({ isActive: true });

    // Get recent activity (recent purchases)
    const recentPurchases = await Purchase.find({ 
      user: userObjectId, 
      paymentStatus: 'completed' 
    })
      .populate('prediction', 'lotteryType drawDate')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('createdAt prediction');

    const recentActivity = recentPurchases.map(purchase => ({
      type: 'purchase',
      description: `Purchased ${purchase.prediction?.lotteryType || 'prediction'} prediction`,
      timestamp: purchase.createdAt,
      lottery: purchase.prediction?.lotteryType || ''
    }));

    // Calculate trial days left
    const user = await User.findById(userId);
    let trialDaysLeft = 0;
    
    if (user) {
      console.log('✅ User trial info:', {
        hasTrialEndDate: !!user.trialEndDate,
        trialEndDate: user.trialEndDate,
        hasTrialStartDate: !!user.trialStartDate,
        trialStartDate: user.trialStartDate,
        hasUsedTrial: user.hasUsedTrial,
        selectedLottery: user.selectedLottery
      });
      
      if (user.trialEndDate) {
        try {
          const now = new Date();
          const endDate = new Date(user.trialEndDate);
          
          // Calculate difference in milliseconds
          const diffTime = endDate.getTime() - now.getTime();
          
          // Convert to days (can be negative if expired)
          const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          // Only show positive days (trial still active)
          if (days > 0) {
            trialDaysLeft = days;
            console.log('✅ Trial days left calculated:', trialDaysLeft, 'days');
          } else {
            console.log('✅ Trial has expired (days:', days, ')');
            trialDaysLeft = 0;
          }
        } catch (error) {
          console.error('Error calculating trial days:', error);
          trialDaysLeft = 0;
        }
      } else {
        console.log('✅ No trial end date found for user - trial may not be active');
        // If user has a selectedLottery but no trialEndDate, they might need to start a trial
        if (user.selectedLottery && !user.hasUsedTrial) {
          console.log('✅ User has selected lottery but no trial date - may need to activate trial');
        }
      }
    } else {
      console.log('✅ User not found');
    }

    const responseData = {
      totalPredictions: totalPurchases,
      activeLotteries,
      trialDaysLeft,
      recentActivity,
      walletBalance: user?.walletBalance || 0
    };
    
    console.log('✅ Sending user stats response:', responseData);
    
    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Get user personal stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;

