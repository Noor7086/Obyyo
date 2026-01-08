import React from 'react';

const AvoidScams: React.FC = () => {
  return (
    <div className="container py-5 mt-5">
      <div className="row">
        <div className="col-lg-8 mx-auto">
          <h1 className="display-4 fw-bold mb-4 gradient-text">Avoid Lottery Scams</h1>
          
          <div className="card border-0 shadow-sm">
            <div className="card-body p-5">
              <div className="alert alert-danger">
                <i className="bi bi-shield-exclamation me-2"></i>
                <strong>Warning:</strong> Lottery scams are common. Learn how to protect yourself.
              </div>
              
              <h2 className="fw-bold mb-3">Common Lottery Scams</h2>
              
              <h3 className="fw-bold mb-2">1. Fake Winning Notifications</h3>
              <p>Scammers send emails, letters, or phone calls claiming you've won a lottery you never entered. They ask for personal information or upfront fees to claim your "prize."</p>
              
              <h3 className="fw-bold mb-2 mt-3">2. Advance Fee Fraud</h3>
              <p>Scammers ask you to pay taxes, fees, or other charges upfront before you can receive your winnings. Legitimate lotteries never require upfront payments.</p>
              
              <h3 className="fw-bold mb-2 mt-3">3. Fake Lottery Websites</h3>
              <p>Fraudulent websites that look like official lottery sites but are designed to steal your money and personal information.</p>
              
              <h3 className="fw-bold mb-2 mt-3">4. Social Media Scams</h3>
              <p>Scammers use social media to promote fake lottery wins or ask for money to help claim prizes.</p>
              
              <h2 className="fw-bold mb-3 mt-4">How to Identify Scams</h2>
              <ul>
                <li><strong>You didn't enter:</strong> You can't win a lottery you didn't enter</li>
                <li><strong>Upfront payments:</strong> Legitimate lotteries don't ask for money upfront</li>
                <li><strong>Urgent requests:</strong> Scammers create urgency to pressure you</li>
                <li><strong>Poor grammar:</strong> Many scam messages contain spelling and grammar errors</li>
                <li><strong>Unusual contact methods:</strong> Official lotteries don't contact winners via email or social media</li>
              </ul>
              
              <h2 className="fw-bold mb-3 mt-4">Protection Tips</h2>
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h6 className="fw-bold text-success">✓ Do</h6>
                      <ul className="small">
                        <li>Verify lottery results on official websites</li>
                        <li>Check your tickets carefully</li>
                        <li>Be suspicious of unsolicited contact</li>
                        <li>Report suspicious activity</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h6 className="fw-bold text-danger">✗ Don't</h6>
                      <ul className="small">
                        <li>Pay upfront fees or taxes</li>
                        <li>Share personal information</li>
                        <li>Send money to claim prizes</li>
                        <li>Trust unsolicited messages</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <h2 className="fw-bold mb-3 mt-4">Official Lottery Resources</h2>
              <p>Always verify lottery information through official sources:</p>
              <ul>
                <li>State lottery commission websites</li>
                <li>Official lottery retailer locations</li>
                <li>Authorized lottery apps</li>
                <li>Official lottery social media accounts</li>
              </ul>
              
              <h2 className="fw-bold mb-3 mt-4">Report Scams</h2>
              <p>If you encounter a lottery scam:</p>
              <ul>
                <li>Report to the Federal Trade Commission (FTC)</li>
                <li>Contact your state attorney general</li>
                <li>Report to the Internet Crime Complaint Center (IC3)</li>
                <li>Contact your local police department</li>
              </ul>
              
              <h2 className="fw-bold mb-3 mt-4">Contact Us</h2>
              <p>If you have questions about lottery scams or need assistance, please contact us at security@obyyo.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvoidScams;

