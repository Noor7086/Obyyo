import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import logo from '../../assets/logo.png';

const AdminNavbar: React.FC = () => {
  const navigate = useNavigate();
  const { logout, changePassword } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSidebar = () => {
    const event = new CustomEvent('toggleSidebar');
    window.dispatchEvent(event);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePasswordChange = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }
    if (!passwordRegex.test(newPassword)) {
      setError('New password must contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword
      });
      toast.success('Password updated successfully!');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update password';
      console.error('Password change error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const errorLower = error?.toLowerCase() || '';
  const isCurrentError = !!error && (errorLower.includes('current') || errorLower.includes('incorrect'));
  const isNewError = !!error && errorLower.includes('new');
  const isMatchError = !!error && errorLower.includes('match');
  const isOtherError = !!error && !isCurrentError && !isNewError && !isMatchError;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const dropdown = target.closest('.dropdown');
      if (dropdown === null) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <nav
      className="navbar navbar-expand-lg navbar-light bg-white shadow-sm admin-navbar"
      style={{
        background: '#ffffff',
        borderBottom: '1px solid rgba(0,0,0,0.1)',
        margin: 0,
        padding: 0,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        height: '60px'
      }}
    >
      <div className="container-fluid px-2 px-md-3">
        <div className="d-flex align-items-center justify-content-between w-100" style={{ height: '60px' }}>
          {/* Left Side - Toggle & Logo */}
          <div className="d-flex align-items-center">
            {/* Sidebar Toggle Button - Visible on all screens */}
            <button
              className="btn btn-link text-dark d-admin-desktop-toggle me-2 sidebar-toggle-btn p-2"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
              style={{ margin: 0, lineHeight: 1, textDecoration: 'none' }}
            >
              <i className="bi bi-list" style={{ fontSize: '1.25rem' }}></i>
            </button>

            {/* Logo */}
            <Link
              className="navbar-brand d-flex align-items-center m-0"
              to="/admin"
              style={{ lineHeight: 1, textDecoration: 'none' }}
            >
              <img
                src={logo}
                alt="Obyyo Logo"
                className="me-2"
                style={{
                  height: '55px',
                  width: 'auto',
                  objectFit: 'contain',
                  filter: 'brightness(0)',
                  transition: 'filter 0.3s ease'
                }}
              />
            </Link>
          </div>

          {/* Right Side - User Menu */}
          <div className="d-flex align-items-center">
            {/* User Menu Dropdown - All Screens */}
            <div className="nav-item dropdown">
              <span
                className="nav-link dropdown-toggle d-flex align-items-center px-2 px-md-3 py-2 text-dark"
                id="adminDropdown"
                style={{ cursor: 'pointer' }}
                role="button"
                onClick={(e) => {
                  e.preventDefault();
                  setIsDropdownOpen(!isDropdownOpen);
                }}
                aria-expanded={isDropdownOpen}
              >
                <div
                  className="me-2 d-flex align-items-center justify-content-center"
                  style={{
                    width: '32px',
                    height: '32px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '8px',
                    flexShrink: 0
                  }}
                >
                  <i className="bi bi-person-circle text-white" style={{ fontSize: '1rem' }}></i>
                </div>
                <span className="d-none d-sm-inline">Admin</span>
              </span>
              <ul
                className={`dropdown-menu dropdown-menu-end shadow-lg border-0 ${isDropdownOpen ? 'show' : ''}`}
                aria-labelledby="adminDropdown"
                style={{
                  borderRadius: '12px',
                  background: '#ffffff',
                  border: '1px solid rgba(0,0,0,0.1)',
                  marginTop: '8px',
                  minWidth: '200px',
                  maxWidth: 'calc(100vw - 2rem)',
                  right: 0,
                  left: 'auto'
                }}
              >
                <li>
                  <div className="dropdown-header text-muted fw-bold px-3 py-2">
                    <i className="bi bi-person-circle me-2"></i>
                    Admin Account
                  </div>
                </li>
                <li><hr className="dropdown-divider my-1" /></li>
                <li>
                  <button
                    className="dropdown-item d-flex align-items-center py-2 px-3"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setError(null);
                      setShowPasswordModal(true);
                    }}
                    style={{
                      borderRadius: '8px',
                      margin: '4px 8px',
                      transition: 'all 0.3s ease',
                      border: 'none',
                      background: 'transparent',
                      width: 'calc(100% - 16px)',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                      e.currentTarget.style.color = '#667eea';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '';
                    }}
                  >
                    <i className="bi bi-shield-lock me-2"></i>
                    Change Password
                  </button>
                </li>
                <li><hr className="dropdown-divider my-1" /></li>
                <li>
                  <button
                    type="button"
                    className="dropdown-item d-flex align-items-center py-2 px-3"
                    onClick={(e) => {
                      e.preventDefault();
                      handleLogout();
                    }}
                    style={{
                      borderRadius: '8px',
                      margin: '4px 8px',
                      transition: 'all 0.3s ease',
                      border: 'none',
                      background: 'transparent',
                      width: 'calc(100% - 16px)',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(220, 53, 69, 0.1)';
                      e.currentTarget.style.color = '#dc3545';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '';
                    }}
                  >
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && createPortal(
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '15px', overflow: 'hidden' }}>
              <div className="modal-header border-0 pb-0 pt-4 px-4">
                <h5 className="modal-title fw-bold">Change Admin Password</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowPasswordModal(false)}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted text-uppercase">Current Password</label>
                  <input
                    type="password"
                    className={`form-control ${isCurrentError ? 'is-invalid' : ''}`}
                    value={passwordData.currentPassword}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, currentPassword: e.target.value });
                      if (isCurrentError) setError(null);
                    }}
                    placeholder="Enter current password"
                    style={{
                      borderRadius: '10px',
                      padding: '0.6rem 1rem',
                      border: isCurrentError ? '2px solid #dc3545' : '1px solid #ced4da'
                    }}
                  />
                  {isCurrentError && (
                    <div className="mt-1" style={{ color: '#dc3545', fontSize: '0.85rem' }}>
                      <i className="bi bi-exclamation-circle me-1"></i>
                      {error}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-muted text-uppercase">New Password</label>
                  <input
                    type="password"
                    className={`form-control ${isNewError ? 'is-invalid' : ''}`}
                    value={passwordData.newPassword}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, newPassword: e.target.value });
                      if (isNewError) setError(null);
                    }}
                    placeholder="Minimum 6 characters"
                    style={{
                      borderRadius: '10px',
                      padding: '0.6rem 1rem',
                      border: isNewError ? '2px solid #dc3545' : '1px solid #ced4da'
                    }}
                  />
                  {isNewError && (
                    <div className="mt-1" style={{ color: '#dc3545', fontSize: '0.85rem' }}>
                      <i className="bi bi-exclamation-circle me-1"></i>
                      {error}
                    </div>
                  )}
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-bold text-muted text-uppercase">Confirm New Password</label>
                  <input
                    type="password"
                    className={`form-control ${isMatchError ? 'is-invalid' : ''}`}
                    value={passwordData.confirmPassword}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value });
                      if (isMatchError) setError(null);
                    }}
                    placeholder="Repeat new password"
                    style={{
                      borderRadius: '10px',
                      padding: '0.6rem 1rem',
                      border: isMatchError ? '2px solid #dc3545' : '1px solid #ced4da'
                    }}
                  />
                  {isMatchError && (
                    <div className="mt-1" style={{ color: '#dc3545', fontSize: '0.85rem' }}>
                      <i className="bi bi-exclamation-circle me-1"></i>
                      {error}
                    </div>
                  )}
                </div>

                {isOtherError && (
                  <div className="alert alert-danger py-2 small mb-3">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                  </div>
                )}

                <div className="d-grid">
                  <button
                    type="button"
                    className="btn btn-primary py-2 fw-bold"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePasswordChange();
                    }}
                    disabled={loading}
                    style={{
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                    }}
                  >
                    {loading ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    ) : null}
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </nav>
  );
};

export default AdminNavbar;