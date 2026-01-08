import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="container py-5 mt-5">
      <div className="row">
        <div className="col-lg-8 mx-auto">
          <h1 className="display-4 fw-bold mb-4 gradient-text">Privacy Policy</h1>
          <p className="text-muted mb-4">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="card border-0 shadow-sm">
            <div className="card-body p-5">
              <h2 className="fw-bold mb-3">1. Information We Collect</h2>
              <p>We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.</p>
              <ul>
                <li>Personal information (name, email, phone number)</li>
                <li>Payment information (processed securely through third-party providers)</li>
                <li>Usage data and preferences</li>
                <li>Communication records</li>
              </ul>
              
              <h2 className="fw-bold mb-3 mt-4">2. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul>
                <li>Provide and improve our services</li>
                <li>Process payments and transactions</li>
                <li>Send you important updates and notifications</li>
                <li>Provide customer support</li>
                <li>Analyze usage patterns to improve our platform</li>
              </ul>
              
              <h2 className="fw-bold mb-3 mt-4">3. Information Sharing</h2>
              <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.</p>
              
              <h2 className="fw-bold mb-3 mt-4">4. Data Security</h2>
              <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
              
              <h2 className="fw-bold mb-3 mt-4">5. Your Rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and data</li>
                <li>Opt-out of marketing communications</li>
              </ul>
              
              <h2 className="fw-bold mb-3 mt-4">6. Cookies and Tracking</h2>
              <p>We use cookies and similar technologies to enhance your experience and analyze usage patterns. You can control cookie settings through your browser.</p>
              
              <h2 className="fw-bold mb-3 mt-4">7. Contact Us</h2>
              <p>If you have questions about this Privacy Policy, please contact us at privacy@obyyo.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

