import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaBolt, FaMoneyBillWave, FaFlag, FaBullseye, FaDice, FaBuilding, FaCalendar } from 'react-icons/fa';
import TrialStatus from '../components/TrialStatus';

const Pricing: React.FC = () => {
  const navigate = useNavigate();

  const nationalLotteries = [
    {
      name: "Powerball",
      location: "USA",
      icon: <FaBolt className="text-warning" />,
      numberSelection: "Pick 5 from 69 + 1 from 26",
      price: 2,
      drawSchedule: "Wednesday, 8:59 PM EST",
      lotteryType: "powerball"
    },
    {
      name: "Mega Millions",
      location: "USA",
      icon: <FaMoneyBillWave className="text-warning" />,
      numberSelection: "Pick 5 from 70 + 1 from 25",
      price: 5,
      drawSchedule: "Tuesday, 11:00 PM EST",
      lotteryType: "megamillion"
    },
    {
      name: "Lotto America",
      location: "USA",
      icon: <FaFlag className="text-primary" />,
      numberSelection: "Pick 5 from 52 + 1 from 10",
      price: 1,
      drawSchedule: "Wednesday, 10:00 PM EST",
      lotteryType: "lottoamerica"
    }
  ];

  const stateLotteries = [
    {
      name: "Gopher 5",
      location: "Minnesota",
      icon: <FaBullseye className="text-danger" />,
      numberSelection: "Pick 5 numbers from 1-47",
      price: 1,
      drawSchedule: "Monday, 6:00 PM CST",
      lotteryType: "gopher5"
    }
  ];

  const dailyGames = [
    {
      name: "Pick 3",
      location: "Minnesota",
      icon: <FaDice className="text-dark" />,
      numberSelection: "Pick 3 numbers from 0-9",
      price: 1,
      drawSchedule: "Daily, 6:00 PM CST",
      lotteryType: "pick3"
    }
  ];

  const LotteryCard = ({ lottery }: { lottery: any }) => (
    <Card className="h-100 border-0 shadow-sm">
      <Card.Body className="p-4">
        <div className="d-flex align-items-center mb-3">
          <div className="me-3" style={{ fontSize: '2rem' }}>
            {lottery.icon}
          </div>
          <div>
            <h5 className="card-title mb-1">{lottery.name}</h5>
            <p className="text-muted small mb-0">{lottery.location}</p>
          </div>
        </div>

        <p className="text-muted small mb-3">{lottery.numberSelection}</p>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="fw-bold">${lottery.price}/prediction</span>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/predictions?lottery=${lottery.lotteryType}`)}
          >
            Purchase
          </Button>
        </div>

        {/* <p className="text-muted small mb-0">{lottery.drawSchedule}</p> */}
      </Card.Body>
    </Card>
  );

  return (
    <Container className="py-5">
      {/* Header */}
      <Row className="mb-5">
        <Col className="text-center">
          <h1 className="display-4 fw-bold mb-4">Lottery Prediction Pricing</h1>
          <p className="lead text-muted">
            Purchase predictions for your favorite lottery games
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
      <Row className="mb-5">
        <Col>
          <h2 className="h4 fw-bold mb-3">National Lotteries</h2>
          <Row className="g-4">
            {nationalLotteries.map((lottery, index) => (
              <Col lg={4} key={index}>
                <LotteryCard lottery={lottery} />
              </Col>
            ))}
          </Row>
        </Col>
      </Row>

      {/* State Lotteries */}
      <Row className="mb-5">
        <Col>
          <div className="d-flex align-items-center mb-3">
            <FaBuilding className="me-2 text-primary" />
            <h2 className="h4 fw-bold mb-0">State Lotteries</h2>
          </div>
          <p className="text-muted mb-4">State-specific lottery games</p>
          <Row className="g-4">
            {stateLotteries.map((lottery, index) => (
              <Col lg={4} key={index}>
                <LotteryCard lottery={lottery} />
              </Col>
            ))}
          </Row>
        </Col>
      </Row>

      {/* Daily Games */}
      <Row className="mb-5">
        <Col>
          <div className="d-flex align-items-center mb-3">
            <FaCalendar className="me-2 text-primary" />
            <h2 className="h4 fw-bold mb-0">Daily Games</h2>
          </div>
          <p className="text-muted mb-4">Games with daily drawings</p>
          <Row className="g-4">
            {dailyGames.map((lottery, index) => (
              <Col lg={4} key={index}>
                <LotteryCard lottery={lottery} />
              </Col>
            ))}
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default Pricing;