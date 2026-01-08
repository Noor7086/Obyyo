import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { validationResult } from 'express-validator';
import { sendWelcomeEmail, sendForgotPasswordEmail } from '../utils/emailService.js';
import { sendOTP } from '../utils/twilioService.js';

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { firstName, lastName, email, password, phone, country, selectedLottery } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      country,
      country,
      selectedLottery
    });

    // Generate and send OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 10); // 10 mins expiry

    user.phoneOtp = otp;
    user.phoneOtpExpires = otpExpires;
    user.isPhoneVerified = false;
    await user.save();

    try {
      await sendOTP(user.phone, otp);
    } catch (otpError) {
      console.error('Failed to send OTP:', otpError);
    }

    // Send welcome email (non-blocking - don't fail registration if email fails)
    try {
      const emailResult = await sendWelcomeEmail(user);
      if (!emailResult || !emailResult.success) {
        console.warn('Welcome email not sent (SMTP not configured or failed):', emailResult?.message);
      }
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Continue with registration even if email fails
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          country: user.country,
          selectedLottery: user.selectedLottery,
          trialStartDate: user.trialStartDate,
          trialEndDate: user.trialEndDate,
          isInTrial: user.isInTrial(),
          createdAt: user.createdAt
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          country: user.country,
          selectedLottery: user.selectedLottery,
          trialStartDate: user.trialStartDate,
          trialEndDate: user.trialEndDate,
          isInTrial: user.isInTrial(),
          walletBalance: user.walletBalance,
          role: user.role,
          createdAt: user.createdAt
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          country: user.country,
          selectedLottery: user.selectedLottery,
          trialStartDate: user.trialStartDate,
          trialEndDate: user.trialEndDate,
          isInTrial: user.isInTrial(),
          walletBalance: user.walletBalance,
          role: user.role,
          notificationsEnabled: user.notificationsEnabled,
          role: user.role,
          notificationsEnabled: user.notificationsEnabled,
          isPhoneVerified: user.isPhoneVerified,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, selectedLottery, notificationsEnabled } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (notificationsEnabled !== undefined) user.notificationsEnabled = notificationsEnabled;

    // Update email if provided and different from current
    if (email && email !== user.email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use by another account'
        });
      }
      user.email = email.toLowerCase();
    }

    // Update selectedLottery if provided and not empty
    if (selectedLottery !== undefined && selectedLottery !== null && selectedLottery !== '') {
      user.selectedLottery = selectedLottery;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          country: user.country,
          selectedLottery: user.selectedLottery,
          trialStartDate: user.trialStartDate,
          trialEndDate: user.trialEndDate,
          isInTrial: user.isInTrial(),
          walletBalance: user.walletBalance,
          role: user.role,
          notificationsEnabled: user.notificationsEnabled,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update'
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password change'
    });
  }
};

// Generate 6-digit random code
const generateResetCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Forgot password - send reset code to email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Check SMTP configuration FIRST - if not configured, return error immediately
    // This prevents false success messages when email service is unavailable
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('Password reset requested but SMTP is not configured');
      return res.status(500).json({
        success: false,
        message: 'Email service is not configured. Please contact support to reset your password.'
      });
    }

    // Find user by email - ONLY registered users can reset password
    const user = await User.findOne({ email: normalizedEmail });

    // IMPORTANT: Only proceed if user exists - no code generation or email sending for non-registered emails
    if (!user) {
      // Log for debugging
      console.log(`Password reset requested for non-registered email: ${normalizedEmail} - NO CODE GENERATED, NO EMAIL SENT`);
      // Return error for non-registered email with sign up suggestion
      return res.status(404).json({
        success: false,
        message: 'No user found with this email address. Please sign up to create an account.'
      });
    }

    // User exists - proceed with password reset
    console.log(`Password reset code requested for registered email: ${normalizedEmail}`);

    // Check if user is active
    if (!user.isActive) {
      console.log(`Password reset denied for deactivated account: ${normalizedEmail}`);
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Generate 6-digit reset code (ONLY for registered and active users)
    const resetCode = generateResetCode();

    // Set code expiration (15 minutes)
    const resetCodeExpires = new Date();
    resetCodeExpires.setMinutes(resetCodeExpires.getMinutes() + 15);

    // Save reset code to user (ONLY registered users have codes saved)
    user.resetPasswordCode = resetCode;
    user.resetPasswordCodeExpires = resetCodeExpires;
    await user.save();

    // Send email with reset code (ONLY for registered, active users)
    // Double-check user exists before sending (redundant but explicit)
    if (!user || !user.email) {
      console.error('Critical error: Attempted to send email to non-existent user');
      // Clear the code
      user.resetPasswordCode = null;
      user.resetPasswordCodeExpires = null;
      await user.save();
      return res.status(500).json({
        success: false,
        message: 'An error occurred. Please try again later.'
      });
    }

    try {
      console.log(`Sending password reset email to registered user: ${user.email}`);
      const emailResult = await sendForgotPasswordEmail(user, resetCode);

      // Check if email was actually sent
      if (!emailResult || !emailResult.success) {
        console.error('Email service not configured or failed:', emailResult?.message);
        // Clear the code if email service is not configured
        user.resetPasswordCode = null;
        user.resetPasswordCodeExpires = null;
        await user.save();

        return res.status(500).json({
          success: false,
          message: 'Email service is not configured. Please contact support.'
        });
      }

      console.log(`Password reset email sent successfully to: ${user.email}`);

      // Return success only if email was actually sent
      return res.json({
        success: true,
        message: 'Password reset code has been sent to your email address.'
      });
    } catch (emailError) {
      console.error('Failed to send forgot password email:', emailError);
      // Clear the code if email fails
      user.resetPasswordCode = null;
      user.resetPasswordCodeExpires = null;
      await user.save();

      return res.status(500).json({
        success: false,
        message: 'Failed to send reset code. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset request'
    });
  }
};

// @desc    Verify reset code
// @route   POST /api/auth/verify-reset-code
// @access  Public
const verifyResetCode = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, code } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Invalid email or reset code'
      });
    }

    // Check if code exists and matches
    if (!user.resetPasswordCode || user.resetPasswordCode !== code) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset code'
      });
    }

    // Check if code has expired
    if (!user.resetPasswordCodeExpires || new Date() > user.resetPasswordCodeExpires) {
      // Clear expired code
      user.resetPasswordCode = null;
      user.resetPasswordCodeExpires = null;
      await user.save();

      return res.status(400).json({
        success: false,
        message: 'Reset code has expired. Please request a new one.'
      });
    }

    res.json({
      success: true,
      message: 'Reset code verified successfully'
    });
  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during code verification'
    });
  }
};

// @desc    Reset password with verified code
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, code, newPassword } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Invalid email or reset code'
      });
    }

    // Verify reset code
    if (!user.resetPasswordCode || user.resetPasswordCode !== code) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset code'
      });
    }

    // Check if code has expired
    if (!user.resetPasswordCodeExpires || new Date() > user.resetPasswordCodeExpires) {
      // Clear expired code
      user.resetPasswordCode = null;
      user.resetPasswordCodeExpires = null;
      await user.save();

      return res.status(400).json({
        success: false,
        message: 'Reset code has expired. Please request a new one.'
      });
    }

    // Update password
    user.password = newPassword;
    // Clear reset code after successful password change
    user.resetPasswordCode = null;
    user.resetPasswordCodeExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Private
const verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const userId = req.user.userId;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required'
      });
    }

    const user = await User.findById(userId).select('+phoneOtp +phoneOtpExpires');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isPhoneVerified) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is already verified'
      });
    }

    if (!user.phoneOtp || user.phoneOtp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    if (!user.phoneOtpExpires || new Date() > user.phoneOtpExpires) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    // Verify user
    user.isPhoneVerified = true;
    user.phoneOtp = undefined;
    user.phoneOtpExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Phone number verified successfully'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during verification'
    });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Private
const resendOTP = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isPhoneVerified) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is already verified'
      });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 10);

    user.phoneOtp = otp;
    user.phoneOtpExpires = otpExpires;
    await user.save();

    // Send OTP
    await sendOTP(user.phone, otp);

    res.json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP resend'
    });
  }
};

export {
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
};

