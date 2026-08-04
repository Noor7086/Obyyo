import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  verifyOTP,
  resendOTP
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateForgotPassword,
  validateVerifyResetCode,
  validateResetPassword
} from '../middleware/validation.js';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', validateRegistration, register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateLogin, login);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, getMe);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, validateProfileUpdate, updateProfile);

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', protect, validatePasswordChange, changePassword);

// @route   POST /api/auth/forgot-password
// @desc    Send password reset code to email
// @access  Public
router.post('/forgot-password', validateForgotPassword, forgotPassword);

// @route   POST /api/auth/verify-reset-code
// @desc    Verify password reset code
// @access  Public
router.post('/verify-reset-code', validateVerifyResetCode, verifyResetCode);

// @route   POST /api/auth/reset-password
// @desc    Reset password with verified code
// @access  Public
router.post('/reset-password', validateResetPassword, resetPassword);

// @route   POST /api/auth/verify-otp
// @desc    Verify phone OTP
// @access  Private
router.post('/verify-otp', protect, verifyOTP);

// @route   POST /api/auth/resend-otp
// @desc    Resend phone OTP
// @access  Private
router.post('/resend-otp', protect, resendOTP);

export default router;

