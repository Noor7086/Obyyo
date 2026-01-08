import Prediction from '../models/Prediction.js';
import Purchase from '../models/Purchase.js';
import User from '../models/User.js';
import { validationResult } from 'express-validator';

// Helper function to calculate viable numbers from non-viable numbers
const calculateViableFromNonViable = (lotteryType, nonViableMain, nonViableBonus = []) => {
  let totalMain, totalBonus;
  
  switch(lotteryType) {
    case 'powerball':
      totalMain = 69;
      totalBonus = 26;
      break;
    case 'megamillion':
      totalMain = 70;
      totalBonus = 25;
      break;
    case 'lottoamerica':
      totalMain = 52;
      totalBonus = 10;
      break;
    case 'gopher5':
      totalMain = 47;
      totalBonus = 0;
      break;
    case 'pick3':
      totalMain = 10; // 0-9
      totalBonus = 0;
      break;
    default:
      return null;
  }
  
  // Calculate viable numbers = all numbers - non-viable numbers
  const viableMain = [];
  const startNum = lotteryType === 'pick3' ? 0 : 1;
  for (let i = startNum; i < startNum + totalMain; i++) {
    if (!nonViableMain.includes(i)) {
      viableMain.push(i);
    }
  }
  
  const viableBonus = [];
  if (totalBonus > 0) {
    for (let i = 1; i <= totalBonus; i++) {
      if (!nonViableBonus.includes(i)) {
        viableBonus.push(i);
      }
    }
  }
  
  if (lotteryType === 'powerball' || lotteryType === 'megamillion' || lotteryType === 'lottoamerica') {
    return { whiteBalls: viableMain, redBalls: viableBonus };
  } else {
    return viableMain;
  }
};

// Helper function to check if arrays match (same numbers)
const arraysMatch = (arr1, arr2) => {
  if (!arr1 || !arr2 || arr1.length !== arr2.length) return false;
  const sorted1 = [...arr1].sort((a, b) => a - b);
  const sorted2 = [...arr2].sort((a, b) => a - b);
  return sorted1.every((val, idx) => val === sorted2[idx]);
};

// @desc    Get all predictions for a specific lottery
// @route   GET /api/predictions/:lotteryType
// @access  Public
const getPredictions = async (req, res) => {
  try {
    const { lotteryType } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const validLotteryTypes = ['gopher5', 'pick3', 'lottoamerica', 'megamillion', 'powerball'];
    if (!validLotteryTypes.includes(lotteryType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid lottery type'
      });
    }

    // Get start of today (midnight) to include predictions for today and future dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const predictions = await Prediction.find({
      lotteryType,
      isActive: true,
      drawDate: { $gte: today }
    })
    .populate('uploadedBy', 'firstName lastName')
    .sort({ drawDate: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Prediction.countDocuments({
      lotteryType,
      isActive: true,
      drawDate: { $gte: today }
    });

    res.json({
      success: true,
      data: {
        predictions: predictions.map(prediction => ({
          id: prediction._id,
          lotteryType: prediction.lotteryType,
          lotteryDisplayName: prediction.lotteryDisplayName,
          drawDate: prediction.drawDate,
          drawTime: prediction.drawTime,
          viableNumbers: prediction.getViableNumbers(),
          price: prediction.price,
          notes: prediction.notes,
          downloadCount: prediction.downloadCount,
          purchaseCount: prediction.purchaseCount,
          isActive: prediction.isActive,
          createdAt: prediction.createdAt
        })),
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get predictions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get specific prediction details
// @route   GET /api/predictions/:lotteryType/:id
// @access  Private (requires purchase OR trial)
const getPredictionDetails = async (req, res) => {
  try {
    console.log('🚀 getPredictionDetails called:', {
      lotteryType: req.params.lotteryType,
      id: req.params.id,
      userId: req.user.userId
    });
    
    const { lotteryType, id } = req.params;
    const userId = req.user.userId;

    const prediction = await Prediction.findById(id);
    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }

    // Case-insensitive lottery type check
    if (prediction.lotteryType?.toLowerCase() !== lotteryType?.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: `Lottery type mismatch: prediction is for ${prediction.lotteryType}, but requested ${lotteryType}`
      });
    }

    // Check if user is in trial period and has selected this lottery
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('🔍 User data loaded:', {
      userId: user._id.toString(),
      selectedLottery: user.selectedLottery,
      trialEndDate: user.trialEndDate,
      hasTrialEndDate: !!user.trialEndDate,
      lastTrialPredictionDate: user.lastTrialPredictionDate,
      hasUsedTrial: user.hasUsedTrial,
      trialEndDateType: typeof user.trialEndDate,
      trialEndDateValue: user.trialEndDate
    });

    // Check if user has purchased this prediction first
    const purchase = await Purchase.findOne({
      user: userId,
      prediction: id,
      paymentStatus: 'completed'
    });

    let hasAccess = false;
    let isTrialAccess = false;
    let trialPurchase = null; // Store trial purchase to reuse later

    if (purchase) {
      // User has purchased, allow access
      hasAccess = true;
    } else {
      // Check trial access - SIMPLIFIED CHECK
      // First check if user is in trial period
      let isInTrial = false;
      const now = new Date();
      
      // Check trialEndDate first (most reliable)
      if (user.trialEndDate) {
        const trialEnd = new Date(user.trialEndDate);
        isInTrial = now <= trialEnd;
        console.log('🔍 Trial date check:', {
          now: now.toISOString(),
          trialEnd: trialEnd.toISOString(),
          isInTrial,
          diff: trialEnd.getTime() - now.getTime(),
          diffHours: (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60)
        });
      } else {
        console.log('❌ No trialEndDate found for user');
      }
      
      // Also try the method if it exists (fallback)
      if (!isInTrial && user.isInTrial && typeof user.isInTrial === 'function') {
        try {
          const methodResult = user.isInTrial();
          console.log('🔍 isInTrial() method result:', methodResult);
          if (methodResult) {
            isInTrial = true;
          }
        } catch (error) {
          console.error('Error calling isInTrial() method:', error);
        }
      }
      
      const userSelectedLottery = user.selectedLottery?.toLowerCase();
      const requestedLotteryType = lotteryType?.toLowerCase();
      
      // Debug logging
      console.log('🔍 SIMPLE Trial check:', {
        userId: user._id.toString(),
        isInTrial,
        userSelectedLottery,
        requestedLotteryType,
        trialEndDate: user.trialEndDate,
        now: now.toISOString(),
        trialEnd: user.trialEndDate ? new Date(user.trialEndDate).toISOString() : null,
        selectedLottery: user.selectedLottery,
        lotteryMatch: userSelectedLottery === requestedLotteryType,
        allConditionsMet: isInTrial && userSelectedLottery && userSelectedLottery === requestedLotteryType
      });

      // SIMPLE CHECK: If user is in trial AND selected lottery matches requested lottery
      // Double-check all conditions before denying
      const conditionsCheck = {
        hasTrialEndDate: !!user.trialEndDate,
        isInTrial: isInTrial,
        hasSelectedLottery: !!userSelectedLottery,
        lotteryMatches: userSelectedLottery === requestedLotteryType,
        allMet: isInTrial && userSelectedLottery && userSelectedLottery === requestedLotteryType
      };
      
      console.log('🔍 Final conditions check:', conditionsCheck);
      
      if (conditionsCheck.allMet) {
        console.log('✅ Trial conditions MET - proceeding with access check');
        
        // First, check if user has already viewed THIS SPECIFIC prediction
        trialPurchase = await Purchase.findOne({
          user: userId,
          prediction: id,
          paymentStatus: 'trial'
        });
        
        if (trialPurchase) {
          // User has already viewed this specific prediction - allow re-viewing
          console.log('✅ User re-viewing same prediction - allowing access');
          hasAccess = true;
          isTrialAccess = true;
        } else {
          // User hasn't viewed this prediction yet - check one-per-day limit for NEW predictions
          const now = new Date();
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const lastViewDate = user.lastTrialPredictionDate ? new Date(user.lastTrialPredictionDate) : null;
          const lastViewStart = lastViewDate ? new Date(lastViewDate.getFullYear(), lastViewDate.getMonth(), lastViewDate.getDate()) : null;

          // If user already viewed a DIFFERENT prediction today, deny access
          if (lastViewStart && lastViewStart.getTime() === todayStart.getTime()) {
            console.log('❌ User already viewed a different prediction today');
            return res.status(403).json({
              success: false,
              message: 'You have already viewed your free prediction for today. Come back tomorrow for a new prediction!'
            });
          }

          // Allow trial access for new prediction and update last view date
          console.log('✅ Trial access GRANTED - user is in trial and lottery matches (first view)');
          hasAccess = true;
          isTrialAccess = true;
          user.lastTrialPredictionDate = new Date();
          await user.save();
          
          // Create a Purchase record for trial view so it shows in "My Predictions"
          trialPurchase = await Purchase.create({
            user: userId,
            prediction: id,
            amount: 0, // Free for trial
            paymentMethod: 'trial',
            paymentStatus: 'trial',
            isTrialView: true,
            transactionId: `TRIAL_${Date.now()}_${userId}_${Math.random().toString(36).substr(2, 9)}`,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
          });
          console.log('✅ Created trial purchase record for My Predictions');
        }
      } else {
        console.log('❌ Trial access DENIED - conditions not met:', {
          reason: !isInTrial ? 'Not in trial' : !userSelectedLottery ? 'No selected lottery' : userSelectedLottery !== requestedLotteryType ? 'Lottery mismatch' : 'Unknown',
          details: conditionsCheck
        });
      }
    }

    if (!hasAccess) {
      // Provide more detailed error message
      let isInTrialCheck = false;
      if (user.trialEndDate) {
        const now = new Date();
        const trialEnd = new Date(user.trialEndDate);
        isInTrialCheck = now <= trialEnd;
      }
      if (!isInTrialCheck && user.isInTrial && typeof user.isInTrial === 'function') {
        isInTrialCheck = user.isInTrial();
      }
      
      const userSelectedLottery = user.selectedLottery?.toLowerCase();
      const requestedLotteryType = lotteryType?.toLowerCase();
      
      // Enhanced error message with debug info
      console.log('═══════════════════════════════════════════════════════════');
      console.log('❌❌❌ ACCESS DENIED - RETURNING 403 ❌❌❌');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('❌ Access denied - Final check:', {
        userId: user._id.toString(),
        isInTrial: isInTrialCheck,
        userSelectedLottery,
        requestedLotteryType,
        predictionLotteryType: prediction.lotteryType?.toLowerCase(),
        trialEndDate: user.trialEndDate,
        hasPurchase: !!purchase,
        hasUsedTrial: user.hasUsedTrial,
        trialEndDateValue: user.trialEndDate,
        trialEndDateType: typeof user.trialEndDate,
        now: new Date().toISOString(),
        trialEndIfExists: user.trialEndDate ? new Date(user.trialEndDate).toISOString() : null
      });
      console.log('═══════════════════════════════════════════════════════════');
      
      // Give specific error messages
      if (isInTrialCheck && userSelectedLottery && userSelectedLottery !== requestedLotteryType) {
        console.log('❌ Returning 403: Lottery mismatch');
        return res.status(403).json({
          success: false,
          message: `This prediction is for ${lotteryType}, but your trial is for ${user.selectedLottery}. Please select your trial lottery to view free predictions.`
        });
      }
      
      if (isInTrialCheck && !userSelectedLottery) {
        console.log('❌ Returning 403: No selected lottery');
        return res.status(403).json({
          success: false,
          message: 'You are in trial but no lottery is selected. Please contact support.'
        });
      }
      
      if (!isInTrialCheck && user.trialEndDate) {
        const trialEnd = new Date(user.trialEndDate);
        const now = new Date();
        console.log('❌ Returning 403: Trial expired');
        return res.status(403).json({
          success: false,
          message: `Your trial has expired. Trial ended on ${trialEnd.toLocaleDateString()}. Please purchase predictions to continue.`
        });
      }
      
      console.log('❌ Returning 403: Generic "need to purchase" message');
      return res.status(403).json({
        success: false,
        message: 'You need to purchase this prediction to view details'
      });
    }

    // Update download count - only increment prediction count on first download per user
    let isFirstDownload = false;
    
    if (purchase) {
      const previousDownloadCount = purchase.downloadCount || 0;
      purchase.downloadCount += 1;
      purchase.lastDownloaded = new Date();
      await purchase.save();
      
      // Only increment prediction download count if this is the first download by this user
      if (previousDownloadCount === 0) {
        isFirstDownload = true;
      }
    } else if (isTrialAccess && trialPurchase) {
      // For trial views, use the trial purchase record we already found/created
      const previousDownloadCount = trialPurchase.downloadCount || 0;
      trialPurchase.downloadCount += 1;
      trialPurchase.lastDownloaded = new Date();
      await trialPurchase.save();
      
      // Only increment prediction download count if this is the first download by this user
      if (previousDownloadCount === 0) {
        isFirstDownload = true;
        console.log('✅ First download by user - will increment prediction download count');
      } else {
        console.log(`✅ User re-downloading (download #${previousDownloadCount + 1}) - NOT incrementing prediction download count`);
      }
    }

    // Only increment prediction download count once per user (on first download)
    if (isFirstDownload) {
      prediction.downloadCount += 1;
      await prediction.save();
      console.log('✅ Incremented prediction download count (first download by this user)');
    } else {
      console.log('ℹ️ Not incrementing prediction download count (user has already downloaded this prediction)');
    }

    // ONLY GET viableNumbers - these are the recommended numbers
    let viableNumbers = null;
    
    // Get the raw document as plain object
    const pred = prediction.toObject ? prediction.toObject() : prediction;
    
    // Check lottery type and get viableNumbers
    // ALWAYS prefer calculating from non-viable numbers if they exist (source of truth)
    if (prediction.lotteryType === 'powerball' || prediction.lotteryType === 'megamillion' || prediction.lotteryType === 'lottoamerica') {
      // Double selection lotteries
      const nonViableWhite = pred.nonViableNumbers?.whiteBalls || [];
      const nonViableRed = pred.nonViableNumbers?.redBalls || [];
      
      // If non-viable numbers exist, ALWAYS calculate viable from them (source of truth)
      if (nonViableWhite.length > 0 || nonViableRed.length > 0) {
        console.log('✅ Calculating viable numbers from non-viable numbers (source of truth)');
        viableNumbers = calculateViableFromNonViable(prediction.lotteryType, nonViableWhite, nonViableRed);
      } else if (pred.viableNumbers && pred.viableNumbers.whiteBalls && Array.isArray(pred.viableNumbers.whiteBalls) && pred.viableNumbers.whiteBalls.length > 0) {
        // Only use viableNumbers if non-viable doesn't exist
        const viableWhite = pred.viableNumbers.whiteBalls.filter(n => n != null && n !== undefined);
        const viableRed = pred.viableNumbers.redBalls ? pred.viableNumbers.redBalls.filter(n => n != null && n !== undefined) : [];
        viableNumbers = {
          whiteBalls: viableWhite,
          redBalls: viableRed
        };
        console.log('⚠️ Using viableNumbers field (non-viable not found)');
      }
    } else if (prediction.lotteryType === 'gopher5') {
      // Single selection
      const nonViableSingle = pred.nonViableNumbersSingle || [];
      
      // If non-viable numbers exist, ALWAYS calculate viable from them (source of truth)
      if (nonViableSingle.length > 0) {
        console.log('✅ Calculating viable numbers from non-viable numbers (source of truth)');
        viableNumbers = calculateViableFromNonViable(prediction.lotteryType, nonViableSingle);
      } else if (pred.viableNumbersSingle && Array.isArray(pred.viableNumbersSingle) && pred.viableNumbersSingle.length > 0) {
        // Only use viableNumbersSingle if non-viable doesn't exist
        viableNumbers = pred.viableNumbersSingle.filter(n => n != null && n !== undefined);
        console.log('⚠️ Using viableNumbersSingle field (non-viable not found)');
      }
    } else if (prediction.lotteryType === 'pick3') {
      // Pick 3
      const nonViablePick3 = pred.nonViableNumbersPick3 || [];
      
      // If non-viable numbers exist, ALWAYS calculate viable from them (source of truth)
      if (nonViablePick3.length > 0) {
        console.log('✅ Calculating viable numbers from non-viable numbers (source of truth)');
        viableNumbers = calculateViableFromNonViable(prediction.lotteryType, nonViablePick3);
      } else if (pred.viableNumbersPick3 && Array.isArray(pred.viableNumbersPick3) && pred.viableNumbersPick3.length > 0) {
        // Only use viableNumbersPick3 if non-viable doesn't exist
        viableNumbers = pred.viableNumbersPick3.filter(n => n != null && n !== undefined);
        console.log('⚠️ Using viableNumbersPick3 field (non-viable not found)');
      }
    }
    
    console.log('=== SIMPLE PREDICTION DETAILS ===');
    console.log('Lottery Type:', prediction.lotteryType);
    console.log('Viable Numbers Found:', JSON.stringify(viableNumbers, null, 2));
    console.log('===============================');

    res.json({
      success: true,
      data: {
        prediction: {
          id: prediction._id,
          lotteryType: prediction.lotteryType,
          lotteryDisplayName: prediction.lotteryDisplayName,
          drawDate: prediction.drawDate,
          drawTime: prediction.drawTime,
          viableNumbers: viableNumbers,
          price: prediction.price,
          notes: prediction.notes,
          downloadCount: prediction.downloadCount,
          accuracy: prediction.accuracy
        }
      }
    });
  } catch (error) {
    console.error('Get prediction details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Purchase prediction
// @route   POST /api/predictions/:lotteryType/:id/purchase
// @access  Private
const purchasePrediction = async (req, res) => {
  try {
    const { lotteryType, id } = req.params;
    const { paymentMethod } = req.body;
    const userId = req.user.userId;

    const prediction = await Prediction.findById(id);
    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }

    if (prediction.lotteryType !== lotteryType) {
      return res.status(400).json({
        success: false,
        message: 'Lottery type mismatch'
      });
    }

    // Check if user already purchased this prediction
    const existingPurchase = await Purchase.findOne({
      user: userId,
      prediction: id,
      paymentStatus: 'completed'
    });

    if (existingPurchase) {
      return res.status(400).json({
        success: false,
        message: 'You have already purchased this prediction'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is in trial period and has selected this lottery
    if (user.isInTrial() && user.selectedLottery === lotteryType) {
      return res.status(400).json({
        success: false,
        message: 'This prediction is free during your trial period'
      });
    }

    // Handle wallet payment
    if (paymentMethod === 'wallet') {
      if (user.walletBalance < prediction.price) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient wallet balance'
        });
      }

      // Deduct from wallet
      user.walletBalance -= prediction.price;
      await user.save();

      // Generate unique transaction ID
      const transactionId = `WALLET_${Date.now()}_${userId}_${Math.random().toString(36).substr(2, 9)}`;

      // Create purchase record with all transaction details
      const purchase = await Purchase.create({
        user: userId,
        prediction: id,
        amount: prediction.price,
        paymentMethod: 'wallet',
        paymentStatus: 'completed',
        transactionId: transactionId,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        paymentGatewayResponse: {
          method: 'wallet',
          walletBalanceBefore: user.walletBalance + prediction.price,
          walletBalanceAfter: user.walletBalance,
          timestamp: new Date()
        }
      });

      console.log(`✅ Transaction saved: ${transactionId} - User: ${user.email} - Amount: $${prediction.price} - Lottery: ${prediction.lotteryType}`);

      // Update prediction purchase count
      prediction.purchaseCount += 1;
      await prediction.save();

      return res.json({
        success: true,
        message: 'Prediction purchased successfully',
        data: {
          purchase: {
            id: purchase._id,
            amount: purchase.amount,
            paymentMethod: purchase.paymentMethod,
            paymentStatus: purchase.paymentStatus,
            transactionId: purchase.transactionId
          }
        }
      });
    }

    // For other payment methods (Stripe, PayPal), return payment intent
    res.json({
      success: true,
      message: 'Payment intent created',
      data: {
        amount: prediction.price,
        paymentMethod,
        predictionId: id
      }
    });
  } catch (error) {
    console.error('Purchase prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during purchase'
    });
  }
};

// @desc    Get user's purchased predictions
// @route   GET /api/predictions/my-purchases
// @access  Private
const getMyPurchases = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;

    const purchases = await Purchase.find({
      user: userId,
      paymentStatus: { $in: ['completed', 'trial'] }
    })
    .populate('prediction')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Purchase.countDocuments({
      user: userId,
      paymentStatus: { $in: ['completed', 'trial'] }
    });

    // Format purchases with full prediction data
    const formattedPurchases = purchases
      .filter(purchase => purchase.prediction) // Filter out purchases with deleted predictions
      .map(purchase => {
        const prediction = purchase.prediction;
        
        // Double check prediction exists
        if (!prediction) {
          return null;
        }
        
        // ONLY GET viableNumbers - these are the recommended numbers
        let viableNumbers = null;
        const pred = prediction.toObject ? prediction.toObject() : prediction;
        
        // Check lottery type and get viableNumbers
        // ALWAYS prefer calculating from non-viable numbers if they exist (source of truth)
        if (prediction.lotteryType === 'powerball' || prediction.lotteryType === 'megamillion' || prediction.lotteryType === 'lottoamerica') {
          // Double selection lotteries
          const nonViableWhite = pred.nonViableNumbers?.whiteBalls || [];
          const nonViableRed = pred.nonViableNumbers?.redBalls || [];
          
          // If non-viable numbers exist, ALWAYS calculate viable from them (source of truth)
          if (nonViableWhite.length > 0 || nonViableRed.length > 0) {
            viableNumbers = calculateViableFromNonViable(prediction.lotteryType, nonViableWhite, nonViableRed);
          } else if (pred.viableNumbers && pred.viableNumbers.whiteBalls && Array.isArray(pred.viableNumbers.whiteBalls) && pred.viableNumbers.whiteBalls.length > 0) {
            // Only use viableNumbers if non-viable doesn't exist
            const viableWhite = pred.viableNumbers.whiteBalls.filter(n => n != null && n !== undefined);
            const viableRed = pred.viableNumbers.redBalls ? pred.viableNumbers.redBalls.filter(n => n != null && n !== undefined) : [];
            viableNumbers = {
              whiteBalls: viableWhite,
              redBalls: viableRed
            };
          }
        } else if (prediction.lotteryType === 'gopher5') {
          // Single selection
          const nonViableSingle = pred.nonViableNumbersSingle || [];
          
          // If non-viable numbers exist, ALWAYS calculate viable from them (source of truth)
          if (nonViableSingle.length > 0) {
            viableNumbers = calculateViableFromNonViable(prediction.lotteryType, nonViableSingle);
          } else if (pred.viableNumbersSingle && Array.isArray(pred.viableNumbersSingle) && pred.viableNumbersSingle.length > 0) {
            // Only use viableNumbersSingle if non-viable doesn't exist
            viableNumbers = pred.viableNumbersSingle.filter(n => n != null && n !== undefined);
          }
        } else if (prediction.lotteryType === 'pick3') {
          // Pick 3
          const nonViablePick3 = pred.nonViableNumbersPick3 || [];
          
          // If non-viable numbers exist, ALWAYS calculate viable from them (source of truth)
          if (nonViablePick3.length > 0) {
            viableNumbers = calculateViableFromNonViable(prediction.lotteryType, nonViablePick3);
          } else if (pred.viableNumbersPick3 && Array.isArray(pred.viableNumbersPick3) && pred.viableNumbersPick3.length > 0) {
            // Only use viableNumbersPick3 if non-viable doesn't exist
            viableNumbers = pred.viableNumbersPick3.filter(n => n != null && n !== undefined);
          }
        }
        
        return {
          id: purchase._id,
          user: purchase.user,
          prediction: {
            id: prediction._id,
            lotteryType: prediction.lotteryType,
            lotteryDisplayName: prediction.lotteryDisplayName || prediction.lotteryType,
            drawDate: prediction.drawDate,
            drawTime: prediction.drawTime,
            viableNumbers: viableNumbers,
            price: prediction.price,
            notes: prediction.notes,
            downloadCount: prediction.downloadCount || 0,
            accuracy: prediction.accuracy
          },
          amount: purchase.amount,
          paymentMethod: purchase.paymentMethod,
          paymentStatus: purchase.paymentStatus,
          transactionId: purchase.transactionId,
          downloadCount: purchase.downloadCount || 0,
          lastDownloaded: purchase.lastDownloaded,
          isRefunded: purchase.isRefunded,
          refundReason: purchase.refundReason,
          createdAt: purchase.createdAt,
          updatedAt: purchase.updatedAt
        };
      })
      .filter(p => p !== null); // Remove any null entries

    res.json({
      success: true,
      data: {
        purchases: formattedPurchases,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get my purchases error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get trial predictions (free for trial users)
// @route   GET /api/predictions/trial/:lotteryType
// @access  Private
const getTrialPredictions = async (req, res) => {
  try {
    const { lotteryType } = req.params;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is in trial and has selected this lottery
    if (!user.isInTrial() || user.selectedLottery !== lotteryType) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This is only available during your trial period for your selected lottery.'
      });
    }

    // Get start of today (midnight) to include predictions for today and future dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const predictions = await Prediction.find({
      lotteryType,
      isActive: true,
      drawDate: { $gte: today }
    })
    .populate('uploadedBy', 'firstName lastName')
    .sort({ drawDate: 1 })
    .limit(5);

    res.json({
      success: true,
      data: {
        predictions: predictions.map(prediction => ({
          id: prediction._id,
          lotteryType: prediction.lotteryType,
          lotteryDisplayName: prediction.lotteryDisplayName,
          drawDate: prediction.drawDate,
          drawTime: prediction.drawTime,
          viableNumbers: prediction.getViableNumbers(),
          notes: prediction.notes
        }))
      }
    });
  } catch (error) {
    console.error('Get trial predictions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get result for a purchased prediction
// @route   GET /api/predictions/result/:id
// @access  Private (user must have purchased the prediction)
const getPredictionResult = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check if user has purchased this prediction
    const purchase = await Purchase.findOne({
      user: userId,
      prediction: id,
      paymentStatus: { $in: ['completed', 'trial'] }
    });

    if (!purchase) {
      return res.status(403).json({
        success: false,
        message: 'You must purchase this prediction to view results'
      });
    }

    // Get result for this prediction
    const Result = (await import('../models/Result.js')).default;
    const result = await Result.findOne({ prediction: id })
      .sort({ drawDate: -1 })
      .lean();

    if (!result) {
      return res.json({
        success: true,
        data: { result: null }
      });
    }

    res.json({
      success: true,
      data: { result }
    });
  } catch (error) {
    console.error('Get prediction result error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export {
  getPredictions,
  getPredictionDetails,
  purchasePrediction,
  getMyPurchases,
  getTrialPredictions,
  getPredictionResult
};

