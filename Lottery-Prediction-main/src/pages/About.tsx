import React from 'react';

const About: React.FC = () => {
  return (
    <div className="container py-5 mt-5">
      <div className="row">
        <div className="col-lg-8 mx-auto">
          <div className="text-center mb-5">
            <h1 className="display-4 fw-bold mb-3">About Obyyo</h1>
            <p className="lead text-muted">
              Your trusted partner in lottery prediction and winning strategy
            </p>
          </div>

          <div className="card border-0 shadow-sm mb-5">
            <div className="card-body p-5">
              <h2 className="h3 mb-4">Our Mission</h2>
              <p className="mb-4">
                At Obyyo, we're dedicated to enhancing the winning odds of lottery players worldwide. 
                Our mission is to reduce the waste of financial resources on "low vibration" numbers 
                through 80-100% accurate predictions, facilitating a strong U.S. and worldwide community.
              </p>
              
              <h2 className="h3 mb-4">How We Work</h2>
              <p className="mb-4">
                Our advanced prediction system analyzes lottery patterns and identifies non-viable numbers 
                that are unlikely to be drawn. By avoiding these low-probability numbers, players can 
                focus their resources on combinations with higher winning potential.
              </p>

              <h2 className="h3 mb-4">Our Values</h2>
              <div className="row g-4">
                <div className="col-md-6">
                  <div className="d-flex">
                    <div className="flex-shrink-0">
                      <i className="bi bi-shield-check text-primary fs-3"></i>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h5>Trust & Transparency</h5>
                      <p className="text-muted">We maintain complete transparency in our prediction methods and results.</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex">
                    <div className="flex-shrink-0">
                      <i className="bi bi-graph-up text-success fs-3"></i>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h5>Accuracy & Results</h5>
                      <p className="text-muted">Our predictions boast 80-100% accuracy in identifying non-viable numbers.</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex">
                    <div className="flex-shrink-0">
                      <i className="bi bi-people text-info fs-3"></i>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h5>Community Focus</h5>
                      <p className="text-muted">Building a supportive community of successful lottery players.</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex">
                    <div className="flex-shrink-0">
                      <i className="bi bi-lightning text-warning fs-3"></i>
                    </div>
                    <div className="flex-grow-1 ms-3">
                      <h5>Innovation</h5>
                      <p className="text-muted">Continuously improving our prediction algorithms and user experience.</p>
                    </div>
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

export default About;

