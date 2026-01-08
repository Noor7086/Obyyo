import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import logo from '../../assets/logo.png';

const VerifyOTP: React.FC = () => {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resendDisabled, setResendDisabled] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    const navigate = useNavigate();

    // Effect for resend timer
    React.useEffect(() => {
        let interval: any;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        } else {
            setResendDisabled(false);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const response = await apiService.post<any>('/auth/verify-otp', { otp });
            if (response.success) {
                // Refresh user or navigate
                // If the context doesn't auto-update, we might need to force a refresh if possible
                // For now, redirect to dashboard
                toast.success('You have registered successfully');
                navigate('/dashboard', { replace: true });
                // Optional: Trigger a window reload if necessary to update Auth Context IsPhoneVerified state immediately
                // window.location.href = '/dashboard'; 
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Verification failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResend = async () => {
        setResendDisabled(true);
        setResendTimer(60); // 60 seconds cooldown
        setError('');

        try {
            await apiService.post('/auth/resend-otp');
            // Success message could be shown
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to resend OTP.');
            setResendDisabled(false);
            setResendTimer(0);
        }
    };

    return (
        <div className="min-vh-100 d-flex align-items-center bg-light py-5">
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
                                    <h3 className="mt-3">Verify Your Phone</h3>
                                    <p className="text-muted">
                                        We sent a verification code to your phone number.
                                        Please enter it below.
                                    </p>
                                </div>

                                {error && (
                                    <div className="alert alert-danger" role="alert">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label htmlFor="otp" className="form-label text-muted small text-uppercase fw-bold">Verification Code</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-lg text-center letter-spacing-2"
                                            id="otp"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            placeholder="XXXXXX"
                                            maxLength={6}
                                            required
                                            style={{ letterSpacing: '0.5rem', fontSize: '1.5rem' }}
                                        />
                                    </div>

                                    <div className="d-grid mb-4">
                                        <button
                                            type="submit"
                                            className="btn btn-primary btn-lg"
                                            disabled={isSubmitting || otp.length < 6}
                                        >
                                            {isSubmitting ? 'Verifying...' : 'Verify & Continue'}
                                        </button>
                                    </div>
                                </form>

                                <div className="text-center">
                                    <p className="mb-0 text-muted">
                                        Didn't receive the code?{' '}
                                        <button
                                            onClick={handleResend}
                                            disabled={resendDisabled}
                                            className="btn btn-link p-0 text-decoration-none"
                                            style={{ verticalAlign: 'baseline' }}
                                        >
                                            {resendDisabled ? `Resend in ${resendTimer}s` : 'Resend Code'}
                                        </button>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyOTP;
