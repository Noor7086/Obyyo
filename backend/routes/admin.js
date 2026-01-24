import express from 'express';
import mongoose from 'mongoose';
import { protect, authorize } from '../middleware/auth.js';
import { validatePredictionUpload, validatePagination } from '../middleware/validation.js';
import User from '../models/User.js';
import Prediction from '../models/Prediction.js';
import Purchase from '../models/Purchase.js';
import Lottery from '../models/Lottery.js';
import Result from '../models/Result.js';
import Wallet from '../models/Wallet.js';
import { getAdminPayments, getPaymentStats } from '../controllers/paymentController.js';
import { notifyUsersByLottery } from '../utils/twilioService.js';

const router = express.Router();

// Debug: Log when router is initialized
console.log('📝 Admin router initialized');

// Log all requests to admin routes for debugging
router.use((req, res, next) => {
  if (req.path.includes('result')) {
    console.log('🔍 Admin route request:', {
      method: req.method,
      path: req.path,
      url: req.url,
      originalUrl: req.originalUrl,
      params: req.params
    });
  }
  next();
});

// Test route to verify server is working (before authentication)
router.get('/test-payments', (req, res) => {
  console.log('✅ Test route /test-payments hit!');
  res.json({
    success: true,
    message: 'Payments route test - server is working!',
    timestamp: new Date().toISOString()
  });
});

// @route   GET /api/admin/payments
// @desc    Get recent payment/purchase history for admin with all transaction details
// @access  Private/Admin
router.get('/payments', (req, res, next) => {
  console.log('🔍 /payments route registered and hit!');
  console.log('Request method:', req.method);
  console.log('Request path:', req.path);
  console.log('Request url:', req.url);
  next();
}, protect, authorize('admin'), async (req, res) => {
  try {
    console.log('✅ /payments route handler executing!');
    await getAdminPayments(req, res);
  } catch (error) {
    console.error('❌ Route handler error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/admin/payments/stats
// @desc    Get payment statistics summary
// @access  Private/Admin
router.get('/payments/stats', protect, authorize('admin'), getPaymentStats);

// @route   DELETE /api/admin/payments
// @desc    Delete specific purchases by transaction IDs
// @access  Private/Admin
router.delete('/payments', protect, authorize('admin'), async (req, res) => {
  try {
    const { transactionIds } = req.body;

    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Transaction IDs array is required'
      });
    }

    // Find and delete purchases by transaction IDs
    const deleteResult = await Purchase.deleteMany({
      transactionId: { $in: transactionIds }
    });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'No purchases found with the provided transaction IDs'
      });
    }

    console.log(`🗑️ Deleted ${deleteResult.deletedCount} purchases with transaction IDs:`, transactionIds);

    res.json({
      success: true,
      message: `Successfully deleted ${deleteResult.deletedCount} purchase(s)`,
      deleted: deleteResult.deletedCount,
      transactionIds: transactionIds
    });
  } catch (error) {
    console.error('Delete purchases error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting purchases',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/admin/stats
// @desc    Get admin dashboard statistics
// @access  Private/Admin
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {

    const [
      totalUsers,
      activeUsers,
      trialUsers,
      totalPredictions,
      totalPurchases,
      purchaseRevenue,
      walletRevenue,
      recentActivity
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ trialEndDate: { $gte: new Date() } }),
      Prediction.countDocuments(),
      Purchase.countDocuments({ paymentStatus: 'completed' }),
      Purchase.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).then(result => result[0]?.total || 0),
      Wallet.aggregate([
        { $unwind: '$transactions' },
        { $match: { 'transactions.type': 'credit', 'transactions.status': 'completed' } },
        { $group: { _id: null, total: { $sum: '$transactions.amount' } } }
      ]).then(result => result[0]?.total || 0),
      User.find({}).select('firstName lastName createdAt').sort({ createdAt: -1 }).limit(5)
    ]);

    const totalRevenue = purchaseRevenue + walletRevenue;

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        trialUsers,
        totalPredictions,
        totalPurchases: totalPurchases + (await Wallet.aggregate([
          { $unwind: '$transactions' },
          { $match: { 'transactions.type': 'credit', 'transactions.status': 'completed' } },
          { $count: "count" }
        ]).then(r => r[0]?.count || 0)), // Add wallet deposits to total purchases/transactions count? User asked for total revenue, and "recent payments" to include topups. Total Purchases usually explicitly means predictions. Let's keep totalPurchases as predictions for now, but totalRevenue is combined.
        totalRevenue,
        recentActivity: recentActivity.map(user => ({
          type: 'user_registration',
          description: `${user.firstName} ${user.lastName} registered`,
          timestamp: user.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/admin/predictions
// @desc    Upload new prediction
// @access  Private/Admin
router.post('/predictions', protect, authorize('admin'), validatePredictionUpload, async (req, res) => {
  try {
    // Debug logging
    console.log('=== CREATING PREDICTION ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const predictionData = {
      ...req.body,
      uploadedBy: req.user.userId
    };

    console.log('Prediction data to save:', JSON.stringify(predictionData, null, 2));

    // Prepare all data including nested objects BEFORE creating
    const finalData = {
      lotteryType: predictionData.lotteryType,
      lotteryDisplayName: predictionData.lotteryDisplayName,
      drawDate: predictionData.drawDate,
      drawTime: predictionData.drawTime,
      price: predictionData.price,
      notes: predictionData.notes,
      uploadedBy: predictionData.uploadedBy,
      isActive: predictionData.isActive !== undefined ? predictionData.isActive : true
    };

    // SET NESTED FIELDS BEFORE CREATION - This is the key!
    // Handle non-viable numbers (preferred), fall back to viable numbers (legacy)
    if (predictionData.nonViableNumbers && typeof predictionData.nonViableNumbers === 'object') {
      const whiteBalls = Array.isArray(predictionData.nonViableNumbers.whiteBalls) ?
        predictionData.nonViableNumbers.whiteBalls.filter(n => n != null && n !== undefined && !isNaN(n) && n > 0) : [];
      const redBalls = Array.isArray(predictionData.nonViableNumbers.redBalls) ?
        predictionData.nonViableNumbers.redBalls.filter(n => n != null && n !== undefined && !isNaN(n) && n > 0) : [];

      finalData.nonViableNumbers = {
        whiteBalls: whiteBalls,
        redBalls: redBalls
      };

      console.log('✓ Setting nonViableNumbers whiteBalls:', whiteBalls);
      console.log('✓ Setting nonViableNumbers redBalls:', redBalls);
      console.log('✓ Final nonViableNumbers object:', JSON.stringify(finalData.nonViableNumbers, null, 2));
    } else if (predictionData.viableNumbers && typeof predictionData.viableNumbers === 'object') {
      // Legacy support for viableNumbers
      const whiteBalls = Array.isArray(predictionData.viableNumbers.whiteBalls) ?
        predictionData.viableNumbers.whiteBalls.filter(n => n != null && n !== undefined && !isNaN(n) && n > 0) : [];
      const redBalls = Array.isArray(predictionData.viableNumbers.redBalls) ?
        predictionData.viableNumbers.redBalls.filter(n => n != null && n !== undefined && !isNaN(n) && n > 0) : [];

      finalData.viableNumbers = {
        whiteBalls: whiteBalls,
        redBalls: redBalls
      };

      console.log('✓ Setting viableNumbers (legacy) whiteBalls:', whiteBalls);
      console.log('✓ Setting viableNumbers (legacy) redBalls:', redBalls);
    }

    if (predictionData.nonViableNumbersSingle && Array.isArray(predictionData.nonViableNumbersSingle)) {
      const numbers = predictionData.nonViableNumbersSingle.filter(n => n != null && n !== undefined && !isNaN(n) && n > 0);
      finalData.nonViableNumbersSingle = numbers;
      console.log('✓ Setting nonViableNumbersSingle:', numbers);
    } else if (predictionData.viableNumbersSingle && Array.isArray(predictionData.viableNumbersSingle)) {
      // Legacy support
      const numbers = predictionData.viableNumbersSingle.filter(n => n != null && n !== undefined && !isNaN(n) && n > 0);
      finalData.viableNumbersSingle = numbers;
      console.log('✓ Setting viableNumbersSingle (legacy):', numbers);
    }

    if (predictionData.nonViableNumbersPick3 && Array.isArray(predictionData.nonViableNumbersPick3)) {
      const numbers = predictionData.nonViableNumbersPick3.filter(n => n != null && n !== undefined && !isNaN(n) && n >= 0);
      finalData.nonViableNumbersPick3 = numbers;
      console.log('✓ Setting nonViableNumbersPick3:', numbers);
    } else if (predictionData.viableNumbersPick3 && Array.isArray(predictionData.viableNumbersPick3)) {
      // Legacy support
      const numbers = predictionData.viableNumbersPick3.filter(n => n != null && n !== undefined && !isNaN(n) && n >= 0);
      finalData.viableNumbersPick3 = numbers;
      console.log('✓ Setting viableNumbersPick3 (legacy):', numbers);
    }

    // Create with ALL data including nested objects
    console.log('📝 Creating prediction with finalData:', JSON.stringify(finalData, null, 2));
    const prediction = await Prediction.create(finalData);

    // Reload from DB to verify it was actually saved
    const saved = await Prediction.findById(prediction._id).lean();
    console.log('✅ VERIFIED SAVED - viableNumbers:', JSON.stringify(saved.viableNumbers, null, 2));
    console.log('✅ VERIFIED SAVED - viableNumbersSingle:', saved.viableNumbersSingle);
    console.log('✅ VERIFIED SAVED - viableNumbersPick3:', saved.viableNumbersPick3);

    if (!saved.viableNumbers || (saved.viableNumbers.whiteBalls && saved.viableNumbers.whiteBalls.length === 0 && saved.viableNumbers.redBalls && saved.viableNumbers.redBalls.length === 0)) {
      console.error('❌ ERROR: Numbers were not saved correctly!');
    } else {
      console.log('✅ SUCCESS: Numbers saved correctly!');
    }
    console.log('================================');

    res.status(201).json({
      success: true,
      message: 'Prediction uploaded successfully',
      data: { prediction }
    });

    // Notify users about the new prediction
    notifyUsersByLottery(
      finalData.lotteryType,
      `New prediction uploaded for ${finalData.lotteryDisplayName}! Check it out now on OBYYO.`
    ).then(count => {
      console.log(`[Twilio] Notification process started for new prediction (sent to ~${count} users)`);
    }).catch(err => {
      console.error('[Twilio] Error triggering notifications:', err);
    });
  } catch (error) {
    console.error('Upload prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during prediction upload'
    });
  }
});

// @route   GET /api/admin/predictions
// @desc    Get all predictions for admin
// @access  Private/Admin
router.get('/predictions', protect, authorize('admin'), validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, lotteryType, status } = req.query;

    let query = {};
    const andConditions = [];

    // Build search condition
    if (search) {
      andConditions.push({
        $or: [
          { lotteryDisplayName: { $regex: search, $options: 'i' } },
          { lotteryType: { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } }
        ]
      });
    }

    // Build lottery type filter
    if (lotteryType && lotteryType !== 'all') {
      andConditions.push({ lotteryType: lotteryType });
    }

    // Build status filter
    if (status && status !== 'all') {
      if (status === 'active') {
        andConditions.push({ isActive: true });
      } else if (status === 'inactive') {
        andConditions.push({ isActive: false });
      }
    }

    // Combine all conditions with $and if there are multiple conditions
    if (andConditions.length > 0) {
      if (andConditions.length === 1) {
        query = andConditions[0];
      } else {
        query = { $and: andConditions };
      }
    }

    const predictions = await Prediction.find(query)
      .populate('uploadedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean(); // Convert to plain objects to include all nested data

    const total = await Prediction.countDocuments(query);

    // Transform predictions to include id field (from _id)
    const transformedPredictions = predictions.map(prediction => ({
      ...prediction,
      id: prediction._id.toString(),
      _id: prediction._id.toString() // Keep _id as well for compatibility
    }));

    res.json({
      success: true,
      data: {
        predictions: transformedPredictions,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get admin predictions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users for admin
// @access  Private/Admin
router.get('/users', protect, authorize('admin'), validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    let query = {};

    if (search) {
      query = {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    if (role && role !== 'all') {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    // Get wallet balances for all users from Wallet model (source of truth)
    const userIds = users.map(user => user._id);
    const wallets = await Wallet.find({ user: { $in: userIds } });
    const walletMap = new Map();
    wallets.forEach(wallet => {
      walletMap.set(wallet.user.toString(), wallet.balance);
    });

    // Transform users to include id field (from _id) and actual wallet balance
    const transformedUsers = users.map(user => {
      const userObj = user.toObject();
      const actualWalletBalance = walletMap.get(user._id.toString()) ?? userObj.walletBalance ?? 0;
      return {
        ...userObj,
        id: user._id.toString(),
        _id: user._id.toString(), // Keep _id as well for compatibility
        walletBalance: actualWalletBalance // Use actual balance from Wallet model
      };
    });

    res.json({
      success: true,
      data: {
        users: transformedUsers,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PATCH /api/admin/users/:id/:action
// @desc    Update user status or delete user
// @access  Private/Admin
router.patch('/users/:id/:action', protect, authorize('admin'), async (req, res) => {
  try {
    const { id, action } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error('Invalid ObjectId format:', id);
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // Convert string ID to ObjectId to ensure proper casting
    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(id);
    } catch (err) {
      console.error('Error creating ObjectId:', err);
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    if (action === 'toggle-status') {
      try {
        // First check if user exists using ObjectId
        const user = await User.findById(objectId).select('isActive');
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }

        // Handle undefined/null isActive - default to true if not set
        const currentStatus = user.isActive !== undefined && user.isActive !== null ? user.isActive : true;
        const newStatus = !currentStatus;

        // Use findByIdAndUpdate with ObjectId to avoid triggering save hooks and validation
        const updatedUser = await User.findByIdAndUpdate(
          objectId,
          { $set: { isActive: newStatus } },
          { new: true, runValidators: false }
        );

        if (!updatedUser) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }

        res.json({
          success: true,
          message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`,
          data: {
            userId: updatedUser._id.toString(),
            isActive: updatedUser.isActive
          }
        });
      } catch (updateError) {
        console.error('Update user error:', updateError);
        return res.status(500).json({
          success: false,
          message: updateError.message || 'Failed to update user status',
          error: process.env.NODE_ENV === 'development' ? updateError.stack : undefined
        });
      }
    } else if (action === 'delete') {
      try {
        const deletedUser = await User.findByIdAndDelete(objectId);
        if (!deletedUser) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }
        res.json({
          success: true,
          message: 'User deleted successfully'
        });
      } catch (deleteError) {
        console.error('Delete user error:', deleteError);
        return res.status(500).json({
          success: false,
          message: deleteError.message || 'Failed to delete user'
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid action'
      });
    }
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/admin/predictions/:id
// @desc    Update prediction details
// @access  Private/Admin
router.put('/predictions/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const prediction = await Prediction.findById(id);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }

    // Debug logging
    console.log('=== UPDATING PREDICTION ===');
    console.log('Prediction ID:', id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    // Update prediction fields
    const updateData = { ...req.body };
    delete updateData.uploadedBy; // Don't allow changing the uploader
    delete updateData._id; // Don't allow changing the ID

    console.log('Update data:', JSON.stringify(updateData, null, 2));

    // EXPLICITLY SET NESTED FIELDS - Use set() to replace entire nested object
    if (updateData.viableNumbers && typeof updateData.viableNumbers === 'object') {
      const whiteBalls = Array.isArray(updateData.viableNumbers.whiteBalls) ?
        updateData.viableNumbers.whiteBalls.filter(n => n != null && n !== undefined && !isNaN(n) && n > 0) : [];
      const redBalls = Array.isArray(updateData.viableNumbers.redBalls) ?
        updateData.viableNumbers.redBalls.filter(n => n != null && n !== undefined && !isNaN(n) && n > 0) : [];

      // Replace the entire nested object
      prediction.set('viableNumbers', {
        whiteBalls: whiteBalls,
        redBalls: redBalls
      });

      console.log('✓ Updating viableNumbers whiteBalls:', whiteBalls);
      console.log('✓ Updating viableNumbers redBalls:', redBalls);
      console.log('✓ After set - viableNumbers:', JSON.stringify(prediction.viableNumbers, null, 2));
      delete updateData.viableNumbers;
    }

    if (updateData.viableNumbersSingle && Array.isArray(updateData.viableNumbersSingle)) {
      const numbers = updateData.viableNumbersSingle.filter(n => n != null && n !== undefined && !isNaN(n) && n > 0);
      prediction.set('viableNumbersSingle', numbers);
      console.log('✓ Updating viableNumbersSingle:', numbers);
      delete updateData.viableNumbersSingle;
    }

    if (updateData.viableNumbersPick3 && Array.isArray(updateData.viableNumbersPick3)) {
      const numbers = updateData.viableNumbersPick3.filter(n => n != null && n !== undefined && !isNaN(n) && n >= 0);
      prediction.set('viableNumbersPick3', numbers);
      console.log('✓ Updating viableNumbersPick3:', numbers);
      delete updateData.viableNumbersPick3;
    }

    // Apply remaining fields
    Object.assign(prediction, updateData);
    await prediction.save();

    // Reload from DB to verify it was actually saved
    const saved = await Prediction.findById(id).lean();
    console.log('✅ VERIFIED UPDATED - viableNumbers:', JSON.stringify(saved.viableNumbers, null, 2));
    console.log('✅ VERIFIED UPDATED - viableNumbersSingle:', saved.viableNumbersSingle);
    console.log('✅ VERIFIED UPDATED - viableNumbersPick3:', saved.viableNumbersPick3);

    // Verify what was saved
    const updatedPrediction = await Prediction.findById(id).lean();
    console.log('Updated prediction:', JSON.stringify(updatedPrediction, null, 2));
    console.log('getViableNumbers() result:', JSON.stringify(prediction.getViableNumbers(), null, 2));
    console.log('================================');

    res.json({
      success: true,
      message: 'Prediction updated successfully',
      data: { prediction }
    });
  } catch (error) {
    console.error('Update prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during prediction update'
    });
  }
});

// @route   POST /api/admin/predictions/:id/result
// @desc    Add result for a prediction
// @access  Private/Admin
console.log('📝 Registering POST /predictions/:id/result route');
router.post('/predictions/:id/result', protect, authorize('admin'), async (req, res) => {
  console.log('🔵 POST /predictions/:id/result route hit!');
  console.log('Request params:', req.params);
  console.log('Request body:', req.body);
  console.log('Request URL:', req.url);
  console.log('Request path:', req.path);
  console.log('Request method:', req.method);
  console.log('Request originalUrl:', req.originalUrl);

  try {
    const { id } = req.params;
    const { drawDate, winningNumbers, jackpot, winners } = req.body;

    console.log('📥 Add result request:', {
      predictionId: id,
      drawDate,
      winningNumbers,
      jackpot,
      winners
    });

    // Validate prediction exists
    const prediction = await Prediction.findById(id);
    if (!prediction) {
      console.error('❌ Prediction not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }

    console.log('✅ Prediction found:', prediction.lotteryType);

    // Prepare result data
    // Parse drawDate correctly to avoid timezone issues
    // If drawDate is a date string (YYYY-MM-DD), create date at midnight in local time
    let parsedDrawDate;
    if (typeof drawDate === 'string' && drawDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Date-only string, parse as local date (not UTC)
      const [year, month, day] = drawDate.split('-').map(Number);
      parsedDrawDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    } else {
      parsedDrawDate = new Date(drawDate);
    }

    console.log('📅 Parsing drawDate:', {
      input: drawDate,
      parsed: parsedDrawDate,
      iso: parsedDrawDate.toISOString(),
      local: parsedDrawDate.toLocaleDateString()
    });

    const resultData = {
      prediction: id,
      lotteryType: prediction.lotteryType,
      drawDate: parsedDrawDate,
      jackpot: jackpot || 0,
      winners: {
        jackpot: winners?.jackpot || 0,
        match5: winners?.match5 || 0,
        match4: winners?.match4 || 0,
        match3: winners?.match3 || 0,
        exact: winners?.exact || 0,
        any: winners?.any || 0
      },
      addedBy: req.user.userId
    };

    // Add winning numbers based on lottery type
    if (winningNumbers.whiteBalls && winningNumbers.redBalls) {
      resultData.winningNumbers = {
        whiteBalls: winningNumbers.whiteBalls,
        redBalls: winningNumbers.redBalls
      };
      // Clear other number types
      resultData.winningNumbersSingle = [];
      resultData.winningNumbersPick3 = [];
    } else if (winningNumbers.singleNumbers) {
      resultData.winningNumbersSingle = winningNumbers.singleNumbers;
      // Clear other number types
      resultData.winningNumbers = { whiteBalls: [], redBalls: [] };
      resultData.winningNumbersPick3 = [];
    } else if (winningNumbers.pick3Numbers) {
      resultData.winningNumbersPick3 = winningNumbers.pick3Numbers;
      // Clear other number types
      resultData.winningNumbers = { whiteBalls: [], redBalls: [] };
      resultData.winningNumbersSingle = [];
    }

    // Create result
    console.log('💾 Attempting to create result...');
    const result = await Result.create(resultData);
    console.log('✅ Result created successfully:', result._id);

    // Update prediction accuracy if possible
    // TODO: Calculate accuracy based on prediction vs result

    res.status(201).json({
      success: true,
      message: 'Result added successfully',
      data: { result }
    });

    // Notify users about the result
    notifyUsersByLottery(
      prediction.lotteryType,
      `Results announced for ${prediction.lotteryDisplayName}! Check if you won on OBYYO.`
    ).then(count => {
      console.log(`[Twilio] Notification process started for result announcement (sent to ~${count} users)`);
    }).catch(err => {
      console.error('[Twilio] Error triggering notifications:', err);
    });
  } catch (error) {
    console.error('❌ Add result error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: 'Server error while adding result',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/admin/predictions/:id/results
// @desc    Get results for a prediction
// @access  Private/Admin
router.get('/predictions/:id/results', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const results = await Result.find({ prediction: id })
      .sort({ drawDate: -1 })
      .lean();

    res.json({
      success: true,
      data: { results }
    });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching results'
    });
  }
});

// Test route to verify results routes are working
router.get('/results/test', (req, res) => {
  console.log('✅ Test route /results/test hit!');
  res.json({ success: true, message: 'Results routes are working' });
});

// IMPORTANT: PUT route must come BEFORE GET /results/lottery/:lotteryType
// @route   PUT /api/admin/results/:id
// @desc    Update a result
// @access  Private/Admin
console.log('📝 Registering PUT /results/:id route');
router.put('/results/:id', async (req, res, next) => {
  console.log('🔵 PUT /results/:id route hit! (before middleware)');
  console.log('Request method:', req.method);
  console.log('Request params:', req.params);
  console.log('Request URL:', req.url);
  console.log('Request path:', req.path);
  next();
}, protect, authorize('admin'), async (req, res) => {
  console.log('🔵 PUT /results/:id route handler executing!');
  console.log('Request method:', req.method);
  console.log('Request params:', req.params);
  console.log('Request body:', req.body);
  console.log('Request URL:', req.url);
  console.log('Request path:', req.path);
  console.log('Request originalUrl:', req.originalUrl);

  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error('❌ Invalid ObjectId format:', id);
      return res.status(400).json({
        success: false,
        message: 'Invalid result ID format'
      });
    }
    const { drawDate, winningNumbers, jackpot, winners } = req.body;

    console.log('📥 Update result request:', {
      resultId: id,
      drawDate,
      winningNumbers,
      jackpot,
      winners
    });

    // Find and update result
    const result = await Result.findById(id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    // Update result fields
    if (drawDate) {
      // Parse drawDate correctly to avoid timezone issues
      let parsedDrawDate;
      if (typeof drawDate === 'string' && drawDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Date-only string, parse as local date (not UTC)
        const [year, month, day] = drawDate.split('-').map(Number);
        parsedDrawDate = new Date(year, month - 1, day, 0, 0, 0, 0);
      } else {
        parsedDrawDate = new Date(drawDate);
      }
      console.log('📅 Updating drawDate:', {
        input: drawDate,
        parsed: parsedDrawDate,
        iso: parsedDrawDate.toISOString()
      });
      result.drawDate = parsedDrawDate;
    }
    if (jackpot !== undefined) result.jackpot = jackpot || 0;
    if (winners) {
      result.winners = {
        jackpot: winners.jackpot || 0,
        match5: winners.match5 || 0,
        match4: winners.match4 || 0,
        match3: winners.match3 || 0,
        exact: winners.exact || 0,
        any: winners.any || 0
      };
    }

    // Update winning numbers based on lottery type
    if (winningNumbers) {
      if (winningNumbers.whiteBalls && winningNumbers.redBalls) {
        result.winningNumbers = {
          whiteBalls: winningNumbers.whiteBalls,
          redBalls: winningNumbers.redBalls
        };
        // Clear other number types
        result.winningNumbersSingle = [];
        result.winningNumbersPick3 = [];
      } else if (winningNumbers.singleNumbers) {
        result.winningNumbersSingle = winningNumbers.singleNumbers;
        // Clear other number types
        result.winningNumbers = { whiteBalls: [], redBalls: [] };
        result.winningNumbersPick3 = [];
      } else if (winningNumbers.pick3Numbers) {
        result.winningNumbersPick3 = winningNumbers.pick3Numbers;
        // Clear other number types
        result.winningNumbers = { whiteBalls: [], redBalls: [] };
        result.winningNumbersSingle = [];
      }
    }

    await result.save();

    res.json({
      success: true,
      message: 'Result updated successfully',
      data: { result }
    });
  } catch (error) {
    console.error('Update result error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating result',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/admin/results/lottery/:lotteryType
// @desc    Get latest results for a lottery type (public access via admin route)
// @access  Public
// NOTE: Changed to /results/lottery/:lotteryType to avoid conflict with /results/:id
router.get('/results/lottery/:lotteryType', async (req, res) => {
  try {
    const { lotteryType } = req.params;
    const { limit = 100 } = req.query; // Increased default limit to show more results

    console.log('📥 Fetching results for lottery:', lotteryType);

    // Get latest result - sort by drawDate descending, then by createdAt descending for tie-breaking
    const latestResult = await Result.findOne({ lotteryType: lotteryType.toLowerCase() })
      .sort({ drawDate: -1, createdAt: -1 })
      .lean();

    console.log('📅 Latest result:', latestResult ? {
      drawDate: latestResult.drawDate,
      createdAt: latestResult.createdAt,
      _id: latestResult._id
    } : 'No results found');

    // Get all recent results for history - show all results uploaded by admin
    // Sort by drawDate descending (newest first), then by createdAt descending
    const limitValue = limit === 'all' ? 0 : parseInt(limit) || 100;
    const recentResultsQuery = Result.find({ lotteryType: lotteryType.toLowerCase() })
      .sort({ drawDate: -1, createdAt: -1 });

    // If limit is 0 or 'all', fetch all results, otherwise use the limit
    const recentResults = limitValue > 0
      ? await recentResultsQuery.limit(limitValue).lean()
      : await recentResultsQuery.lean();

    console.log('📊 Total recent results:', recentResults.length);
    if (recentResults.length > 0) {
      console.log('📅 First result date:', recentResults[0].drawDate);
      console.log('📅 Last result date:', recentResults[recentResults.length - 1].drawDate);
    }

    res.json({
      success: true,
      data: {
        latest: latestResult,
        recent: recentResults,
        total: recentResults.length
      }
    });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching results'
    });
  }
});

// @route   PATCH /api/admin/predictions/:id/:action
// @desc    Update prediction status or delete prediction
// @access  Private/Admin
router.patch('/predictions/:id/:action', protect, authorize('admin'), async (req, res) => {
  try {
    const { id, action } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error('Invalid ObjectId format:', id);
      return res.status(400).json({
        success: false,
        message: 'Invalid prediction ID format'
      });
    }

    // Convert string ID to ObjectId to ensure proper casting
    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(id);
    } catch (err) {
      console.error('Error creating ObjectId:', err);
      return res.status(400).json({
        success: false,
        message: 'Invalid prediction ID format'
      });
    }

    if (action === 'toggle-status') {
      try {
        // First check if prediction exists using ObjectId
        const prediction = await Prediction.findById(objectId).select('isActive');
        if (!prediction) {
          return res.status(404).json({
            success: false,
            message: 'Prediction not found'
          });
        }

        // Handle undefined/null isActive - default to true if not set
        const currentStatus = prediction.isActive !== undefined && prediction.isActive !== null ? prediction.isActive : true;
        const newStatus = !currentStatus;

        // Use findByIdAndUpdate with ObjectId to avoid triggering save hooks and validation
        const updatedPrediction = await Prediction.findByIdAndUpdate(
          objectId,
          { $set: { isActive: newStatus } },
          { new: true, runValidators: false }
        );

        if (!updatedPrediction) {
          return res.status(404).json({
            success: false,
            message: 'Prediction not found'
          });
        }

        res.json({
          success: true,
          message: `Prediction ${newStatus ? 'activated' : 'deactivated'} successfully`,
          data: {
            predictionId: updatedPrediction._id.toString(),
            isActive: updatedPrediction.isActive
          }
        });
      } catch (updateError) {
        console.error('Update prediction error:', updateError);
        return res.status(500).json({
          success: false,
          message: updateError.message || 'Failed to update prediction status',
          error: process.env.NODE_ENV === 'development' ? updateError.stack : undefined
        });
      }
    } else if (action === 'delete') {
      try {
        const deletedPrediction = await Prediction.findByIdAndDelete(objectId);
        if (!deletedPrediction) {
          return res.status(404).json({
            success: false,
            message: 'Prediction not found'
          });
        }
        res.json({
          success: true,
          message: 'Prediction deleted successfully'
        });
      } catch (deleteError) {
        console.error('Delete prediction error:', deleteError);
        return res.status(500).json({
          success: false,
          message: deleteError.message || 'Failed to delete prediction',
          error: process.env.NODE_ENV === 'development' ? deleteError.stack : undefined
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid action'
      });
    }
  } catch (error) {
    console.error('Update prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/lotteries
// @desc    Get all lotteries for admin
// @access  Private/Admin
router.get('/lotteries', protect, authorize('admin'), validatePagination, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    let query = {};

    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } }
        ]
      };
    }

    if (status && status !== 'all') {
      query.isActive = status === 'active';
    }

    const lotteries = await Lottery.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Lottery.countDocuments(query);

    res.json({
      success: true,
      data: {
        lotteries,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get admin lotteries error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/admin/lotteries
// @desc    Create new lottery
// @access  Private/Admin
router.post('/lotteries', protect, authorize('admin'), async (req, res) => {
  try {
    const lottery = await Lottery.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Lottery created successfully',
      data: { lottery }
    });
  } catch (error) {
    console.error('Create lottery error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during lottery creation'
    });
  }
});

// @route   PATCH /api/admin/lotteries/:id/:action
// @desc    Update lottery status or delete lottery
// @access  Private/Admin
router.patch('/lotteries/:id/:action', protect, authorize('admin'), async (req, res) => {
  try {
    const { id, action } = req.params;

    if (action === 'toggle-status') {
      const lottery = await Lottery.findById(id);
      if (!lottery) {
        return res.status(404).json({
          success: false,
          message: 'Lottery not found'
        });
      }

      lottery.isActive = !lottery.isActive;
      await lottery.save();

      res.json({
        success: true,
        message: `Lottery ${lottery.isActive ? 'activated' : 'deactivated'} successfully`
      });
    } else if (action === 'delete') {
      await Lottery.findByIdAndDelete(id);
      res.json({
        success: true,
        message: 'Lottery deleted successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid action'
      });
    }
  } catch (error) {
    console.error('Update lottery error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get analytics data for admin
// @access  Private/Admin
router.get('/analytics', protect, authorize('admin'), async (req, res) => {
  try {
    const { range = '30d', lotteryType } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Get user growth data
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get revenue data - filter by lotteryType if provided
    let revenueData;
    if (lotteryType && lotteryType !== 'all') {
      revenueData = await Purchase.aggregate([
        {
          $match: {
            paymentStatus: 'completed',
            createdAt: { $gte: startDate }
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
            'predictionData.lotteryType': lotteryType.toLowerCase()
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            amount: { $sum: '$amount' }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);
    } else {
      revenueData = await Purchase.aggregate([
        {
          $match: {
            paymentStatus: 'completed',
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            amount: { $sum: '$amount' }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);
    }

    // Get prediction stats by lottery type - filter by lotteryType if provided
    let predictionStats;
    if (lotteryType && lotteryType !== 'all') {
      predictionStats = await Prediction.aggregate([
        {
          $match: {
            lotteryType: lotteryType.toLowerCase()
          }
        },
        {
          $lookup: {
            from: 'purchases',
            localField: '_id',
            foreignField: 'prediction',
            as: 'purchases'
          }
        },
        {
          $group: {
            _id: '$lotteryType',
            count: { $sum: 1 },
            revenue: {
              $sum: {
                $sum: '$purchases.amount'
              }
            }
          }
        }
      ]);
    } else {
      predictionStats = await Prediction.aggregate([
        {
          $lookup: {
            from: 'purchases',
            localField: '_id',
            foreignField: 'prediction',
            as: 'purchases'
          }
        },
        {
          $group: {
            _id: '$lotteryType',
            count: { $sum: 1 },
            revenue: {
              $sum: {
                $sum: '$purchases.amount'
              }
            }
          }
        }
      ]);
    }

    // Get top predictions
    const topPredictions = await Prediction.aggregate([
      {
        $lookup: {
          from: 'purchases',
          localField: '_id',
          foreignField: 'prediction',
          as: 'purchases'
        }
      },
      {
        $addFields: {
          purchaseCount: { $size: '$purchases' },
          revenue: { $sum: '$purchases.amount' }
        }
      },
      {
        $sort: { purchaseCount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Get user activity
    const userActivity = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          newUsers: { $sum: 1 },
          activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        userGrowth: userGrowth.map(item => ({
          date: item._id,
          count: item.count
        })),
        revenueData: revenueData.map(item => ({
          date: item._id,
          amount: item.amount
        })),
        predictionStats: predictionStats.map(item => ({
          lotteryType: item._id,
          count: item.count,
          revenue: item.revenue
        })),
        topPredictions: topPredictions.map(item => ({
          id: item._id,
          lotteryDisplayName: item.lotteryDisplayName,
          purchaseCount: item.purchaseCount,
          revenue: item.revenue
        })),
        userActivity: userActivity.map(item => ({
          date: item._id,
          activeUsers: item.activeUsers,
          newUsers: item.newUsers
        }))
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


// @route   POST /api/admin/create-admin
// @desc    Create admin user (one-time setup)
// @access  Public (for initial setup only)
router.post('/create-admin', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin user already exists'
      });
    }

    // Normalize email to lowercase
    const normalizedEmail = (email || 'admin@lottery.com').toLowerCase().trim();

    // Create admin user
    const adminUser = await User.create({
      firstName: firstName || 'Admin',
      lastName: lastName || 'User',
      email: normalizedEmail,
      password: password || 'admin123',
      phone: '+1234567890',
      selectedLottery: 'powerball',
      trialStartDate: new Date(),
      trialEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      isPhoneVerified: true, // Admin users don't need phone verification
      walletBalance: 1000,
      role: 'admin',
      notificationsEnabled: true
    });

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        email: adminUser.email,
        role: adminUser.role
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin creation'
    });
  }
});

export default router;

