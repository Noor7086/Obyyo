import React from 'react';

const TermsConditions: React.FC = () => {
  return (
    <div className="container py-5 mt-5">
      <div className="row">
        <div className="col-lg-8 mx-auto">
          <h1 className="display-4 fw-bold mb-4 gradient-text">Terms & Conditions</h1>
          <p className="text-muted mb-4">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="card border-0 shadow-sm">
            <div className="card-body p-5">
              <h2 className="fw-bold mb-3">1. Acceptance of Terms</h2>
              <p>By accessing and using Obyyo's lottery prediction services, you accept and agree to be bound by the terms and provision of this agreement.</p>
              
              <h2 className="fw-bold mb-3 mt-4">2. Service Description</h2>
              <p>Obyyo provides lottery prediction services that analyze historical data to identify non-viable numbers. Our service is designed to help users make more informed decisions when playing lottery games.</p>
              
              <h2 className="fw-bold mb-3 mt-4">3. No Guarantee of Winnings</h2>
              <p>Obyyo does not guarantee that using our prediction services will result in winning any lottery game. Lottery games are games of chance, and no prediction system can guarantee wins.</p>
              
              <h2 className="fw-bold mb-3 mt-4">4. User Responsibilities</h2>
              <ul>
                <li>Users must be 18 years or older to use our services</li>
                <li>Users are responsible for complying with local lottery laws and regulations</li>
                <li>Users must play responsibly and within their means</li>
                <li>Users are responsible for the accuracy of information provided</li>
              </ul>
              
              <h2 className="fw-bold mb-3 mt-4">5. Payment Terms</h2>
              <p>Our services are provided on a pay-per-prediction basis or through subscription plans. All payments are processed securely, and refunds are subject to our refund policy.</p>
              
              <h2 className="fw-bold mb-3 mt-4">6. Privacy and Data Protection</h2>
              <p>We are committed to protecting your privacy. Please review our Privacy Policy for information on how we collect, use, and protect your personal information.</p>
              
              <h2 className="fw-bold mb-3 mt-4">7. Distributor Confidentiality</h2>
              <p>Distributors are strictly prohibited from disclosing, sharing, or reproducing any confidential information related to the website's data, prediction methods, or user details with any third party without prior written consent.</p>
              
              <h2 className="fw-bold mb-3 mt-4">8. Limitation of Liability</h2>
              <p>Obyyo shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use our services.</p>
              
              <h2 className="fw-bold mb-3 mt-4">9. Modifications</h2>
              <p>We reserve the right to modify these terms at any time. Users will be notified of significant changes via email or through our platform.</p>
              
              <h2 className="fw-bold mb-3 mt-4">10. Contact Information</h2>
              <p>For questions about these Terms & Conditions, please contact us at legal@obyyo.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;

