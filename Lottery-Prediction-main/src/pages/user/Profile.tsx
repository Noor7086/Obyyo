import React, { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Container, Row, Col, Card, Form, Button, Alert, Badge } from 'react-bootstrap';
import toast from 'react-hot-toast';

const Profile: React.FC = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    selectedLottery: user?.selectedLottery || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [passwordErrors, setPasswordErrors] = useState<{ [key: string]: string }>({});
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(() => {
    // Initialize from sessionStorage if it exists
    return sessionStorage.getItem('currentPasswordError');
  });
  const passwordErrorRef = useRef<string | null>(sessionStorage.getItem('currentPasswordError'));

  // Update formData when user changes (but only if not editing)
  useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        selectedLottery: user.selectedLottery || ''
      });
    }
  }, [user, isEditing]);

  // Restore password error if needed (after React Strict Mode clears it)
  useEffect(() => {
    // If we have a currentPasswordError state but passwordErrors doesn't, restore it
    if (currentPasswordError && !passwordErrors.currentPassword) {
      flushSync(() => {
        setPasswordErrors(prev => ({ ...prev, currentPassword: currentPasswordError }));
      });
    }
    // If we have a ref error but state doesn't have it, restore it
    else if (passwordErrorRef.current && !passwordErrors.currentPassword && !currentPasswordError) {
      flushSync(() => {
        setCurrentPasswordError(passwordErrorRef.current!);
        setPasswordErrors(prev => ({ ...prev, currentPassword: passwordErrorRef.current! }));
      });
    }
    // Check sessionStorage as well
    else {
      const sessionError = sessionStorage.getItem('currentPasswordError');
      if (sessionError && !passwordErrors.currentPassword && !currentPasswordError) {
        flushSync(() => {
          setCurrentPasswordError(sessionError);
          setPasswordErrors(prev => ({ ...prev, currentPassword: sessionError }));
          passwordErrorRef.current = sessionError;
        });
      }
    }
  }, [passwordErrors, currentPasswordError]);
  
  // Clear ref when password is successfully changed
  useEffect(() => {
    if (message?.type === 'success' && message.text.includes('Password updated')) {
      passwordErrorRef.current = null;
    }
  }, [message]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validate firstName
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    } else if (formData.firstName.trim().length > 50) {
      newErrors.firstName = 'First name cannot exceed 50 characters';
    }

    // Validate lastName
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    } else if (formData.lastName.trim().length > 50) {
      newErrors.lastName = 'Last name cannot exceed 50 characters';
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate phone
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Validate selectedLottery
    const validLotteries = ['gopher5', 'pick3', 'lottoamerica', 'megamillion', 'powerball'];
    if (!formData.selectedLottery) {
      newErrors.selectedLottery = 'Please select a preferred lottery';
    } else if (!validLotteries.includes(formData.selectedLottery)) {
      newErrors.selectedLottery = 'Please select a valid lottery type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedPasswordData = {
      ...passwordData,
      [name]: value
    };
    setPasswordData(updatedPasswordData);
    
    // Clear error for this field when user starts typing (except keep current password error until they fix it)
    if (passwordErrors[name] && name !== 'currentPassword') {
      setPasswordErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    // For current password, only clear the error if they've typed something AND it's not the "incorrect" error
    // Keep the "incorrect" error until they successfully change the password
    if (name === 'currentPassword' && value) {
      // Only clear if it's not the server error about incorrect password
      const sessionError = sessionStorage.getItem('currentPasswordError');
      if (sessionError && !sessionError.includes('incorrect')) {
        sessionStorage.removeItem('currentPasswordError');
      }
      if (currentPasswordError && !currentPasswordError.includes('incorrect')) {
        setCurrentPasswordError(null);
        setPasswordErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.currentPassword;
          return newErrors;
        });
      } else if (passwordErrors.currentPassword && !passwordErrors.currentPassword.includes('incorrect')) {
        setPasswordErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.currentPassword;
          return newErrors;
        });
      }
    }
    
    // Clear validation errors for the field being edited (except current password incorrect error)
    if (name === 'newPassword' || name === 'confirmPassword') {
      setPasswordErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        // Preserve currentPassword error if it exists
        return newErrors;
      });
    }
  };

  const validatePasswordForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validate current password
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    // Validate new password
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters long';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Validate confirm password
    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.confirmPassword !== passwordData.newPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Preserve any existing currentPassword error from server (like "incorrect password")
    setPasswordErrors(prev => {
      const updated = { ...newErrors };
      // If there's a server-set currentPassword error, keep it instead of overwriting
      if (prev.currentPassword && prev.currentPassword.includes('incorrect')) {
        updated.currentPassword = prev.currentPassword;
      }
      return updated;
    });
    return Object.keys(newErrors).length === 0;
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validate form before submitting
    if (!validateForm()) {
      setLoading(false);
      setMessage({ type: 'error', text: 'Please fix the errors in the form before submitting.' });
      return;
    }

    try {
      const updateData = { ...formData, notificationsEnabled: true };
      await updateProfile(updateData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      setErrors({}); // Clear errors on success
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update profile. Please try again.';
      setMessage({ type: 'error', text: errorMessage });
      
      // If error is about email, set email error
      if (errorMessage.toLowerCase().includes('email')) {
        setErrors(prev => ({ ...prev, email: errorMessage }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    console.log('handlePasswordUpdate called');
    
    setLoading(true);
    setMessage(null);
    // Don't clear passwordErrors here - preserve any existing errors

    // Validate form before submitting (but preserve server errors)
    const hasValidationErrors = !validatePasswordForm();
    if (hasValidationErrors) {
      setLoading(false);
      setMessage({ type: 'error', text: 'Please fix the errors in the form before submitting.' });
      return;
    }

    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      });
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      toast.success('Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({}); // Clear errors on success
      setCurrentPasswordError(null); // Clear dedicated error state
      passwordErrorRef.current = null; // Clear ref on success
      sessionStorage.removeItem('currentPasswordError'); // Clear sessionStorage
    } catch (error: any) {
      // Extract error message from various possible locations
      let errorMessage = 'Failed to update password. Please try again.';
      
      // Try multiple ways to extract the error message
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      // Convert to lowercase for comparison
      const lowerErrorMessage = errorMessage.toLowerCase();
      
      // Check if error is about current password - be very permissive
      // Check for any mention of "current", "password", "incorrect", "wrong", "invalid"
      const isCurrentPasswordError = 
        (lowerErrorMessage.includes('current') && lowerErrorMessage.includes('password')) ||
        (lowerErrorMessage.includes('password') && (lowerErrorMessage.includes('incorrect') || lowerErrorMessage.includes('wrong') || lowerErrorMessage.includes('invalid'))) ||
        lowerErrorMessage.includes('current password') ||
        lowerErrorMessage.includes('password is incorrect') ||
        lowerErrorMessage.includes('incorrect password');
      
      // Always set the error for current password field if it's a password-related error
      if (isCurrentPasswordError) {
        const errorText = 'Current password is incorrect';
        
        // Store in sessionStorage to persist across React Strict Mode resets
        sessionStorage.setItem('currentPasswordError', errorText);
        
        // Store in multiple places to ensure persistence
        passwordErrorRef.current = errorText;
        
        // Set state multiple times to ensure it sticks
        setCurrentPasswordError(errorText);
        setPasswordErrors({ currentPassword: errorText });
        
        // Use flushSync to force immediate synchronous state update
        flushSync(() => {
          setCurrentPasswordError(errorText);
          setPasswordErrors({ currentPassword: errorText });
        });
        
        // Set again after a microtask to ensure it persists
        Promise.resolve().then(() => {
          setCurrentPasswordError(errorText);
          setPasswordErrors({ currentPassword: errorText });
          passwordErrorRef.current = errorText;
          sessionStorage.setItem('currentPasswordError', errorText);
        });
        
        // Also set the message
        setMessage({ type: 'error', text: errorText + '. Please try again.' });
      } else {
        // For other errors, show them in the message
        setMessage({ type: 'error', text: errorMessage });
        
        // If error message contains "password" at all, also show it on current password field
        if (lowerErrorMessage.includes('password')) {
          setPasswordErrors(prev => ({ ...prev, currentPassword: errorMessage }));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const lotteryTypes = [
    { value: 'gopher5', label: 'Gopher 5' },
    { value: 'pick3', label: 'Pick 3' },
    { value: 'lottoamerica', label: 'Lotto America' },
    { value: 'megamillion', label: 'Mega Million' },
    { value: 'powerball', label: 'Powerball' }
  ];

  return (
    <Container className="py-4" style={{ marginTop: '4rem' }}>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="display-5 fw-bold gradient-text mb-2">Profile Settings</h1>
              <p className="text-muted">Manage your account information and preferences</p>
            </div>
            <div className="d-flex align-items-center">
              <div className="avatar bg-gradient-primary text-white rounded-circle me-3 d-flex align-items-center justify-content-center" 
                   style={{ width: '60px', height: '60px' }}>
                <span className="fw-bold fs-4">{user?.firstName?.charAt(0)}</span>
              </div>
              <div>
                <h5 className="mb-1">{user?.firstName} {user?.lastName}</h5>
                <Badge bg={user?.isInTrial ? 'success' : 'primary'} className="small">
                  {user?.isInTrial ? 'Trial User' : 'Premium User'}
                </Badge>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {message && (
        <Alert variant={message.type === 'success' ? 'success' : 'danger'} className="mb-4">
          <i className={`bi bi-${message.type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2`}></i>
          {message.text}
        </Alert>
      )}

      <Row>
        {/* Profile Information */}
        <Col lg={8}>
          <Card className="border-0 shadow-custom-md mb-4">
            <Card.Header className="bg-white border-0 py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-person me-2 text-primary"></i>
                  Personal Information
                </h5>
                <Button
                  variant={isEditing ? 'outline-secondary' : 'outline-primary'}
                  size="sm"
                  onClick={() => {
                    setIsEditing(!isEditing);
                    if (isEditing) {
                      // Reset form data and errors when canceling
                      setFormData({
                        firstName: user?.firstName || '',
                        lastName: user?.lastName || '',
                        email: user?.email || '',
                        phone: user?.phone || '',
                        selectedLottery: user?.selectedLottery || ''
                      });
                      setErrors({});
                      setMessage(null);
                    }
                  }}
                >
                  <i className={`bi bi-${isEditing ? 'x' : 'pencil'} me-1`}></i>
                  {isEditing ? 'Cancel' : 'Edit'}
                </Button>
              </div>
            </Card.Header>
            <Card.Body className="p-4">
              <Form onSubmit={handleProfileUpdate}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium">First Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`border-0 bg-light ${errors.firstName ? 'is-invalid' : ''}`}
                        required
                      />
                      {errors.firstName && (
                        <Form.Control.Feedback type="invalid" className="d-block">
                          {errors.firstName}
                        </Form.Control.Feedback>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium">Last Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`border-0 bg-light ${errors.lastName ? 'is-invalid' : ''}`}
                        required
                      />
                      {errors.lastName && (
                        <Form.Control.Feedback type="invalid" className="d-block">
                          {errors.lastName}
                        </Form.Control.Feedback>
                      )}
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium">Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`border-0 bg-light ${errors.email ? 'is-invalid' : ''}`}
                        required
                      />
                      {errors.email && (
                        <Form.Control.Feedback type="invalid" className="d-block">
                          {errors.email}
                        </Form.Control.Feedback>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium">Phone Number</Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`border-0 bg-light ${errors.phone ? 'is-invalid' : ''}`}
                        required
                      />
                      {errors.phone && (
                        <Form.Control.Feedback type="invalid" className="d-block">
                          {errors.phone}
                        </Form.Control.Feedback>
                      )}
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-medium">Preferred Lottery</Form.Label>
                  <Form.Select
                    name="selectedLottery"
                    value={formData.selectedLottery}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`border-0 bg-light ${errors.selectedLottery ? 'is-invalid' : ''}`}
                    required
                  >
                    <option value="">Select a lottery</option>
                    {lotteryTypes.map((lottery) => (
                      <option key={lottery.value} value={lottery.value}>
                        {lottery.label}
                      </option>
                    ))}
                  </Form.Select>
                  {errors.selectedLottery && (
                    <Form.Control.Feedback type="invalid" className="d-block">
                      {errors.selectedLottery}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
                {isEditing && (
                  <div className="d-flex gap-2">
                    <Button type="submit" variant="primary" disabled={loading}>
                      <i className="bi bi-check me-1"></i>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline-secondary" 
                      onClick={() => {
                        setIsEditing(false);
                        // Reset form data and errors when canceling
                        setFormData({
                          firstName: user?.firstName || '',
                          lastName: user?.lastName || '',
                          email: user?.email || '',
                          phone: user?.phone || '',
                          selectedLottery: user?.selectedLottery || ''
                        });
                        setErrors({});
                        setMessage(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </Form>
            </Card.Body>
          </Card>

          {/* Change Password */}
          <Card className="border-0 shadow-custom-md">
            <Card.Header className="bg-white border-0 py-3">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-shield-lock me-2 text-primary"></i>
                Change Password
              </h5>
            </Card.Header>
            <Card.Body className="p-4">
              <Form onSubmit={handlePasswordUpdate} noValidate>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Current Password</Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type={showPasswords.currentPassword ? "text" : "password"}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      isInvalid={!!(passwordErrors.currentPassword || currentPasswordError || passwordErrorRef.current || sessionStorage.getItem('currentPasswordError'))}
                      className="border-0 bg-light pe-5"
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-link position-absolute end-0 top-50 translate-middle-y p-0 me-2 password-toggle-btn"
                      onClick={() => togglePasswordVisibility('currentPassword')}
                    >
                      <i className={`bi bi-${showPasswords.currentPassword ? 'eye' : 'eye-slash'}`}></i>
                    </button>
                  </div>
                  {(() => {
                    // Check all possible sources including sessionStorage
                    const sessionError = sessionStorage.getItem('currentPasswordError');
                    const hasError = !!(passwordErrors.currentPassword || currentPasswordError || passwordErrorRef.current || sessionError);
                    const errorMsg = passwordErrors.currentPassword || currentPasswordError || passwordErrorRef.current || sessionError;
                    
                    if (hasError && errorMsg) {
                      return (
                        <div 
                          className="invalid-feedback d-block" 
                          style={{ 
                            display: 'block !important', 
                            color: '#dc3545', 
                            fontSize: '0.875rem', 
                            marginTop: '0.25rem',
                            width: '100%'
                          }}
                        >
                          {errorMsg}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </Form.Group>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium">New Password</Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type={showPasswords.newPassword ? "text" : "password"}
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className={`border-0 bg-light pe-5 ${passwordErrors.newPassword ? 'is-invalid' : ''}`}
                          required
                        />
                        <button
                          type="button"
                          className="btn btn-link position-absolute end-0 top-50 translate-middle-y p-0 me-2 password-toggle-btn"
                          onClick={() => togglePasswordVisibility('newPassword')}
                        >
                          <i className={`bi bi-${showPasswords.newPassword ? 'eye' : 'eye-slash'}`}></i>
                        </button>
                      </div>
                      {passwordErrors.newPassword && (
                        <Form.Control.Feedback type="invalid" className="d-block">
                          {passwordErrors.newPassword}
                        </Form.Control.Feedback>
                      )}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium">Confirm New Password</Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type={showPasswords.confirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className={`border-0 bg-light pe-5 ${passwordErrors.confirmPassword ? 'is-invalid' : ''}`}
                          required
                        />
                        <button
                          type="button"
                          className="btn btn-link position-absolute end-0 top-50 translate-middle-y p-0 me-2 password-toggle-btn"
                          onClick={() => togglePasswordVisibility('confirmPassword')}
                        >
                          <i className={`bi bi-${showPasswords.confirmPassword ? 'eye' : 'eye-slash'}`}></i>
                        </button>
                      </div>
                      {passwordErrors.confirmPassword && (
                        <Form.Control.Feedback type="invalid" className="d-block">
                          {passwordErrors.confirmPassword}
                        </Form.Control.Feedback>
                      )}
                    </Form.Group>
                  </Col>
                </Row>
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={loading}
                >
                  <i className="bi bi-key me-1"></i>
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Account Summary */}
        <Col lg={4}>
          <Card className="border-0 shadow-custom-md mb-4">
            <Card.Header className="bg-white border-0 py-3">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-info-circle me-2 text-primary"></i>
                Account Summary
              </h5>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="mb-3">
                <small className="text-muted">Account Status</small>
                <div className="d-flex align-items-center mt-1">
                  <Badge bg={user?.isInTrial ? 'success' : 'primary'} className="me-2">
                    {user?.isInTrial ? 'Trial' : 'Active'}
                  </Badge>
                  <span className="small text-muted">
                    {user?.isInTrial ? 'Free trial active' : 'Premium subscription'}
                  </span>
                </div>
              </div>
              <div className="mb-3">
                <small className="text-muted">Member Since</small>
                <div className="fw-medium">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : (user?.trialStartDate ? new Date(user.trialStartDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 'N/A')}
                </div>
              </div>
              <div className="mb-3">
                <small className="text-muted">Role</small>
                <div className="d-flex align-items-center mt-1">
                  <Badge bg={user?.role === 'admin' ? 'danger' : 'secondary'} className="me-2">
                    {user?.role === 'admin' ? 'Admin' : 'User'}
                  </Badge>
                </div>
              </div>
              <div className="mb-3">
                <small className="text-muted">Preferred Lottery</small>
                <div className="fw-medium">
                  {formData.selectedLottery ? 
                    lotteryTypes.find(l => l.value === formData.selectedLottery)?.label || 'Not selected' 
                    : 'Not selected'
                  }
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 shadow-custom-md">
            <Card.Header className="bg-white border-0 py-3">
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-lightning me-2 text-primary"></i>
                Quick Actions
              </h5>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="d-grid gap-2">
                <Button variant="outline-primary" size="sm">
                  <i className="bi bi-download me-2"></i>
                  Download Predictions
                </Button>
                <Button variant="outline-success" size="sm">
                  <i className="bi bi-bell me-2"></i>
                  Notification Settings
                </Button>
                <Button variant="outline-info" size="sm">
                  <i className="bi bi-question-circle me-2"></i>
                  Help & Support
                </Button>
                <Button variant="outline-danger" size="sm">
                  <i className="bi bi-trash me-2"></i>
                  Delete Account
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;

