import React from 'react';
import { Badge } from 'react-bootstrap';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: 1,
      title: 'Sign Up for Free Trial',
      description: 'Create your account and select your preferred lottery. Get 7 days of free predictions with no credit card required.',
      icon: 'bi-person-plus',
      details: [
        'Choose from 5 supported lottery types',
        'Provide your phone number',
        'No fees during trial period'
      ]
    },
    {
      number: 2,
      title: 'Receive Daily Access',
      description: 'Get daily access to predictions showing non-viable numbers to avoid posted 15-24 hours before each draw.',
      icon: 'bi-calendar-check',
      details: [
        'Predictions uploaded daily by our experts',
        'Instant alerts when new predictions are available',
        'Clear format showing numbers to avoid'
      ]
    },
    {
      number: 3,
      title: 'Use Number Generator',
      description: 'Input the viable numbers into our combination generator to create winning number combinations.',
      icon: 'bi-shuffle',
      details: [
        'Generate multiple combinations from viable numbers',
        'Customize combination parameters',
        'Export results for easy use'
      ]
    },
    {
      number: 4,
      title: 'Purchase Access',
      description: 'After your trial, purchase access to predictions for the cost of one lottery line. No subscriptions required.',
      icon: 'bi-credit-card',
      details: [
        'Pay only when you need access',
        'Wallet system for easy payments',
        'Secure payment processing'
      ]
    }
  ];

  const lotteryTypes = [
    {
      name: 'Powerball (USA)',
      type: 'Double Selection',
      description: 'We will identify from 1-69 Red and 1-26 Blue Power balls numbers to avoid 24 hours before each draw.',
      process: 'Customers can then manually select 5 red balls + 1 blue Powerball of their choice or generate Quick Picks from the unaffected numbers.',
      color: 'danger'
    },
    {
      name: 'Gopher 5 (Minnesota)',
      type: 'Single Selection',
      description: 'We will identify Red balls from 1–47 balls to avoid 15–24 hours before the draw.',
      process: 'Customers can then manually select 5 red balls of their choice or generate Quick Picks from the unaffected numbers.',
      color: 'success'
    }
  ];

  return (
    <div className="container py-5 mt-5">
      {/* Header */}
      <div className="text-center mb-5 pt-4">
        <h1 className="display-4 fw-bold mb-3 text-gradient">How Obyyo Works</h1>
        <p className="lead text-muted mx-auto" style={{ maxWidth: '700px' }}>
          Simple steps to improve your lottery winning odds using our advanced predictive frequency analysis.
        </p>
      </div>

      {/* Steps */}
      <div className="row g-4 mb-5 pb-5 border-bottom">
        {steps.map((step) => (
          <div key={step.number} className="col-lg-6">
            <div className="card h-100 border-0 shadow-custom premium-lottery-card">
              <div className="card-body p-5">
                <div className="d-flex align-items-start">
                  <div className="flex-shrink-0">
                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '70px', height: '70px', fontSize: '1.5rem', boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)' }}>
                      {step.number}
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-4">
                    <h3 className="fw-bold mb-3">{step.title}</h3>
                    <p className="text-muted mb-4 lead" style={{ fontSize: '1.1rem' }}>{step.description}</p>
                    <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
                      {step.details.map((detail, idx) => (
                        <li key={idx} className="d-flex align-items-center fw-medium text-secondary">
                          <i className="bi bi-check2-circle text-primary me-3 fs-5"></i>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Prediction Formats Section */}
      <div className="py-5 mb-5">
        <div className="text-center mb-5">
          <Badge bg="secondary" className="px-3 py-2 mb-3 rounded-pill text-uppercase tracking-wider fw-bold bg-opacity-10 text-primary">Data Structure</Badge>
          <h2 className="display-5 fw-bold mb-3">Prediction Formats</h2>
          <p className="lead text-muted mx-auto" style={{ maxWidth: '600px' }}>Here are specific examples of our prediction format for different lottery types.</p>
        </div>
        
        <div className="row g-4 justify-content-center">
          {lotteryTypes.map((lottery, index) => (
            <div key={index} className="col-lg-4 col-md-6">
              <div className="card h-100 border-0 shadow-custom-md premium-lottery-card text-center p-2">
                <div className="card-body p-4">
                  <div className={`badge bg-${lottery.color} bg-opacity-10 text-${lottery.color} px-3 py-2 rounded-pill mb-3 fw-bold tracking-wider`}>
                    {lottery.type}
                  </div>
                  <h3 className="fw-bold mb-4">{lottery.name}</h3>
                  
                  <div className="bg-light p-4 rounded-4 mb-4" style={{ minHeight: '160px' }}>
                    <h6 className="small fw-bold text-uppercase mb-3 opacity-50">Example Prediction Format</h6>
                    <p className="text-dark small fw-medium mb-0" style={{ lineHeight: '1.6' }}>
                      <strong>Example:</strong> {lottery.description}
                    </p>
                  </div>
                  
                  <div className="p-3">
                    <h6 className="small fw-bold text-uppercase mb-3 opacity-50">Manual Steps</h6>
                    <p className="text-muted small mb-0 fw-medium">
                      <strong>Customer:</strong> {lottery.process}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Business Model */}
      <div className="row">
        <div className="col-lg-8 mx-auto">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-5">
              <h2 className="text-center mb-4">Our Business Model</h2>
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="text-center">
                    <i className="bi bi-gift text-primary fs-1 mb-3"></i>
                    <h5>Free Trial</h5>
                    <p className="text-muted">
                      7 days of free access to predictions for your selected lottery.
                      No credit card required to start.
                    </p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="text-center">
                    <i className="bi bi-credit-card text-success fs-1 mb-3"></i>
                    <h5>Pay-Per-Access</h5>
                    <p className="text-muted">
                      After trial, pay only when you need access.
                      Cost equals one lottery line price.
                    </p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="text-center">
                    <i className="bi bi-wallet text-info fs-1 mb-3"></i>
                    <h5>Wallet System</h5>
                    <p className="text-muted">
                      Preload your account for quick, one-click payments.
                      Secure and convenient.
                    </p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="text-center">
                    <i className="bi bi-bell text-warning fs-1 mb-3"></i>
                    <h5>Instant Alerts</h5>
                    <p className="text-muted">
                      Get instant notifications when new predictions
                      are available for your lottery.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;

