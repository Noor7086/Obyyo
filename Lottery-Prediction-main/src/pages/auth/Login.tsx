import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { LoginForm } from '../../types';
import logo from '../../assets/logo.png';

const Login: React.FC = () => {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm<LoginForm>();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      const from = location.state?.from?.pathname || (user.role === 'admin' ? '/admin' : '/dashboard');
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, location]);

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsSubmitting(true);
      const response = await login(data);
      // Use the user data from the login response to determine redirect
      const from = location.state?.from?.pathname || (response.user.role === 'admin' ? '/admin' : '/dashboard');
      navigate(from, { replace: true });
    } catch (error: any) {
      if (error.message.includes('Invalid credentials')) {
        setError('email', { message: 'Invalid email or password' });
        setError('password', { message: 'Invalid email or password' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  <h2 className="mt-3 mb-2">Welcome Back</h2>
                  <p className="text-muted">Sign in to your account to continue</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
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
                    <label htmlFor="password" className="form-label">
                      Password
                    </label>
                    <div className="position-relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        className={`form-control pe-5 ${errors.password ? 'is-invalid' : ''}`}
                        id="password"
                        {...register('password', {
                          required: 'Password is required',
                          minLength: {
                            value: 6,
                            message: 'Password must be at least 6 characters'
                          }
                        })}
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        className="btn btn-link position-absolute end-0 top-50 translate-middle-y p-0 me-2 password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <i className={`bi bi-${showPassword ? 'eye' : 'eye-slash'}`}></i>
                      </button>
                    </div>
                    {errors.password && (
                      <div className="invalid-feedback">
                        {errors.password.message}
                      </div>
                    )}
                  </div>

                  <div className="mb-3 text-end">
                    <Link to="/forgot-password" className="text-primary text-decoration-none">
                      Forgot Password?
                    </Link>
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
                          Signing In...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </button>
                  </div>
                </form>

                <div className="text-center">
                  <p className="mb-0">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-primary text-decoration-none fw-semibold">
                      Sign up for free
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

            {/* Features reminder */}
            <div className="text-center mt-4">
              <div className="row g-3">
                <div className="col-4">
                  <div className="text-center">
                    <i className="bi bi-shield-check text-success fs-4"></i>
                    <p className="small text-muted mb-0 mt-1">Secure</p>
                  </div>
                </div>
                <div className="col-4">
                  <div className="text-center">
                    <i className="bi bi-lightning text-warning fs-4"></i>
                    <p className="small text-muted mb-0 mt-1">Fast</p>
                  </div>
                </div>
                <div className="col-4">
                  <div className="text-center">
                    <i className="bi bi-graph-up text-info fs-4"></i>
                    <p className="small text-muted mb-0 mt-1">Accurate</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

