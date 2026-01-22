import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { RegisterForm, LotteryType } from '../../types';
import logo from '../../assets/logo.png';

const Register: React.FC = () => {
  const { register: registerUser, user, loading } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirmPassword: false
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError
  } = useForm<RegisterForm>({
    defaultValues: {
      phone: '',
      country: 'United States'
    }
  });

  const password = watch('password');

  const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  const onSubmit = async (data: RegisterForm) => {
    try {
      setIsSubmitting(true);
      await registerUser(data);
      navigate('/verify-otp', { replace: true });
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        setError('email', { message: 'An account with this email already exists' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const lotteryOptions: { value: LotteryType; label: string; description: string }[] = [
    { value: 'gopher5', label: 'Gopher 5 (Minnesota)', description: 'Pick 5 numbers from 1-47' },
    { value: 'pick3', label: 'Pick 3 (Minnesota)', description: 'Pick 3 numbers from 0-9' },
    { value: 'lottoamerica', label: 'Lotto America (USA)', description: 'Pick 5 from 52 + 1 from 10' },
    { value: 'megamillion', label: 'Mega Million (USA)', description: 'Pick 5 from 70 + 1 from 25' },
    { value: 'powerball', label: 'Powerball (USA)', description: 'Pick 5 from 69 + 1 from 26' }
  ];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex align-items-center bg-light py-5">
      <div className="container">
        <div className="row justify-content-center" style={{ marginTop: '5rem' }}>
          <div className="col-md-8 col-lg-6">
            <div className="card shadow-lg border-0">
              <div className="card-body p-5">
                <div className="text-center mb-4" style={{ paddingTop: '2rem' }}>
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
                  <h2 className="mt-3 mb-2">Start Your Free Trial</h2>
                  <p className="text-muted">Create your account and get 7 days of free predictions</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="firstName" className="form-label">
                          First Name
                        </label>
                        <input
                          type="text"
                          className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                          id="firstName"
                          {...register('firstName', {
                            required: 'First name is required',
                            minLength: {
                              value: 2,
                              message: 'First name must be at least 2 characters'
                            }
                          })}
                          placeholder="Enter your first name"
                        />
                        {errors.firstName && (
                          <div className="invalid-feedback">
                            {errors.firstName.message}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="lastName" className="form-label">
                          Last Name
                        </label>
                        <input
                          type="text"
                          className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                          id="lastName"
                          {...register('lastName', {
                            required: 'Last name is required',
                            minLength: {
                              value: 2,
                              message: 'Last name must be at least 2 characters'
                            }
                          })}
                          placeholder="Enter your last name"
                        />
                        {errors.lastName && (
                          <div className="invalid-feedback">
                            {errors.lastName.message}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      Email Address
                    </label>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      id="email"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^\S+@\S+$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      placeholder="Enter your email"
                    />
                    {errors.email && (
                      <div className="invalid-feedback">
                        {errors.email.message}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="phone" className="form-label">
                      Phone Number <span className="text-danger">*</span>
                    </label>
                    <input
                      type="tel"
                      className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                      id="phone"
                      {...register('phone', {
                        required: 'Phone number is required',
                        validate: {
                          notJustCountryCode: (value) => {
                            // Remove all non-digit characters to count digits
                            const digitsOnly = value.replace(/\D/g, '');
                            // Check if phone has at least 10 digits (minimum for a valid phone number)
                            if (digitsOnly.length < 10) {
                              return 'Phone number must contain at least 10 digits';
                            }
                            return true;
                          },
                          validFormat: (value) => {
                            // Check if it matches a valid phone format
                            const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
                            if (!phoneRegex.test(value)) {
                              return 'Invalid phone number format';
                            }
                            return true;
                          }
                        }
                      })}
                      placeholder="+1 (555) 123-4567"
                    />
                    {errors.phone && (
                      <div className="invalid-feedback">
                        {errors.phone.message}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="country" className="form-label">
                      Country
                    </label>
                    <select
                      className={`form-select ${errors.country ? 'is-invalid' : ''}`}
                      id="country"
                      {...register('country', {
                        required: 'Country is required'
                      })}
                    >
                      <option value="">Select your country...</option>
                      <option value="United States">United States</option>
                    </select>
                    {errors.country && (
                      <div className="invalid-feedback">
                        {errors.country.message}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="selectedLottery" className="form-label">
                      Select Your Lottery
                    </label>
                    <select
                      className={`form-select ${errors.selectedLottery ? 'is-invalid' : ''}`}
                      id="selectedLottery"
                      {...register('selectedLottery', {
                        required: 'Please select a lottery'
                      })}
                    >
                      <option value="">Choose your preferred lottery...</option>
                      {lotteryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label} - {option.description}
                        </option>
                      ))}
                    </select>
                    <div className="form-text">
                      You'll receive free predictions for this lottery during your trial
                    </div>
                    {errors.selectedLottery && (
                      <div className="invalid-feedback">
                        {errors.selectedLottery.message}
                      </div>
                    )}
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="password" className="form-label">
                          Password
                        </label>
                        <div className="position-relative">
                          <input
                            type={showPasswords.password ? "text" : "password"}
                            className={`form-control pe-5 ${errors.password ? 'is-invalid' : ''}`}
                            id="password"
                            {...register('password', {
                              required: 'Password is required',
                              minLength: {
                                value: 6,
                                message: 'Password must be at least 6 characters'
                              },
                              pattern: {
                                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
                              }
                            })}
                            placeholder="Create a password"
                          />
                          <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => togglePasswordVisibility('password')}
                          >
                            <i className={`bi bi-${showPasswords.password ? 'eye' : 'eye-slash'}`}></i>
                          </button>
                        </div>
                        {errors.password && (
                          <div className="invalid-feedback d-block">
                            {errors.password.message}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="confirmPassword" className="form-label">
                          Confirm Password
                        </label>
                        <div className="position-relative">
                          <input
                            type={showPasswords.confirmPassword ? "text" : "password"}
                            className={`form-control pe-5 ${errors.confirmPassword ? 'is-invalid' : ''}`}
                            id="confirmPassword"
                            {...register('confirmPassword', {
                              required: 'Please confirm your password',
                              validate: (value) =>
                                value === password || 'Passwords do not match'
                            })}
                            placeholder="Confirm your password"
                          />
                          <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => togglePasswordVisibility('confirmPassword')}
                          >
                            <i className={`bi bi-${showPasswords.confirmPassword ? 'eye' : 'eye-slash'}`}></i>
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <div className="invalid-feedback">
                            {errors.confirmPassword.message}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="form-check mb-3">
                      <input
                        type="checkbox"
                        className={`form-check-input ${errors.consentSMSVerification ? 'is-invalid' : ''}`}
                        id="consentSMSVerification"
                        {...register('consentSMSVerification', {
                          required: 'You must consent to SMS verification to proceed'
                        })}
                      />
                      <label className="form-check-label" htmlFor="consentSMSVerification">
                        I consent to receive SMS messages for phone number verification
                      </label>
                      {errors.consentSMSVerification && (
                        <div className="invalid-feedback d-block">
                          {errors.consentSMSVerification.message}
                        </div>
                      )}
                    </div>

                    <div className="form-check mb-3">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="consentLotteryUpdates"
                        {...register('consentLotteryUpdates')}
                      />
                      <label className="form-check-label" htmlFor="consentLotteryUpdates">
                        I consent to receive updates and notifications for{' '}
                        {watch('selectedLottery') ? (
                          <strong>{lotteryOptions.find(l => l.value === watch('selectedLottery'))?.label}</strong>
                        ) : (
                          'my selected lottery'
                        )}
                      </label>
                    </div>

                    <div className="form-check">
                      <input
                        type="checkbox"
                        className={`form-check-input ${errors.agreeToTerms ? 'is-invalid' : ''}`}
                        id="agreeToTerms"
                        {...register('agreeToTerms', {
                          required: 'You must agree to the terms and conditions'
                        })}
                      />
                      <label className="form-check-label" htmlFor="agreeToTerms">
                        I agree to the{' '}
                        <Link to="/terms-conditions" className="text-primary" target="_blank">
                          Terms & Conditions
                        </Link>{' '}
                        and{' '}
                        <Link to="/privacy-policy" className="text-primary" target="_blank">
                          Privacy Policy
                        </Link>
                      </label>
                      {errors.agreeToTerms && (
                        <div className="invalid-feedback d-block">
                          {errors.agreeToTerms.message}
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
                          Creating Account...
                        </>
                      ) : (
                        'Start Free Trial'
                      )}
                    </button>
                  </div>
                </form>

                <div className="text-center">
                  <p className="mb-0">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary text-decoration-none fw-semibold">
                      Sign in
                    </Link>
                  </p>
                </div>

                <div className="text-center mt-4">
                  <Link to="/" className="text-muted text-decoration-none">
                    <i className="bi bi-arrow-left me-1"></i>
                    Back to Home
                  </Link>
                </div>
              </div>
            </div>

            {/* Trial benefits */}
            <div className="card mt-4 border-0 bg-primary">
              <div className="card-body p-4">
                <h5 className="card-title mb-3 text-dark">
                  <i className="bi bi-gift me-2"></i>
                  Free Trial Benefits
                </h5>
                <ul className="list-unstyled mb-0">
                  <li className="mb-2 text-dark">
                    <i className="bi bi-check-circle me-2 text-success"></i>
                    7 days of free predictions for your selected lottery
                  </li>
                  <li className="mb-2 text-dark">
                    <i className="bi bi-check-circle me-2 text-success"></i>
                    Access to number generator tool
                  </li>
                  <li className="text-dark">
                    <i className="bi bi-check-circle me-2 text-success"></i>
                    No credit card required
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

