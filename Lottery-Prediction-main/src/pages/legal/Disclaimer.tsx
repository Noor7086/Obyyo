import React from 'react';

const Disclaimer: React.FC = () => {
  return (
    <div className="container py-5 mt-5">
      <div className="row">
        <div className="col-lg-8 mx-auto">
          <h1 className="display-4 fw-bold mb-4 gradient-text">Legal Disclaimer</h1>
          
          <div className="card border-0 shadow-sm">
            <div className="card-body p-5">
              <div className="alert alert-warning">
                <i className="bi bi-exclamation-triangle me-2"></i>
                <strong>Important:</strong> Please read this disclaimer carefully before using our services.
              </div>
              
              <h2 className="fw-bold mb-3">No Guarantee of Winnings</h2>
              <p>Obyyo's lottery prediction services are provided for informational purposes only. We do not guarantee that using our predictions will result in winning any lottery game. Lottery games are games of chance, and no system, method, or prediction can guarantee wins.</p>
              
              <h2 className="fw-bold mb-3 mt-4">Educational Purpose</h2>
              <p>Our services are designed to provide educational insights and statistical analysis. Users should understand that lottery outcomes are random and unpredictable.</p>
              
              <h2 className="fw-bold mb-3 mt-4">Responsible Gaming</h2>
              <p>We encourage responsible gaming practices. Users should:</p>
              <ul>
                <li>Only spend money they can afford to lose</li>
                <li>Set limits on their lottery spending</li>
                <li>Seek help if gambling becomes a problem</li>
                <li>Understand that lottery games are for entertainment purposes</li>
              </ul>
              
              <h2 className="fw-bold mb-3 mt-4">Accuracy of Information</h2>
              <p>While we strive to provide accurate and up-to-date information, we cannot guarantee the accuracy, completeness, or timeliness of our predictions or analysis.</p>
              
              <h2 className="fw-bold mb-3 mt-4">Third-Party Services</h2>
              <p>Our platform may contain links to third-party lottery websites or services. We are not responsible for the content, privacy policies, or practices of these third-party sites.</p>
              
              <h2 className="fw-bold mb-3 mt-4">Limitation of Liability</h2>
              <p>Obyyo shall not be liable for any losses, damages, or expenses arising from the use of our prediction services or any lottery-related activities.</p>
              
              <h2 className="fw-bold mb-3 mt-4">Legal Compliance</h2>
              <p>Users are responsible for ensuring their lottery activities comply with local, state, and federal laws and regulations.</p>
              
              <h2 className="fw-bold mb-3 mt-4">Contact Information</h2>
              <p>For questions about this disclaimer, please contact us at legal@obyyo.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Disclaimer;

