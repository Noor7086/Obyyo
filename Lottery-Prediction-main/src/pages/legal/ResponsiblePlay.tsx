import React from 'react';

const ResponsiblePlay: React.FC = () => {
  return (
    <div className="container py-5 mt-5">
      <div className="row">
        <div className="col-lg-8 mx-auto">
          <h1 className="display-4 fw-bold mb-4 gradient-text">Responsible Play</h1>
          
          <div className="card border-0 shadow-sm">
            <div className="card-body p-5">
              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                <strong>Our Commitment:</strong> We are committed to promoting responsible lottery play and providing resources for those who need help.
              </div>
              
              <h2 className="fw-bold mb-3">What is Responsible Play?</h2>
              <p>Responsible play means enjoying lottery games as a form of entertainment while maintaining control over your spending and time. It involves setting limits, understanding the risks, and knowing when to stop.</p>
              
              <h2 className="fw-bold mb-3 mt-4">Setting Limits</h2>
              <ul>
                <li><strong>Budget Limits:</strong> Only spend money you can afford to lose</li>
                <li><strong>Time Limits:</strong> Set specific times for lottery activities</li>
                <li><strong>Frequency Limits:</strong> Limit how often you play</li>
                <li><strong>Loss Limits:</strong> Decide in advance how much you're willing to lose</li>
              </ul>
              
              <h2 className="fw-bold mb-3 mt-4">Warning Signs</h2>
              <p>Be aware of these warning signs that may indicate a gambling problem:</p>
              <ul>
                <li>Spending more money than you can afford</li>
                <li>Chasing losses with bigger bets</li>
                <li>Lying about gambling activities</li>
                <li>Neglecting responsibilities or relationships</li>
                <li>Feeling anxious or depressed about gambling</li>
                <li>Borrowing money to gamble</li>
              </ul>
              
              <h2 className="fw-bold mb-3 mt-4">Getting Help</h2>
              <p>If you or someone you know has a gambling problem, help is available:</p>
              
              <div className="row g-3 mt-3">
                <div className="col-md-6">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h6 className="fw-bold">National Council on Problem Gambling</h6>
                      <p className="small mb-2">24/7 Helpline: 1-800-522-4700</p>
                      <a href="https://www.ncpgambling.org" className="btn btn-outline-primary btn-sm">Visit Website</a>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h6 className="fw-bold">Gamblers Anonymous</h6>
                      <p className="small mb-2">Support groups and meetings</p>
                      <a href="https://www.gamblersanonymous.org" className="btn btn-outline-primary btn-sm">Visit Website</a>
                    </div>
                  </div>
                </div>
              </div>
              
              <h2 className="fw-bold mb-3 mt-4">Self-Exclusion</h2>
              <p>If you need to take a break from lottery activities, consider self-exclusion options:</p>
              <ul>
                <li>Contact your state lottery commission for self-exclusion programs</li>
                <li>Use website blocking software</li>
                <li>Ask family members to help monitor your activities</li>
              </ul>
              
              <h2 className="fw-bold mb-3 mt-4">Our Tools</h2>
              <p>Obyyo provides tools to help you play responsibly:</p>
              <ul>
                <li>Spending tracking and limits</li>
                <li>Time-based reminders</li>
                <li>Educational resources about odds and probabilities</li>
                <li>Links to support organizations</li>
              </ul>
              
              <h2 className="fw-bold mb-3 mt-4">Contact Us</h2>
              <p>If you have concerns about responsible play or need assistance, please contact us at support@obyyo.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponsiblePlay;

