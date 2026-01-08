import React, { useState, useEffect } from 'react';
import { Card, Alert, Button } from 'react-bootstrap';
import { FaClock, FaExclamationTriangle, FaGift } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const TrialCountdown: React.FC = () => {
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!user || !user.isInTrial || !user.trialEndDate) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const trialEnd = new Date(user.trialEndDate).getTime();
      const difference = trialEnd - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
        setIsExpired(false);
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsExpired(true);
      }
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [user]);

  if (!user || !user.isInTrial) return null;

  const formatTime = (value: number) => value.toString().padStart(2, '0');

  if (isExpired) {
    return (
      <Alert variant="warning" className="border-0 shadow-sm">
        <div className="d-flex align-items-center">
          <FaExclamationTriangle className="me-3 fs-4 text-warning" />
          <div className="flex-grow-1">
            <h6 className="alert-heading mb-1">Free Trial Expired</h6>
            <p className="mb-2">Your 7-day free trial has ended. Purchase predictions to continue using our service.</p>
            <Button variant="primary" size="sm" href="/pricing">
              View Pricing
            </Button>
          </div>
        </div>
      </Alert>
    );
  }

  return (
    <Card className="border-0 shadow-sm mb-4">
      <Card.Body className="p-4">
        <div className="d-flex align-items-center mb-3">
          <FaGift className="me-3 fs-4 text-success" />
          <div>
            <h5 className="card-title mb-1">Free Trial Active</h5>
            <p className="text-muted small mb-0">Enjoying your 7-day free trial</p>
          </div>
        </div>

        <div className="row text-center">
          <div className="col-3">
            <div className="bg-primary text-white rounded p-3 mb-2">
              <div className="h4 mb-0 fw-bold">{formatTime(timeLeft.days)}</div>
              <small>Days</small>
            </div>
          </div>
          <div className="col-3">
            <div className="bg-primary text-white rounded p-3 mb-2">
              <div className="h4 mb-0 fw-bold">{formatTime(timeLeft.hours)}</div>
              <small>Hours</small>
            </div>
          </div>
          <div className="col-3">
            <div className="bg-primary text-white rounded p-3 mb-2">
              <div className="h4 mb-0 fw-bold">{formatTime(timeLeft.minutes)}</div>
              <small>Minutes</small>
            </div>
          </div>
          <div className="col-3">
            <div className="bg-primary text-white rounded p-3 mb-2">
              <div className="h4 mb-0 fw-bold">{formatTime(timeLeft.seconds)}</div>
              <small>Seconds</small>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">
              <FaClock className="me-1" />
              Trial ends on {new Date(user.trialEndDate).toLocaleDateString()}
            </small>
            <Button variant="outline-primary" size="sm" href="/pricing">
              View Pricing
            </Button>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default TrialCountdown;

