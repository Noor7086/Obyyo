import React from 'react';

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
        'No subscription fees during trial period'
      ]
    },
    {
      number: 2,
      title: 'Receive Daily Predictions',
      description: 'Get daily predictions showing non-viable numbers to avoid, posted 15-24 hours before each draw.',
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
      title: 'Purchase Predictions',
      description: 'After your trial, purchase predictions for the cost of one lottery line. No subscriptions required.',
      icon: 'bi-credit-card',
      details: [
        'Pay only when you need predictions',
        'Wallet system for easy payments',
        'Secure payment processing'
      ]
    }
  ];

  const lotteryTypes = [
    {
      name: 'Powerball (USA)',
      type: 'Double Selection',
      description: 'Pick 5 from 69 white balls + 1 from 26 red balls',
      price: '$2 per prediction',
      example: 'Non-viable: White balls 45, 69, 52, 14 | Red balls 12, 20'
    },
    {
      name: 'Gopher 5 (Minnesota)',
      type: 'Single Selection',
      description: 'Pick 5 from 47 mixed colored balls',
      price: '$1 per prediction',
      example: 'Non-viable: 20, 32, 41, 29'
    },
    {
      name: 'Pick 3 (Minnesota)',
      type: 'Number Generator',
      description: 'Pick 3 from 0-9, generate combinations from viable numbers',
      price: '$1 per prediction',
      example: 'Non-viable: 2-4 numbers | Generate from 6-7 viable numbers'
    }
  ];

  return (
    <div className="container py-5 mt-5">
      {/* Header */}
      <div className="text-center mb-5">
        <h1 className="display-4 fw-bold mb-3">How Obyyo Works</h1>
        <p className="lead text-muted">
          Simple steps to improve your lottery winning odds
        </p>
      </div>

      {/* Steps */}
      <div className="row g-4 mb-5">
        {steps.map((step) => (
          <div key={step.number} className="col-lg-6">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="d-flex align-items-start">
                  <div className="flex-shrink-0">
                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                      <i className={`bi ${step.icon} fs-4`}></i>
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h4 className="fw-bold mb-2">
                      Step {step.number}: {step.title}
                    </h4>
                    <p className="text-muted mb-3">{step.description}</p>
                    <ul className="list-unstyled">
                      {step.details.map((detail, idx) => (
                        <li key={idx} className="mb-1">
                          <i className="bi bi-check-circle-fill text-success me-2"></i>
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

      {/* Lottery Types */}
      <div className="row mb-5">
        <div className="col-12">
          <h2 className="text-center mb-4">Prediction Formats</h2>
          <div className="row g-4">
            {lotteryTypes.map((lottery, index) => (
              <div key={index} className="col-lg-4">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body p-4">
                    <h5 className="fw-bold mb-2">{lottery.name}</h5>
                    <span className="badge bg-primary mb-3">{lottery.type}</span>
                    <p className="text-muted mb-3">{lottery.description}</p>
                    <p className="fw-semibold text-success mb-3">{lottery.price}</p>
                    <div className="bg-light p-3 rounded">
                      <small className="text-muted">
                        <strong>Example:</strong> {lottery.example}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
                      7 days of free predictions for your selected lottery. 
                      No credit card required to start.
                    </p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="text-center">
                    <i className="bi bi-credit-card text-success fs-1 mb-3"></i>
                    <h5>Pay-Per-Use</h5>
                    <p className="text-muted">
                      After trial, pay only when you need predictions. 
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

