import React from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';
import { FaChartLine, FaShieldAlt, FaMobile, FaClock, FaUsers, FaDownload, FaHistory, FaWallet, FaBell, FaCog } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import TrialStatus from '../components/TrialStatus';

const Features: React.FC = () => {
  const { canStartTrial } = useAuth();

  const features = [
    {
      icon: <FaChartLine className="text-primary" />,
      title: "Advanced Analytics",
      description: "Our sophisticated algorithms analyze historical lottery data, patterns, and trends to provide you with the most accurate predictions possible.",
      benefits: [
        "Historical data analysis",
        "Pattern recognition",
        "Statistical modeling",
        "Trend identification"
      ]
    },
    {
      icon: <FaShieldAlt className="text-warning" />,
      title: "Secure & Reliable",
      description: "Your data and transactions are protected with enterprise-grade security measures and encrypted connections.",
      benefits: [
        "SSL encryption",
        "Secure payments",
        "Data protection",
        "Privacy compliance"
      ]
    },
    {
      icon: <FaMobile className="text-info" />,
      title: "Mobile Optimized",
      description: "Access your predictions and manage your account from any device with our fully responsive design.",
      benefits: [
        "Responsive design",
        "Mobile app ready",
        "Cross-platform compatibility",
        "Offline capabilities"
      ]
    },
    {
      icon: <FaClock className="text-danger" />,
      title: "Real-Time Updates",
      description: "Get instant notifications about new predictions, draw results, and important updates to stay ahead of the game.",
      benefits: [
        "Instant notifications",
        "Live draw results",
        "Real-time updates",
        "Push notifications"
      ]
    },
    {
      icon: <FaUsers className="text-secondary" />,
      title: "Community Support",
      description: "Join a community of lottery enthusiasts and get support from our expert team and fellow users.",
      benefits: [
        "Expert support",
        "Community forums",
        "User testimonials",
        "Success stories"
      ]
    }
  ];

  const additionalFeatures = [
    {
      icon: <FaDownload />,
      title: "Easy Downloads",
      description: "Download your predictions in multiple formats including PDF, Excel, and CSV for easy reference."
    },
    {
      icon: <FaHistory />,
      title: "Transaction History",
      description: "Track all your purchases, downloads, and account activity with detailed transaction history."
    },
    {
      icon: <FaWallet />,
      title: "Digital Wallet",
      description: "Secure wallet system for easy payments and fund management with multiple payment options."
    },
    {
      icon: <FaBell />,
      title: "Smart Notifications",
      description: "Customizable notifications for new predictions, draw dates, and account updates."
    },
    {
      icon: <FaCog />,
      title: "Customizable Settings",
      description: "Personalize your experience with customizable preferences and lottery selections."
    }
  ];

  const lotteryTypes = [
    {
      name: "Powerball",
      code: "powerball",
      description: "America's biggest lottery with jackpots starting at $20 million",
      features: ["5 Red balls + 1 Blue Powerball", "Draw is held three times a week", "Multi-state participation"],
      color: "danger"
    },
    {
      name: "Mega Millions",
      code: "megamillion",
      description: "Another major lottery with massive jackpots and frequent draws",
      features: ["5 Red balls + 1 Blue Mega Ball", "Twice weekly draws", "Cross-state play"],
      color: "info"
    },
    {
      name: "Lotto America",
      code: "lottoamerica",
      description: "Regional lottery with good odds and regular jackpots",
      features: ["5 Red balls + 1 Blue Star Ball", "Draw is held three times a week", "Multi-state game"],
      color: "warning"
    },
    {
      name: "Gopher 5",
      code: "gopher5",
      description: "Minnesota's state lottery with daily draws",
      features: ["5 Red balls from 1-47", "Draw is held three times a week", "State-specific game"],
      color: "success"
    }
  ];

  return (
    <Container className="py-5">
      {/* Header Section */}
      <Row className="mb-5">
        <Col className="text-center">
          <h1 className="display-4 fw-bold mb-4 text-gradient">Powerful Features for Lottery Success</h1>
          <p className="lead text-muted mx-auto" style={{ maxWidth: '700px' }}>
            Discover the comprehensive tools and features that make our lottery prediction platform reliable and effective.
          </p>
        </Col>
      </Row>

      {/* Trial Status */}
      <Row className="mb-5">
        <Col>
          <TrialStatus />
        </Col>
      </Row>

      {/* Main Features Grid */}
      <Row className="g-4 mb-5">
        {features.map((feature, index) => (
          <Col lg={6} key={index}>
            <Card className="h-100 shadow-custom border-0 hover-lift">
              <Card.Body className="p-4">
                <div className="d-flex align-items-start">
                  <div className="me-4 p-3 rounded-circle bg-light d-flex align-items-center justify-content-center" style={{ fontSize: '2.2rem', width: '80px', height: '80px', boxShadow: 'var(--shadow-sm)' }}>
                    {feature.icon}
                  </div>
                  <div className="flex-grow-1">
                    <h4 className="fw-bold mb-3">{feature.title}</h4>
                    <p className="text-muted mb-4">{feature.description}</p>
                    <div className="d-flex flex-wrap gap-2">
                      {feature.benefits.map((benefit, idx) => (
                        <Badge key={idx} bg="light" text="primary" className="px-3 py-2 border rounded-pill fw-medium">
                          <span className="me-1">✓</span> {benefit}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Additional Features Section */}
      <div className="py-5 bg-light rounded-4 mb-5 shadow-sm px-4">
        <Row className="mb-5 text-center">
          <Col lg={8} className="mx-auto">
            <h2 className="fw-bold mb-3">Additional Features</h2>
            <p className="text-muted">More tools to enhance your lottery experience</p>
          </Col>
        </Row>

        <Row className="g-4">
          {additionalFeatures.map((feature, index) => (
            <Col md={6} lg={4} key={index}>
              <div className="p-4 h-100 text-center transition-all bg-white rounded-4 shadow-sm hover-up">
                <div className="text-primary mb-3 mx-auto d-flex align-items-center justify-content-center" style={{ fontSize: '2.5rem', width: '60px', height: '60px' }}>
                  {feature.icon}
                </div>
                <h5 className="fw-bold mb-3">{feature.title}</h5>
                <p className="text-muted small mb-0">{feature.description}</p>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      {/* Supported Lotteries Section */}
      <Row className="mb-5 text-center pt-5">
        <Col lg={8} className="mx-auto">
          <Badge bg="primary" className="px-3 py-2 mb-3 rounded-pill text-uppercase tracking-wider fw-bold">Gaming Support</Badge>
          <h2 className="display-5 fw-bold mb-3">Supported Lotteries</h2>
          <p className="lead text-muted">We provide accurate predictions for all major lottery games using historical analysis.</p>
        </Col>
      </Row>

      <Row className="g-4 justify-content-center">
        {lotteryTypes.map((lottery, index) => (
          <Col lg={4} md={6} key={index}>
            <Card className="h-100 border-0 shadow-custom-md overflow-hidden premium-lottery-card">
              <Card.Body className="p-5 text-center">
                <h3 className="fw-bold mb-3">{lottery.name}</h3>
                <p className="text-muted mb-4">{lottery.description}</p>
                
                <div className="mb-4">
                  <h6 className="small fw-bold text-uppercase mb-3 opacity-50">Game Features</h6>
                  <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                    {lottery.features.map((feature, idx) => (
                      <li key={idx} className="small fw-medium text-secondary">
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <a 
                  href={`/predictions?lottery=${lottery.code}`}
                  className={`btn btn-lg w-100 btn-outline-lottery-${lottery.color} mt-2`}
                >
                  Live Predictions Available
                </a>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>


      {/* Call to Action */}
      <Row className="mt-5">
        <Col className="text-center">
          <Card className="border-0 bg-primary text-white">
            <Card.Body className="p-5">
              <h3 className="mb-3">Ready to Get Started?</h3>
              <p className="mb-4">
                Join thousands of users who are already using our reliable prediction system to improve their lottery success.
              </p>
              <div className="d-flex justify-content-center gap-3">
                {canStartTrial() ? (
                  <>
                    <a href="/register" className="btn btn-light btn-lg">
                      Start Free Trial
                    </a>
                    <a href="/pricing" className="btn btn-outline-light btn-lg">
                      View Pricing
                    </a>
                  </>
                ) : (
                  <a href="/pricing" className="btn btn-light btn-lg">
                    View Pricing
                  </a>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Features;
