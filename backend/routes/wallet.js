import express from 'express';
import { protect } from '../middleware/auth.js';
import { body } from 'express-validator';
import {
  getWallet,
  getTransactions,
  depositFunds,
  withdrawFunds,
  makePayment,
  addBonus,
  getWalletStats
} from '../controllers/walletController.js';

const router = express.Router();

// Validation middleware
const depositValidation = [
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .isLength({ max: 255 })
    .withMessage('Description must be less than 255 characters'),
  body('reference')
    .optional()
    .isString()
    .withMessage('Reference must be a string')
];

const withdrawValidation = [
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .isLength({ max: 255 })
    .withMessage('Description must be less than 255 characters'),
  body('reference')
    .optional()
    .isString()
    .withMessage('Reference must be a string')
];

const paymentValidation = [
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('description')
    .isString()
    .withMessage('Description is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Description must be between 1 and 255 characters'),
  body('reference')
    .optional()
    .isString()
    .withMessage('Reference must be a string'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
];

const bonusValidation = [
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('description')
    .isString()
    .withMessage('Description is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Description must be between 1 and 255 characters'),
  body('reference')
    .optional()
    .isString()
    .withMessage('Reference must be a string'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
];

// All routes are protected
router.use(protect);

// @route   GET /api/wallet
// @desc    Get user's wallet
// @access  Private
router.get('/', getWallet);

// @route   GET /api/wallet/stats
// @desc    Get wallet statistics
// @access  Private
router.get('/stats', getWalletStats);

// @route   GET /api/wallet/transactions
// @desc    Get wallet transactions with pagination and filtering
// @access  Private
router.get('/transactions', getTransactions);

// @route   POST /api/wallet/deposit
// @desc    Add funds to wallet
// @access  Private
router.post('/deposit', depositValidation, depositFunds);

// @route   POST /api/wallet/withdraw
// @desc    Withdraw funds from wallet
// @access  Private
router.post('/withdraw', withdrawValidation, withdrawFunds);

// @route   POST /api/wallet/payment
// @desc    Make payment from wallet
// @access  Private
router.post('/payment', paymentValidation, makePayment);

// @route   POST /api/wallet/bonus
// @desc    Add bonus to wallet
// @access  Private
router.post('/bonus', bonusValidation, addBonus);

export default router;

