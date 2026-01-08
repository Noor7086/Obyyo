import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/logo.png';

const AdminNavbar: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleSidebar = () => {
    const event = new CustomEvent('toggleSidebar');
    window.dispatchEvent(event);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
              <a
                className="nav-link dropdown-toggle d-flex align-items-center px-2 px-md-3 py-2 text-dark"
                href="#"
                id="adminDropdown"
                role="button"
                onClick={(e) => {
                  e.preventDefault();
                  setIsDropdownOpen(!isDropdownOpen);
                }}
                aria-expanded={isDropdownOpen}
                style={{ margin: 0, lineHeight: 1, textDecoration: 'none' }}
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
              </a>
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
                  <a 
                    className="dropdown-item d-flex align-items-center py-2 px-3" 
                    href="/"
                    onClick={(e) => {
                      e.preventDefault();
                      handleLogout();
                    }}
                    style={{ 
                      borderRadius: '8px',
                      margin: '4px 8px',
                      transition: 'all 0.3s ease'
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
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;