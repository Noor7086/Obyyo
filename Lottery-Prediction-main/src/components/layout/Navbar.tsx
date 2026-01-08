import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LotteryType } from '../../types';
import { walletService } from '../../services/walletService';
import logo from '../../assets/logo.png';

const Navbar: React.FC = () => {
  const { user, logout, canStartTrial, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPredictionsOpen, setIsPredictionsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  // Check if we're on the homepage
  const isHomePage = location.pathname === '/';

  // Show logged-in state based on user
  const showLoggedInState = !!user;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown')) {
        setIsPredictionsOpen(false);
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Close mobile menu when clicking on nav links
  const closeMobileMenu = () => {
    setIsMenuOpen(false);
    setIsPredictionsOpen(false);
    setIsUserMenuOpen(false);
  };

  // Fetch wallet balance
  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (user) {
        try {
          const stats = await walletService.getWalletStats();
          setWalletBalance(stats.currentBalance);
        } catch (error) {
          console.error('Error fetching wallet balance:', error);
          // Fallback to user wallet balance if API fails
          setWalletBalance(user.walletBalance);
        }
      }
    };

    fetchWalletBalance();

    // Listen for wallet balance updates from wallet page
    const handleWalletUpdate = () => {
      fetchWalletBalance();
    };

    window.addEventListener('walletBalanceUpdated', handleWalletUpdate);

    // Refresh wallet balance periodically (every 30 seconds)
    const interval = setInterval(fetchWalletBalance, 30000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('walletBalanceUpdated', handleWalletUpdate);
    };
  }, [user]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const scrolled = scrollTop > 50;
      setIsScrolled(scrolled);
    };

    // Set initial state
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    closeMobileMenu();
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSmoothScroll = (sectionId: string) => {
    // If we're not on the home page, navigate to home first
    if (location.pathname !== '/') {
      navigate('/');
      // Wait for navigation to complete, then scroll
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      // We're already on home page, just scroll
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    closeMobileMenu();
  };

  const lotteryTypes: { type: LotteryType; name: string }[] = [
    { type: 'gopher5', name: 'Gopher 5' },
    { type: 'pick3', name: 'Pick 3' },
    { type: 'lottoamerica', name: 'Lotto America' },
    { type: 'megamillion', name: 'Mega Million' },
    { type: 'powerball', name: 'Powerball' }
  ];

  // Hide navbar completely during auth initialization
  if (loading) {
    return null;
  }

  return (
    <nav className={`navbar navbar-expand-xl fixed-top ${isScrolled ? 'navbar-light bg-white shadow-sm' : (isHomePage ? 'navbar-dark' : 'navbar-light bg-white shadow-sm')}`}
      style={!isScrolled && isHomePage ? {
        backgroundColor: 'transparent',
        background: 'transparent',
        borderBottom: 'none',
        zIndex: 1050,
        top: 0,
        left: 0,
        right: 0,
        padding: 0,
        margin: 0,
        position: 'fixed'
      } : {
        overflow: 'hidden',
        minHeight: 'auto',
        maxHeight: 'none',
        zIndex: 1050,
        top: 0,
        left: 0,
        right: 0,
        padding: 0,
        margin: 0,
        position: 'fixed'
      }}>
      <style>{`
        /* Desktop Navbar - Only for screens 1200px and above */
        @media (min-width: 1200px) {
          /* Hide hamburger menu on desktop */
          .navbar-toggler {
            display: none !important;
          }
          
          /* Right section alignment */
          .navbar-nav.ms-auto {
            margin-left: auto !important;
            display: flex !important;
            align-items: center !important;
            gap: 0.5rem !important;
            flex-direction: row !important;
          }
          
          .navbar-nav.ms-auto .nav-item {
            display: flex !important;
            align-items: center !important;
          }
          
          .navbar-nav.ms-auto .nav-link {
            display: flex !important;
            align-items: center !important;
            white-space: nowrap !important;
          }
          
          /* Dropdown container positioning */
          .navbar-nav .dropdown {
            position: relative !important;
          }
          
          .navbar-nav .dropdown .dropdown-menu {
            position: absolute !important;
            top: 100% !important;
            left: 0 !important;
            z-index: 1100 !important;
            display: none !important;
            float: left !important;
            min-width: 10rem !important;
            padding: 0.5rem 0 !important;
            margin: 0.125rem 0 0 !important;
            font-size: 1rem !important;
            color: #212529 !important;
            text-align: left !important;
            list-style: none !important;
            background-color: #fff !important;
            background-clip: padding-box !important;
            border: 1px solid rgba(0,0,0,.15) !important;
            border-radius: 0.375rem !important;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15), 0 4px 20px rgba(0, 0, 0, 0.1) !important;
          }
          
          .navbar-nav .dropdown .dropdown-menu.show {
            display: block !important;
            animation: fadeInDown 0.3s ease-in-out !important;
          }
          
          .navbar-nav .dropdown-menu-end {
            right: 0 !important;
            left: auto !important;
          }
          
          /* User dropdown menu specific styling */
          .navbar-nav.ms-auto .dropdown .dropdown-menu {
            z-index: 1100 !important;
            position: absolute !important;
            right: 0 !important;
            left: auto !important;
          }
          
          .navbar-nav .nav-link {
            position: relative;
            transition: all 0.3s ease;
          }
          
          .navbar-nav .nav-link:hover {
            transform: translateY(-1px);
          }
          
          .navbar-nav .dropdown-toggle::after {
            transition: transform 0.3s ease;
          }
          
          .navbar-nav .dropdown.show .dropdown-toggle::after {
            transform: rotate(180deg);
          }
        }
        
        /* Mobile Navbar - For ALL screens below 1200px (including 991px, 1199px, etc.) */
        @media (max-width: 1199px) {
          .navbar-collapse {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            z-index: 99999 !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
            padding: 2rem !important;
            transform: translateX(-100%) !important;
            transition: transform 0.3s ease-in-out !important;
            margin: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
            pointer-events: auto !important;
            isolation: isolate !important;
          }
          
          .navbar-collapse.show {
            transform: translateX(0) !important;
          }
          
          .navbar-nav {
            flex-direction: column !important;
            width: 100% !important;
            max-width: 400px !important;
            gap: 1rem !important;
          }
          
          /* Right section in mobile menu */
          .navbar-nav.ms-auto {
            margin-left: 0 !important;
            width: 100% !important;
            max-width: 400px !important;
            flex-direction: column !important;
            align-items: stretch !important;
          }
          
          .navbar-nav .nav-link {
            color: white !important;
            padding: 1rem 1.5rem !important;
            border-radius: 12px !important;
            background: rgba(255, 255, 255, 0.1) !important;
            backdrop-filter: blur(10px) !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            text-align: center !important;
            font-size: 1.1rem !important;
            font-weight: 500 !important;
            transition: all 0.3s ease !important;
            display: flex !important;
            width: 100% !important;
            border-bottom: none !important;
            justify-content: center !important;
          }
          
          /* Wallet link in mobile */
          .navbar-nav.ms-auto .nav-link {
            justify-content: center !important;
            align-items: center !important;
          }
          
          /* User dropdown in mobile */
          .navbar-nav.ms-auto .nav-item.dropdown .nav-link {
            justify-content: center !important;
            align-items: center !important;
          }
          
          /* Remove margin-top from mobile menu items */
          .navbar-nav.ms-auto .nav-item {
            margin-top: 0 !important;
          }
          
          /* Ensure wallet badge is visible in mobile */
          .navbar-nav.ms-auto .nav-link .badge {
            display: inline-block !important;
          }
          
          .navbar-nav .nav-link:hover {
            background: rgba(255, 255, 255, 0.2) !important;
            transform: translateY(-2px) !important;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2) !important;
          }
          
          .navbar-nav .nav-link:last-child {
            border-bottom: none !important;
          }
          
          /* Mobile close button styling */
          .mobile-close-btn {
            position: absolute !important;
            top: 2rem !important;
            right: 2rem !important;
            color: white !important;
            font-size: 2rem !important;
            cursor: pointer !important;
            z-index: 100000 !important;
            background: rgba(255, 255, 255, 0.1) !important;
            width: 50px !important;
            height: 50px !important;
            border-radius: 50% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            backdrop-filter: blur(10px) !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            transition: all 0.3s ease !important;
          }
          
          .mobile-close-btn:hover {
            background: rgba(255, 255, 255, 0.2) !important;
            transform: scale(1.1) !important;
          }
          
          .navbar-nav .dropdown .dropdown-menu {
            position: static !important;
            float: none !important;
            width: 100% !important;
            margin-top: 0.5rem !important;
            background-color: rgba(255, 255, 255, 0.15) !important;
            backdrop-filter: blur(10px) !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin-bottom: 0.5rem !important;
            min-width: auto !important;
            border-radius: 12px !important;
            max-height: 0 !important;
            overflow: hidden !important;
            opacity: 0 !important;
            transform: translateY(-15px) !important;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
            visibility: hidden !important;
          }
          
          .navbar-nav .dropdown .dropdown-menu.show {
            max-height: 500px !important;
            opacity: 1 !important;
            transform: translateY(0) !important;
            visibility: visible !important;
            padding: 0.5rem !important;
            animation: slideDownFadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
          
          /* User dropdown menu in mobile */
          .navbar-nav.ms-auto .dropdown .dropdown-menu {
            position: static !important;
            right: auto !important;
            left: auto !important;
            margin-top: 0.5rem !important;
          }
          
          .navbar-nav .dropdown .dropdown-item {
            padding: 0.5rem 1rem !important;
            font-size: 0.9rem !important;
            border-radius: 6px !important;
            margin-bottom: 0.25rem !important;
            background-color: rgba(0, 0, 0, 0.05) !important;
            transition: all 0.3s ease !important;
            border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
          }
          
          .navbar-nav .dropdown .dropdown-item:hover {
            background-color: rgba(0, 0, 0, 0.1) !important;
            transform: translateX(5px) !important;
          }
          
          .navbar-nav .dropdown .dropdown-item i {
            margin-right: 0.5rem !important;
          }
          
          .navbar-nav .dropdown-menu-end {
            right: auto !important;
            left: auto !important;
          }
          
          /* Mobile buttons styling */
          .navbar-nav .btn {
            margin: 0.5rem 0 !important;
            width: 100% !important;
            justify-content: center !important;
            padding: 1rem 1.5rem !important;
            font-size: 1.1rem !important;
            font-weight: 600 !important;
            border-radius: 12px !important;
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
            color: white !important;
            border: none !important;
            box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3) !important;
            transition: all 0.3s ease !important;
          }
          
          .navbar-nav .btn:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 8px 25px rgba(220, 38, 38, 0.4) !important;
            background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%) !important;
          }
        }
        
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideDownFadeIn {
          0% {
            max-height: 0;
            opacity: 0;
            transform: translateY(-15px);
            padding: 0;
          }
          50% {
            max-height: 250px;
            opacity: 0.5;
            transform: translateY(-7px);
            padding: 0.25rem;
          }
          100% {
            max-height: 500px;
            opacity: 1;
            transform: translateY(0);
            padding: 0.5rem;
          }
        }
        
        /* Navbar toggler styling - black lines on non-home pages */
        /* Hide by default, show only on mobile */
        .navbar-toggler {
          border: 1px solid rgba(0, 0, 0, 0.1) !important;
          display: none !important;
          align-items: center !important;
          justify-content: center !important;
        }
        
        /* Show toggler only on mobile */
        @media (max-width: 1199px) {
          .navbar-toggler {
            display: flex !important;
          }
        }
        
        .navbar-toggler:focus {
          box-shadow: 0 0 0 0.2rem rgba(0, 0, 0, 0.1) !important;
        }
        
        .navbar-toggler-icon {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba%280, 0, 0, 0.8%29' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e") !important;
        }
        
        /* Home page specific - white lines */
        .navbar-dark .navbar-toggler-icon {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba%28255, 255, 255, 0.8%29' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e") !important;
        }
        /* Navbar base styles - ensure container stays inside */
        .navbar,
        .navbar.fixed-top,
        .navbar.navbar-expand-xl,
        .navbar.navbar-light,
        .navbar.navbar-dark {
          overflow: visible !important;
          display: flex !important;
          align-items: center !important;
          min-height: auto !important;
          max-height: none !important;
          z-index: 1050 !important;
          padding: 0 !important;
          margin: 0 !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
        }
        
        /* Ensure dropdowns can overflow navbar */
        .navbar .container {
          overflow: visible !important;
        }
        
        .navbar .container {
          display: flex !important;
          align-items: center !important;
          width: 100% !important;
          height: auto !important;
          max-height: 100% !important;
          overflow: visible !important;
          margin: 0 auto !important;
          padding: 0.5rem 15px !important;
        }
        
        /* Mobile navbar container - vertical center alignment */
        @media (max-width: 1199px) {
          .navbar,
          .navbar.fixed-top,
          .navbar.navbar-expand-xl {
            overflow: visible !important;
            display: flex !important;
            align-items: center !important;
            min-height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            z-index: 1050 !important;
            position: fixed !important;
          }
          
          /* Ensure container doesn't create stacking context */
          .navbar .container {
            position: relative !important;
            z-index: auto !important;
          }
          
          .navbar .container {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            flex-wrap: nowrap !important;
            height: auto !important;
            max-height: 100% !important;
            overflow: visible !important;
            padding: 0.25rem 1rem !important;
            margin: 0 auto !important;
          }
          
          .navbar-brand {
            display: flex !important;
            align-items: center !important;
            height: auto !important;
            max-height: 100% !important;
            overflow: hidden !important;
            margin: 0 !important;
          }
          
          .navbar-brand img {
            max-height: 65px !important;
            height: auto !important;
            width: auto !important;
            object-fit: contain !important;
            display: block !important;
          }
          
          .navbar-toggler {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 0.5rem !important;
            height: auto !important;
            max-height: 100% !important;
            overflow: hidden !important;
            margin: 0 !important;
          }
        }
      `}</style>
      <div className="container">
        {/* Logo */}
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img
            src={logo}
            alt="Obyyo Logo"
            style={{
              height: '65px',
              width: 'auto',
              objectFit: 'contain',
              filter: (isScrolled || !isHomePage) ? 'brightness(0)' : 'brightness(0) invert(1)',
              transition: 'filter 0.3s ease'
            }}
          />
        </Link>

        {/* Mobile menu button */}
        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-controls="navbarNav"
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navigation menu */}
        <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`} id="navbarNav">
          {/* Mobile Close Button */}
          <button
            className="mobile-close-btn d-xl-none"
            onClick={closeMobileMenu}
            aria-label="Close menu"
          >
            ✕
          </button>

          {/* Left Section - Logo (already positioned) */}

          {/* Center Section - Navigation Menus */}
          <ul className="navbar-nav mx-auto">
            <li className="nav-item">
              <button
                className={`nav-link ${(isScrolled || !isHomePage) ? 'text-dark' : 'text-white'}`}
                onClick={() => {
                  handleSmoothScroll('home');
                  closeMobileMenu();
                }}
              >
                Home
              </button>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link ${(isScrolled || !isHomePage) ? 'text-dark' : 'text-white'}`}
                to="/features"
                onClick={closeMobileMenu}
              >
                Features
              </Link>
            </li>
            <li className={`nav-item dropdown ${isPredictionsOpen ? 'show' : ''}`}>
              <a
                className={`nav-link dropdown-toggle ${(isScrolled || !isHomePage) ? 'text-dark' : 'text-white'} ${isActive('/predictions') ? 'active' : ''}`}
                href="#"
                role="button"
                onClick={(e) => {
                  e.preventDefault();
                  setIsPredictionsOpen(!isPredictionsOpen);
                }}
                aria-expanded={isPredictionsOpen}
              >
                <i className="bi bi-graph-up me-1"></i>
                Predictions
              </a>
              <ul className={`dropdown-menu ${isPredictionsOpen ? 'show' : ''}`}>
                {lotteryTypes.map((lottery) => (
                  <li key={lottery.type}>
                    <Link
                      className="dropdown-item"
                      to={`/predictions?lottery=${lottery.type}`}
                      onClick={closeMobileMenu}
                    >
                      <i className="bi bi-dice-6 me-2 text-primary"></i>
                      {lottery.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link ${(isScrolled || !isHomePage) ? 'text-dark' : 'text-white'}`}
                to="/how-it-works"
                onClick={closeMobileMenu}
              >
                Guide
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link ${(isScrolled || !isHomePage) ? 'text-dark' : 'text-white'}`}
                to="/pricing"
                onClick={closeMobileMenu}
              >
                Pricing
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link ${(isScrolled || !isHomePage) ? 'text-dark' : 'text-white'}`}
                to="/contact"
                onClick={closeMobileMenu}
              >
                Contact
              </Link>
            </li>
          </ul>



          {/* Right Section - User Menu / Login */}
          <ul className={`navbar-nav ms-auto`}>
            {showLoggedInState && user && (
              <li className="nav-item">
                <Link
                  className={`nav-link d-flex align-items-center justify-content-center ${(isScrolled || !isHomePage) ? 'text-dark' : 'text-white'}`}
                  to="/wallet"
                  onClick={closeMobileMenu}
                >
                  <i className="bi bi-wallet2 me-1"></i>
                  <span className="d-none d-md-inline">Wallet:</span>
                  <span className="badge bg-success ms-1">
                    ${(walletBalance ?? user?.walletBalance ?? 0).toFixed(2)}
                  </span>
                </Link>
              </li>
            )}
            {showLoggedInState ? (
              <li className={`nav-item dropdown ${isUserMenuOpen ? 'show' : ''}`}>
                <a
                  className={`nav-link dropdown-toggle d-flex align-items-center justify-content-center ${(isScrolled || !isHomePage) ? 'text-dark' : 'text-white'}`}
                  href="#"
                  role="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsUserMenuOpen(!isUserMenuOpen);
                  }}
                  aria-expanded={isUserMenuOpen}
                >

                  <div className="bg-primary text-white rounded-circle me-2 d-flex align-items-center justify-content-center"
                    style={{ width: '30px', height: '30px', fontSize: '0.8rem' }}>
                    <span className="fw-bold">{user?.firstName?.charAt(0) || 'U'}</span>
                  </div>
                  <span>{user?.firstName || 'User'}</span>
                  {user?.isInTrial && (
                    <span className="badge bg-success ms-2 small">Trial</span>
                  )}
                </a>
                <ul className={`dropdown-menu dropdown-menu-end ${isUserMenuOpen ? 'show' : ''}`}
                  style={{
                    minWidth: '220px',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15), 0 4px 20px rgba(0, 0, 0, 0.1)',
                    borderTop: '3px solid #10b981',
                    marginTop: '8px'
                  }}>
                  <li>
                    <Link
                      className="dropdown-item py-3 px-3"
                      to="/dashboard"
                      onClick={closeMobileMenu}
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: '500',
                        transition: 'all 0.3s ease',
                        borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f0fdf4';
                        e.currentTarget.style.paddingLeft = '1.5rem';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.paddingLeft = '0.75rem';
                      }}
                    >
                      <i className="bi bi-speedometer2 me-2 text-success"></i>
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="dropdown-item py-3 px-3"
                      to="/my-predictions"
                      onClick={closeMobileMenu}
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: '500',
                        transition: 'all 0.3s ease',
                        borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f0fdf4';
                        e.currentTarget.style.paddingLeft = '1.5rem';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.paddingLeft = '0.75rem';
                      }}
                    >
                      <i className="bi bi-download me-2 text-info"></i>
                      My Predictions
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="dropdown-item py-3 px-3"
                      to="/profile"
                      onClick={closeMobileMenu}
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: '500',
                        transition: 'all 0.3s ease',
                        borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f0fdf4';
                        e.currentTarget.style.paddingLeft = '1.5rem';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.paddingLeft = '0.75rem';
                      }}
                    >
                      <i className="bi bi-person me-2 text-warning"></i>
                      Profile
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="dropdown-item py-3 px-3"
                      to="/wallet"
                      onClick={closeMobileMenu}
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: '500',
                        transition: 'all 0.3s ease',
                        borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f0fdf4';
                        e.currentTarget.style.paddingLeft = '1.5rem';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.paddingLeft = '0.75rem';
                      }}
                    >
                      <i className="bi bi-wallet2 me-2 text-primary"></i>
                      My Wallet
                      <span className="badge bg-success ms-2">
                        ${(user?.walletBalance ?? walletBalance ?? 0).toFixed(2)}
                      </span>
                    </Link>
                  </li>
                  {user?.role === 'admin' && (
                    <li><hr className="dropdown-divider" style={{ margin: '0.5rem 0' }} /></li>
                  )}
                  {user?.role === 'admin' && (
                    <li>
                      <Link
                        className="dropdown-item py-3 px-3"
                        to="/admin"
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsUserMenuOpen(false);
                        }}
                        style={{
                          fontSize: '0.95rem',
                          fontWeight: '500',
                          transition: 'all 0.3s ease',
                          borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#fef3c7';
                          e.currentTarget.style.paddingLeft = '1.5rem';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.paddingLeft = '0.75rem';
                        }}
                      >
                        <i className="bi bi-gear me-2 text-warning"></i>
                        Admin Panel
                      </Link>
                    </li>
                  )}
                  <li><hr className="dropdown-divider" style={{ margin: '0.5rem 0' }} /></li>
                  <li>
                    <button
                      className="dropdown-item py-3 px-3 text-danger"
                      onClick={() => {
                        handleLogout();
                        setIsUserMenuOpen(false);
                      }}
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: '500',
                        transition: 'all 0.3s ease',
                        border: 'none',
                        background: 'none',
                        width: '100%',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#fef2f2';
                        e.currentTarget.style.paddingLeft = '1.5rem';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.paddingLeft = '0.75rem';
                      }}
                    >
                      <i className="bi bi-box-arrow-right me-2"></i>
                      Logout
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              <>
                <li className={`nav-item  ${isMenuOpen ? 'mt-3' : ''}`}>
                  <Link
                    className={`nav-link ${(isScrolled || !isHomePage) ? 'text-dark' : 'text-white'}`}
                    to="/login"
                    onClick={closeMobileMenu}
                  >
                    Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className={`btn ms-2 ${(isScrolled || !isHomePage) ? 'btn-primary' : 'btn-secondary'}`}
                    to={canStartTrial() ? "/register" : "/pricing"}
                    onClick={closeMobileMenu}
                  >
                    {canStartTrial() ? "Get Started" : "View Pricing"}
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

