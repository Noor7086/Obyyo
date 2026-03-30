import React from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaBolt, FaMoneyBillWave, FaFlag, FaBullseye, FaDice } from 'react-icons/fa';
import TrialStatus from '../components/TrialStatus';

const Pricing: React.FC = () => {
  const navigate = useNavigate();

  const nationalLotteries = [
    {
      name: "Powerball",
      location: "USA",
      icon: <FaBolt className="text-warning" />,
      numberSelection: "Non-Viable numbers of 10–20 Red balls + 6–10 Blue Powerballs",
      price: 2,
      lotteryType: "powerball",
      color: "danger"
    },
    {
      name: "Mega Millions",
      location: "USA",
      icon: <FaMoneyBillWave className="text-success" />,
      numberSelection: "Non-Viable numbers of 10–20 Red balls + 6–10 Blue Mega balls",
      price: 5,
      lotteryType: "megamillion",
      color: "info"
    },
    {
      name: "Lotto America",
      location: "USA",
      icon: <FaFlag className="text-primary" />,
      numberSelection: "Non-Viable numbers of 10–17 Red balls + 3-4 Blue Star balls",
      price: 1,
      lotteryType: "lottoamerica",
      color: "warning"
    }
  ];

  const stateLotteries = [
    {
      name: "Gopher 5",
      location: "Minnesota",
      icon: <FaBullseye className="text-danger" />,
      numberSelection: "Non-Viable numbers of 10–15 Red balls",
      price: 1,
      lotteryType: "gopher5",
      color: "success"
    }
  ];

  const dailyGames = [
    {
      name: "Pick 3",
      location: "Minnesota",
      icon: <FaDice className="text-dark" />,
      numberSelection: "Non-Viable numbers of 2–3 Red balls",
      price: 1,
      lotteryType: "pick3",
      color: "primary"
    }
  ];

  const LotteryCard = ({ lottery }: { lottery: any }) => (
    <Card className="h-100 border-0 shadow-custom premium-lottery-card">
      <Card.Body className="p-4 text-center">
        <div className="mb-3 mx-auto d-flex align-items-center justify-content-center bg-light rounded-circle" style={{ width: '80px', height: '80px', fontSize: '2.5rem' }}>
          {lottery.icon}
        </div>
        
        <h4 className="fw-bold mb-1">{lottery.name}</h4>
        <Badge bg="light" text="dark" className="mb-3 border fw-medium px-3 py-2 rounded-pill">
          {lottery.location}
        </Badge>
        
        <div className="bg-light p-3 rounded-4 mb-4" style={{ minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p className="text-muted small mb-0 fw-medium" style={{ lineHeight: '1.5' }}>
            {lottery.numberSelection}
          </p>
        </div>

        <div className="mb-4">
          <h2 className="fw-bold text-primary mb-0">${lottery.price}</h2>
          <small className="text-muted fw-bold text-uppercase opacity-50">per prediction</small>
        </div>

        <Button
          variant={`outline-lottery-${lottery.color}`}
          className="w-100 py-3 fw-bold rounded-3"
          onClick={() => navigate(`/predictions?lottery=${lottery.lotteryType}`)}
        >
          Purchase Prediction
        </Button>
      </Card.Body>
    </Card>
  );

  return (
    <Container className="py-5 mt-5">
      {/* Header */}
      <Row className="mb-5 pt-4">
        <Col className="text-center">
          <h1 className="display-4 fw-bold mb-3 text-gradient">Lottery Prediction Pricing</h1>
          <p className="lead text-muted mx-auto" style={{ maxWidth: '600px' }}>
            Get accurate predictions to identify non-viable numbers and improve your odds for all major lottery games.
          </p>
        </Col>
      </Row>

      {/* Trial Status */}
      <Row className="mb-5">
        <Col>
          <TrialStatus />
        </Col>
      </Row>

      {/* National Lotteries */}
      <div className="mb-5 py-4">
        <div className="text-center mb-5">
          <Badge bg="primary" className="px-3 py-2 mb-3 rounded-pill text-uppercase tracking-wider fw-bold">National Games</Badge>
          <h2 className="display-6 fw-bold">National Lotteries</h2>
          <p className="text-muted">Multi-state lottery games with larger jackpots</p>
        </div>
        <Row className="g-4 justify-content-center">
          {nationalLotteries.map((lottery, index) => (
            <Col lg={4} md={6} key={index}>
              <LotteryCard lottery={lottery} />
            </Col>
          ))}
        </Row>
      </div>

      {/* State & Daily Games Grid */}
      <div className="py-5 border-top">
        <Row className="g-5">
          {/* State Lotteries */}
          <Col lg={6}>
            <div className="text-center text-lg-start mb-5">
              <Badge bg="success" className="px-3 py-2 mb-3 rounded-pill text-uppercase tracking-wider fw-bold">Regional Games</Badge>
              <h2 className="display-6 fw-bold">State Lotteries</h2>
              <p className="text-muted">State-specific lottery games with better odds</p>
            </div>
            <Row className="g-4">
              {stateLotteries.map((lottery, index) => (
                <Col md={12} key={index}>
                  <LotteryCard lottery={lottery} />
                </Col>
              ))}
            </Row>
          </Col>

          {/* Daily Games */}
          <Col lg={6}>
            <div className="text-center text-lg-start mb-5">
              <Badge bg="info" className="px-3 py-2 mb-3 rounded-pill text-uppercase tracking-wider fw-bold">Frequent Games</Badge>
              <h2 className="display-6 fw-bold">Daily Games</h2>
              <p className="text-muted">Games with multiple daily drawings</p>
            </div>
            <Row className="g-4">
              {dailyGames.map((lottery, index) => (
                <Col md={12} key={index}>
                  <LotteryCard lottery={lottery} />
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </div>
    </Container>
  );
};

export default Pricing;