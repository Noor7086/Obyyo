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
      description: "America's biggest lottery with jackpots starting at $20 million",
      features: ["5 white balls + Powerball", "Draw is held three times a week", "Multi-state participation"]
    },
    {
      name: "Mega Millions",
      description: "Another major lottery with massive jackpots and frequent draws",
      features: ["5 white balls + Mega Ball", "Twice weekly draws", "Cross-state play"]
    },
    {
      name: "Lotto America",
      description: "Regional lottery with good odds and regular jackpots",
      features: ["5 white balls + Star Ball", "Draw is held three times a week", "Multi-state game"]
    },
    {
      name: "Gopher 5",
      description: "Minnesota's state lottery with daily draws",
      features: ["5 numbers from 1-47", "Draw is held three times a week", "State-specific game"]
    },
    {
      name: "Pick 3",
      description: "Simple 3-digit lottery with multiple daily draws",
      features: ["3 numbers 0-9", "Multiple daily draws", "Various play options"]
    }
  ];

  return (
    <Container className="py-5">
      {/* Header Section */}
      <Row className="mb-5">
        <Col className="text-center">
          <h1 className="display-4 fw-bold mb-4">Powerful Features for Lottery Success</h1>
          <p className="lead text-muted">
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
            <Card className="h-100 shadow-sm border-0">
              <Card.Body className="p-4">
                <div className="d-flex align-items-start">
                  <div className="me-3" style={{ fontSize: '2.5rem' }}>
                    {feature.icon}
                  </div>
                  <div className="flex-grow-1">
                    <h4 className="card-title mb-3">{feature.title}</h4>
                    <p className="text-muted mb-3">{feature.description}</p>
                    <ul className="list-unstyled">
                      {feature.benefits.map((benefit, idx) => (
                        <li key={idx} className="mb-1">
                          <Badge bg="light" text="dark" className="me-2">✓</Badge>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Additional Features Section */}
      <Row className="mb-5">
        <Col className="text-center mb-4">
          <h2 className="h3 fw-bold">Additional Features</h2>
          <p className="text-muted">More tools to enhance your lottery experience</p>
        </Col>
      </Row>

      <Row className="g-3 mb-5">
        {additionalFeatures.map((feature, index) => (
          <Col md={6} lg={4} key={index}>
            <Card className="h-100 border-0 bg-light">
              <Card.Body className="text-center p-4">
                <div className="text-primary mb-3" style={{ fontSize: '2rem' }}>
                  {feature.icon}
                </div>
                <h6 className="card-title">{feature.title}</h6>
                <p className="text-muted small mb-0">{feature.description}</p>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Supported Lotteries Section */}
      <Row className="mb-5">
        <Col className="text-center mb-4">
          <h2 className="h3 fw-bold">Supported Lotteries</h2>
          <p className="text-muted">We provide predictions for all major lottery games</p>
        </Col>
      </Row>

      <Row className="g-4">
        {lotteryTypes.map((lottery, index) => (
          <Col lg={6} key={index}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="p-4">
                <h5 className="card-title text-primary mb-3">{lottery.name}</h5>
                <p className="text-muted mb-3">{lottery.description}</p>
                <div>
                  <h6 className="small fw-bold text-uppercase mb-2">Game Features:</h6>
                  <ul className="list-unstyled">
                    {lottery.features.map((feature, idx) => (
                      <li key={idx} className="mb-1">
                        <Badge bg="outline-primary" className="me-2">•</Badge>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
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
