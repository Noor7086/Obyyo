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
              
              <h2 className="fw-bold mb-3 mt-4">7. SMS Verification Consent</h2>
              <p>By registering for an account, you consent to receive SMS (Short Message Service) messages for the purpose of phone number verification. This includes:</p>
              <ul>
                <li>One-time verification codes (OTP) sent to your registered phone number during account registration</li>
                <li>Security-related SMS messages for account verification purposes</li>
              </ul>
              <p className="mt-2">
                <strong>Message Frequency:</strong> SMS messages for verification are sent on an as-needed basis during the registration and verification process. Standard message and data rates may apply as determined by your mobile carrier.
              </p>
              <p className="mt-2">
                <strong>Opt-Out:</strong> You may opt-out of receiving SMS verification messages by not completing the registration process. However, phone number verification is required to create and use an account on Obyyo. If you have already registered and wish to update your phone number or verification preferences, please contact our support team.
              </p>
              <p className="mt-2">
                <strong>Carrier Information:</strong> Obyyo is not responsible for any charges incurred from your mobile carrier for receiving SMS messages. Please contact your mobile carrier for information about your messaging plan.
              </p>
              
              <h2 className="fw-bold mb-3 mt-4">8. Lottery Updates and Notifications Consent</h2>
              <p>By selecting a lottery during registration and consenting to receive lottery updates, you agree to receive notifications and updates related to your selected lottery. This includes:</p>
              <ul>
                <li>Notifications when new predictions are uploaded for your selected lottery</li>
                <li>Alerts when results are announced for your selected lottery</li>
                <li>Important updates and information about your selected lottery game</li>
                <li>Service-related announcements that may affect your lottery predictions</li>
              </ul>
              <p className="mt-2">
                <strong>Notification Methods:</strong> Notifications may be sent via SMS, email, or in-app notifications, depending on your notification preferences and the type of update.
              </p>
              <p className="mt-2">
                <strong>Message Frequency:</strong> The frequency of lottery updates depends on the draw schedule of your selected lottery and when new predictions or results are available. You may receive multiple messages per week, especially for lotteries with frequent draws.
              </p>
              <p className="mt-2">
                <strong>Opt-Out:</strong> You can manage your notification preferences at any time through your account settings. You may disable lottery update notifications while still maintaining access to your account. However, you may miss important updates about new predictions and results for your selected lottery.
              </p>
              <p className="mt-2">
                <strong>Changing Your Selected Lottery:</strong> You can change your selected lottery at any time through your profile settings. When you change your selected lottery, you will receive updates for the newly selected lottery instead of the previous one.
              </p>
              <p className="mt-2">
                <strong>Standard Rates Apply:</strong> Standard message and data rates may apply for SMS notifications as determined by your mobile carrier. Obyyo is not responsible for any charges incurred from your mobile carrier.
              </p>
              
              <h2 className="fw-bold mb-3 mt-4">9. Distributor Confidentiality</h2>
              <p>Distributors are strictly prohibited from disclosing, sharing, or reproducing any confidential information related to the website's data, prediction methods, or user details with any third party without prior written consent.</p>
              
              <h2 className="fw-bold mb-3 mt-4">10. Limitation of Liability</h2>
              <p>Obyyo shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use our services.</p>
              
              <h2 className="fw-bold mb-3 mt-4">11. Modifications</h2>
              <p>We reserve the right to modify these terms at any time. Users will be notified of significant changes via email or through our platform.</p>
              
              <h2 className="fw-bold mb-3 mt-4">12. Contact Information</h2>
              <p>For questions about these Terms & Conditions, please contact us at legal@obyyo.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;

