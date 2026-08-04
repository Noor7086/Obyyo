import React from 'react';
import { Alert, Button } from 'react-bootstrap';
import { FaGift } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const TrialStatus: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  // Don't show this component if user is in trial or has used trial
  // Trial info should only be shown in dashboard
  const hasUsedTrialValue = user.hasUsedTrial ?? false;
  
  // Check if trial has ended (trialEndDate exists and is in the past)
  const trialHasEnded = user.trialEndDate && new Date(user.trialEndDate) < new Date();
  
  if (user.isInTrial || hasUsedTrialValue || trialHasEnded) {
    return null;
  }

  // User has never used trial (and not currently in trial) - should not happen but as fallback
  return (
    <Alert variant="info" className="border-0 shadow-sm">
      <div className="d-flex align-items-center">
        <FaGift className="me-3 fs-4 text-info" />
        <div className="flex-grow-1">
          <h6 className="alert-heading mb-1">Start Your Free Trial</h6>
          <p className="mb-2">Get 7 days of free predictions for your selected lottery game.</p>
          <Button variant="info" size="sm" href="/register">
            Start Free Trial
          </Button>
        </div>
      </div>
    </Alert>
  );
};

export default TrialStatus;

