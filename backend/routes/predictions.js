import express from 'express';
import {
  getPredictions,
  getLatestPrediction,
  getPredictionDetails,
  purchasePrediction,
  getMyPurchases,
  getTrialPredictions,
  getPredictionResult
} from '../controllers/predictionController.js';
import { protect, isVerified } from '../middleware/auth.js';
import {
  validateLotteryType,
  validatePredictionId,
  validatePurchase,
  validatePagination
} from '../middleware/validation.js';

const router = express.Router();

// Log all requests to predictions routes
router.use((req, res, next) => {
  console.log('📥📥📥 PREDICTIONS ROUTE REQUEST:', {
    method: req.method,
    path: req.path,
    url: req.url,
    params: req.params,
    query: req.query,
    hasUser: !!req.user
  });
  next();
});

// IMPORTANT: More specific routes must come FIRST!

// @route   GET /api/predictions/my-purchases
// @desc    Get user's purchased predictions
// @access  Private
router.get('/my-purchases', protect, isVerified, validatePagination, getMyPurchases);

// @route   GET /api/predictions/result/:id
// @desc    Get result for a purchased prediction
// @access  Private (user must have purchased)
router.get('/result/:id', protect, isVerified, validatePredictionId, getPredictionResult);

// @route   GET /api/predictions/trial/:lotteryType
// @desc    Get trial predictions for user's selected lottery
// @access  Private
router.get('/trial/:lotteryType', protect, isVerified, validateLotteryType, getTrialPredictions);

// @route   GET /api/predictions/latest/:lotteryType
// @desc    Get latest uploaded prediction for a lottery (by createdAt) - for Number Generator
// @access  Public (literal "latest" path avoids conflict with :lotteryType/:id)
router.get('/latest/:lotteryType', validateLotteryType, getLatestPrediction);

// @route   GET /api/predictions/:lotteryType/:id
// @desc    Get specific prediction details
// @access  Private
router.get('/:lotteryType/:id', protect, isVerified, validateLotteryType, validatePredictionId, (req, res, next) => {
  console.log('🚀🚀🚀 ROUTE HIT: /api/predictions/:lotteryType/:id');
  console.log('🚀 Params:', req.params);
  console.log('🚀 User:', req.user);
  next();
}, getPredictionDetails);

// @route   GET /api/predictions/:lotteryType
// @desc    Get all predictions for a specific lottery
// @access  Public
router.get('/:lotteryType', validateLotteryType, validatePagination, getPredictions);

// @route   POST /api/predictions/:lotteryType/:id/purchase
// @desc    Purchase a prediction
// @access  Private
router.post('/:lotteryType/:id/purchase', protect, isVerified, validateLotteryType, validatePredictionId, validatePurchase, purchasePrediction);

export default router;

