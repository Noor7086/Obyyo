import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import logo from '../../assets/logo.png';

interface ForgotPasswordForm {
  phone: string;
  consentSMSVerification: boolean;
}

interface VerifyCodeForm {
  phone: string;
  code: string;
}

interface ResetPasswordForm {
  phone: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'phone' | 'code' | 'reset'>('phone');
  const [phone, setPhone] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const phoneForm = useForm<ForgotPasswordForm>();
  const codeForm = useForm<VerifyCodeForm>();
  const resetForm = useForm<ResetPasswordForm>();

  // Step 1: Request reset code
  const onPhoneSubmit = async (data: ForgotPasswordForm) => {
    try {
      setIsSubmitting(true);
      await authService.forgotPassword(data.phone, data.consentSMSVerification);
      // Only proceed if SMS was successfully sent (backend confirms user exists and SMS sent)
      setPhone(data.phone);
      setStep('code');
      toast.success('Reset code has been sent to your phone');
    } catch (error: any) {
      // Show error message from backend (phone doesn't exist, etc.)
      toast.error(error.message || 'Failed to send reset code');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify code
  const onCodeSubmit = async (data: VerifyCodeForm) => {
    try {
      setIsSubmitting(true);
      await authService.verifyResetCode(data.phone, data.code);
      setResetCode(data.code);
      setStep('reset');
      toast.success('Code verified successfully');
    } catch (error: any) {
      toast.error(error.message || 'Invalid or expired reset code');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Reset password
  const onResetSubmit = async (data: ResetPasswordForm) => {
    if (data.newPassword !== data.confirmPassword) {
      resetForm.setError('confirmPassword', { message: 'Passwords do not match' });
      return;
    }

    try {
      setIsSubmitting(true);
      await authService.resetPassword(data.phone, data.code, data.newPassword);
      toast.success('Password has been reset successfully');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow-lg border-0">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <Link to="/" className="navbar-brand d-inline-block mb-3">
                    <img 
                      src={logo} 
                      alt="Obyyo Logo" 
                      style={{ 
                        height: '60px', 
                        width: 'auto',
                        objectFit: 'contain'
                      }} 
                    />
                  </Link>
                  <h2 className="mt-3 mb-2">Reset Password</h2>
                  <p className="text-muted">
                    {step === 'phone' && 'Enter your phone number to receive a reset code via SMS'}
                    {step === 'code' && 'Enter the 6-digit code sent to your phone'}
                    {step === 'reset' && 'Enter your new password'}
                  </p>
                </div>

                {/* Step 1: Phone Input */}
                {step === 'phone' && (
                  <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)}>
                    <div className="mb-3">
                      <label htmlFor="phone" className="form-label">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        className={`form-control ${phoneForm.formState.errors.phone ? 'is-invalid' : ''}`}
                        id="phone"
                        {...phoneForm.register('phone', {
                          required: 'Phone number is required',
                          pattern: {
                            value: /^\+?[\d\s\-\(\)]+$/,
                            message: 'Please enter a valid phone number'
                          },
                          validate: (value) => {
                            const digitsOnly = value.replace(/\D/g, '');
                            if (digitsOnly.length < 10) {
                              return 'Phone number must contain at least 10 digits';
                            }
                            return true;
                          }
                        })}
                        placeholder="Enter your phone number"
                      />
                      {phoneForm.formState.errors.phone && (
                        <div className="invalid-feedback">
                          {phoneForm.formState.errors.phone.message}
                        </div>
                      )}
                    </div>

                    <div className="mb-3">
                      <div className="form-check">
                        <input
                          className={`form-check-input ${phoneForm.formState.errors.consentSMSVerification ? 'is-invalid' : ''}`}
                          type="checkbox"
                          id="consentSMSVerification"
                          {...phoneForm.register('consentSMSVerification', {
                            required: 'You must consent to SMS verification to reset your password'
                          })}
                        />
                        <label className="form-check-label" htmlFor="consentSMSVerification">
                          I consent to receive SMS verification code to reset my password
                        </label>
                        {phoneForm.formState.errors.consentSMSVerification && (
                          <div className="invalid-feedback d-block">
                            {phoneForm.formState.errors.consentSMSVerification.message}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="d-grid mb-3">
                      <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Sending...
                          </>
                        ) : (
                          'Send Reset Code'
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* Step 2: Code Verification */}
                {step === 'code' && (
                  <form onSubmit={codeForm.handleSubmit(onCodeSubmit)}>
                    <input type="hidden" {...codeForm.register('phone')} value={phone} />
                    <div className="mb-3">
                      <label htmlFor="code" className="form-label">
                        Verification Code
                      </label>
                      <input
                        type="text"
                        className={`form-control text-center ${codeForm.formState.errors.code ? 'is-invalid' : ''}`}
                        id="code"
                        {...codeForm.register('code', {
                          required: 'Verification code is required',
                          pattern: {
                            value: /^\d{6}$/,
                            message: 'Code must be 6 digits'
                          }
                        })}
                        placeholder="000000"
                        maxLength={6}
                        style={{ fontSize: '1.5rem', letterSpacing: '0.5rem' }}
                      />
                      {codeForm.formState.errors.code && (
                        <div className="invalid-feedback">
                          {codeForm.formState.errors.code.message}
                        </div>
                      )}
                      <small className="text-muted d-block mt-2">
                        Enter the 6-digit code sent to {phone}
                      </small>
                    </div>

                    <div className="d-grid mb-3">
                      <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Verifying...
                          </>
                        ) : (
                          'Verify Code'
                        )}
                      </button>
                    </div>

                    <div className="text-center">
                      <button
                        type="button"
                        className="btn btn-link text-decoration-none"
                        onClick={() => {
                          setStep('phone');
                          codeForm.reset();
                        }}
                      >
                        Change phone number
                      </button>
                    </div>
                  </form>
                )}

                {/* Step 3: Reset Password */}
                {step === 'reset' && (
                  <form onSubmit={resetForm.handleSubmit(onResetSubmit)}>
                    <input type="hidden" {...resetForm.register('phone')} value={phone} />
                    <input type="hidden" {...resetForm.register('code')} value={resetCode} />
                    
                    <div className="mb-3">
                      <label htmlFor="newPassword" className="form-label">
                        New Password
                      </label>
                      <input
                        type="password"
                        className={`form-control ${resetForm.formState.errors.newPassword ? 'is-invalid' : ''}`}
                        id="newPassword"
                        {...resetForm.register('newPassword', {
                          required: 'New password is required',
                          minLength: {
                            value: 6,
                            message: 'Password must be at least 6 characters'
                          },
                          pattern: {
                            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                            message: 'Password must contain uppercase, lowercase, and number'
                          }
                        })}
                        placeholder="Enter new password"
                      />
                      {resetForm.formState.errors.newPassword && (
                        <div className="invalid-feedback">
                          {resetForm.formState.errors.newPassword.message}
                        </div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="confirmPassword" className="form-label">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        className={`form-control ${resetForm.formState.errors.confirmPassword ? 'is-invalid' : ''}`}
                        id="confirmPassword"
                        {...resetForm.register('confirmPassword', {
                          required: 'Please confirm your password'
                        })}
                        placeholder="Confirm new password"
                      />
                      {resetForm.formState.errors.confirmPassword && (
                        <div className="invalid-feedback">
                          {resetForm.formState.errors.confirmPassword.message}
                        </div>
                      )}
                    </div>

                    <div className="d-grid mb-3">
                      <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Resetting...
                          </>
                        ) : (
                          'Reset Password'
                        )}
                      </button>
                    </div>
                  </form>
                )}

                <div className="text-center mt-4">
                  <Link to="/login" className="text-muted text-decoration-none">
                    <i className="bi bi-arrow-left me-1"></i>
                    Back to Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

