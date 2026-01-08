import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="row py-5">
          {/* Enhanced Company Info */}
          <div className="col-lg-4 col-md-6 mb-4">
            <div className="mb-3">
              <img
                src={logo}
                alt="Obyyo Logo"
                style={{
                  height: '75px',
                  width: 'auto',
                  objectFit: 'contain',
                  filter: 'brightness(0) invert(1)'
                }}
              />
            </div>
            <p className="text-light mb-4" style={{ fontSize: '0.95rem', lineHeight: '1.6', opacity: 0.9 }}>
              Your trusted partner in lottery prediction and winning strategy.
              We help you make smarter choices by identifying non-viable numbers
              with advanced analytics, maximizing your winning potential across
              all major lottery games.
            </p>
            <div className="social-links">
              <a href="#" className="text-light me-3" aria-label="Facebook">
                <i className="bi bi-facebook fs-5"></i>
              </a>
              <a href="#" className="text-light me-3" aria-label="Twitter">
                <i className="bi bi-twitter fs-5"></i>
              </a>
              <a href="#" className="text-light me-3" aria-label="Instagram">
                <i className="bi bi-instagram fs-5"></i>
              </a>
              <a href="#" className="text-light" aria-label="LinkedIn">
                <i className="bi bi-linkedin fs-5"></i>
              </a>
            </div>
          </div>

          {/* Enhanced Quick Links */}
          <div className="col-lg-2 col-md-6 mb-4">
            <h6 className="text-white mb-3 fw-bold">
              <i className="bi bi-link-45deg me-2"></i>
              Quick Links
            </h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/" className="text-light text-decoration-none">
                  <i className="bi bi-house me-2"></i>
                  Home
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/about" className="text-light text-decoration-none">
                  <i className="bi bi-info-circle me-2"></i>
                  About Us
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/how-it-works" className="text-light text-decoration-none">
                  <i className="bi bi-question-circle me-2"></i>
                  How It Works
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/tools/number-generator" className="text-light text-decoration-none">
                  <i className="bi bi-shuffle me-2"></i>
                  Number Generator
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/results" className="text-light text-decoration-none">
                  <i className="bi bi-trophy me-2"></i>
                  Results
                </Link>
              </li>
            </ul>
          </div>

          {/* Enhanced Predictions */}
          <div className="col-lg-2 col-md-6 mb-4">
            <h6 className="text-white mb-3 fw-bold">
              <i className="bi bi-graph-up me-2"></i>
              Predictions
            </h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/predictions?lottery=gopher5" className="text-light text-decoration-none">
                  <i className="bi bi-dice-6 me-2"></i>
                  Gopher 5
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/predictions?lottery=pick3" className="text-light text-decoration-none">
                  <i className="bi bi-dice-3 me-2"></i>
                  Pick 3
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/predictions?lottery=lottoamerica" className="text-light text-decoration-none">
                  <i className="bi bi-flag me-2"></i>
                  Lotto America
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/predictions?lottery=megamillion" className="text-light text-decoration-none">
                  <i className="bi bi-currency-dollar me-2"></i>
                  Mega Million
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/predictions?lottery=powerball" className="text-light text-decoration-none">
                  <i className="bi bi-lightning me-2"></i>
                  Powerball
                </Link>
              </li>
            </ul>
          </div>

          {/* Enhanced Support */}
          <div className="col-lg-2 col-md-6 mb-4">
            <h6 className="text-white mb-3 fw-bold">
              <i className="bi bi-headset me-2"></i>
              Support
            </h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/contact" className="text-light text-decoration-none">
                  <i className="bi bi-envelope me-2"></i>
                  Contact Us
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/faq" className="text-light text-decoration-none">
                  <i className="bi bi-question-circle me-2"></i>
                  FAQ
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/blog" className="text-light text-decoration-none">
                  <i className="bi bi-newspaper me-2"></i>
                  Blog
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/responsible-play" className="text-light text-decoration-none">
                  <i className="bi bi-shield-check me-2"></i>
                  Responsible Play
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/avoid-scams" className="text-light text-decoration-none">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Avoid Scams
                </Link>
              </li>
            </ul>
          </div>

          {/* Enhanced Legal */}
          <div className="col-lg-2 col-md-6 mb-4">
            <h6 className="text-white mb-3 fw-bold">
              <i className="bi bi-file-text me-2"></i>
              Legal
            </h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/privacy-policy" className="text-light text-decoration-none">
                  <i className="bi bi-shield-lock me-2"></i>
                  Privacy Policy
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/terms-conditions" className="text-light text-decoration-none">
                  <i className="bi bi-file-earmark-text me-2"></i>
                  Terms & Conditions
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/disclaimer" className="text-light text-decoration-none">
                  <i className="bi bi-info-square me-2"></i>
                  Disclaimer
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Enhanced Bottom Bar */}
        <div className="border-top border-light border-opacity-25 pt-4">
          <div className="row align-items-center">
            <div className="col-md-6">
              <p className="text-light mb-0">
                <i className="bi bi-c-circle me-1"></i>
                © {currentYear} Obyyo. All rights reserved. (Patent Pending)

              </p>
            </div>
            <div className="col-md-6 text-md-end">
              <p className="text-light mb-0">
                <i className="bi bi-shield-check me-1"></i>
                <span className="fw-medium">Secure & Trusted Platform</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

