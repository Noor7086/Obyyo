import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { predictionService } from '../../services/predictionService';
import { walletService } from '../../services/walletService';
import { lotteryService } from '../../services/lotteryService';
import { 
  FaUser
} from 'react-icons/fa';
import TrialCountdown from '../../components/TrialCountdown';

interface UserStats {
  totalPredictions: number;
  activeLotteries: number;
  trialDaysLeft: number;
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
    lottery?: string;
  }>;
  walletBalance: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats>({
    totalPredictions: 0,
    activeLotteries: 0,
    trialDaysLeft: 0,
    recentActivity: [],
    walletBalance: 0
  });

  // Calculate trial days left from user model fields (hasUsedTrial, trialEndDate)
  const trialDaysLeft = useMemo(() => {
    if (!user) return 0;
    
    // If user has used trial, return 0
    if (user.hasUsedTrial) {
      return 0;
    }
    
    // If no trial end date, return 0
    if (!user.trialEndDate) {
      return 0;
    }
    
    // Check if trial is still active
    const now = new Date();
    const endDate = new Date(user.trialEndDate);
    const diffTime = endDate.getTime() - now.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Return days if positive, otherwise 0 (trial expired)
    return Math.max(0, days);
  }, [user]);

  useEffect(() => {
    const loadUserStats = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        // Loading user stats
        
        // Fetch data from multiple endpoints in parallel
        const [purchasesResponse, walletStatsResponse, lotteriesResponse] = await Promise.allSettled([
          predictionService.getMyPurchases(1, 100), // Get purchases for total predictions
          walletService.getWalletStats(), // Get wallet balance
          lotteryService.getLotteries() // Get active lotteries
        ]);

        // Calculate total predictions from purchases
        let totalPredictions = 0;
        let recentActivity: Array<{
          type: string;
          description: string;
          timestamp: string;
          lottery?: string;
        }> = [];

        if (purchasesResponse.status === 'fulfilled') {
          const purchases = purchasesResponse.value;
          // Count all valid purchases: completed, pending, and trial (free trial predictions)
          totalPredictions = purchases.filter(p => 
            p.paymentStatus === 'completed' || 
            p.paymentStatus === 'pending' || 
            p.paymentStatus === 'trial'
          ).length;
          
          // Get recent activity from purchases (last 5)
          recentActivity = purchases
            .slice(0, 5)
            .map(purchase => ({
              type: 'purchase',
              description: `Purchased ${purchase.prediction?.lotteryType || 'prediction'} prediction`,
              timestamp: purchase.createdAt || new Date().toISOString(),
              lottery: purchase.prediction?.lotteryType || ''
            }));
        } else {
          console.error('Error fetching purchases:', purchasesResponse.reason);
        }

        // Get wallet balance
        let walletBalance = user?.walletBalance || 0;
        if (walletStatsResponse.status === 'fulfilled') {
          walletBalance = walletStatsResponse.value.currentBalance || user?.walletBalance || 0;
        } else {
          console.error('Error fetching wallet stats:', walletStatsResponse.reason);
        }

        // Get active lotteries count
        let activeLotteries = 0;
        if (lotteriesResponse.status === 'fulfilled') {
          activeLotteries = lotteriesResponse.value.filter(l => l.isActive).length;
        } else {
          console.error('Error fetching lotteries:', lotteriesResponse.reason);
        }

        setStats({
          totalPredictions,
          activeLotteries,
          trialDaysLeft: 0, // Will be calculated from user object
          recentActivity,
          walletBalance
        });

        // User stats loaded successfully
      } catch (error: any) {
        console.error('Error loading user stats:', error);
        // Set default values on error
        setStats({
          totalPredictions: 0,
          activeLotteries: 0,
          trialDaysLeft: 0,
          recentActivity: [],
          walletBalance: user?.walletBalance || 0
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserStats();
  }, [user]);

  const quickActions = [
    {
      title: 'View Predictions',
      description: 'Browse available lottery predictions',
      icon: <i className="bi bi-graph-up text-primary fs-4"></i>,
      action: () => navigate('/predictions'),
      variant: 'primary'
    },
    {
      title: 'My Predictions',
      description: 'View your purchased predictions',
      icon: <i className="bi bi-download text-success fs-4"></i>,
      action: () => navigate('/my-predictions'),
      variant: 'success'
    },
    {
      title: 'Number Generator',
      description: 'Generate random lottery numbers',
      icon: <i className="bi bi-shuffle text-warning fs-4"></i>,
      action: () => navigate('/tools/number-generator'),
      variant: 'warning'
    },
    {
      title: 'View Results',
      description: 'Check latest lottery results',
      icon: <i className="bi bi-bell text-info fs-4"></i>,
      action: () => navigate('/results'),
      variant: 'info'
    },
    {
      title: 'My Wallet',
      description: 'Manage your funds and add money',
      icon: <i className="bi bi-wallet2 text-secondary fs-4"></i>,
      action: () => navigate('/wallet'),
      variant: 'secondary'
    }
  ];

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3">Loading your dashboard...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="pt-2 pb-4" style={{ marginTop: '4rem' }}>
      {/* Welcome Section */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">Welcome back, {user?.firstName || 'User'}!</h2>
              <p className="text-muted mb-0">Here's your lottery prediction overview</p>
            </div>
            <div className="d-flex gap-2">
              <Button variant="outline-primary" size="sm" onClick={() => navigate('/profile')}>
                <FaUser className="me-1" />
                Profile
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Trial Countdown */}
      <Row className="mb-4">
        <Col>
          <TrialCountdown />
        </Col>
      </Row>

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <i className="bi bi-graph-up text-primary fs-3 mb-2"></i>
              <h5 className="fw-bold">Total Predictions</h5>
              <h3 className="fw-bold text-primary">{stats.totalPredictions}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <i className="bi bi-wallet2 text-warning fs-3 mb-2"></i>
              <h5 className="fw-bold">Wallet Balance</h5>
              <h3 className="fw-bold text-warning">${stats.walletBalance.toFixed(2)}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <i className="bi bi-clock-history text-info fs-3 mb-2"></i>
              <h5 className="fw-bold">Trial Days Left</h5>
              <h3 className="fw-bold text-info">{trialDaysLeft}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <Row>
        <Col>
          <h4 className="mb-3">Quick Actions</h4>
        </Col>
      </Row>
      <Row>
        {quickActions.map((action, index) => (
          <Col md={6} lg={3} className="mb-3" key={index}>
            <Card 
              className="h-100 border-0 shadow-sm quick-action-card"
              style={{ cursor: 'pointer' }}
              onClick={action.action}
            >
              <Card.Body className="text-center">
                <div className="mb-3">
                  {action.icon}
                </div>
                <h6 className="mb-2">{action.title}</h6>
                <p className="text-muted small mb-0">{action.description}</p>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Recent Activity */}
      <Row className="mt-5">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom">
              <h5 className="mb-0">Recent Activity</h5>
            </Card.Header>
            <Card.Body>
              {stats.recentActivity && stats.recentActivity.length > 0 ? (
                <div>
                  {stats.recentActivity.map((activity, index) => (
                    <div key={index} className="d-flex align-items-start mb-3 pb-3 border-bottom">
                      <div className="me-3">
                        <i className="bi bi-bell text-primary fs-5"></i>
                      </div>
                      <div className="flex-grow-1">
                        <p className="mb-1 fw-medium">{activity.description}</p>
                        <small className="text-muted">
                          {new Date(activity.timestamp).toLocaleString()}
                          {activity.lottery && (
                            <span className="badge bg-secondary ms-2">
                              {activity.lottery}
                            </span>
                          )}
                        </small>
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    className="w-100 mt-2"
                    onClick={() => navigate('/my-predictions')}
                  >
                    View All Activity
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="bi bi-bell text-muted mb-3" style={{ fontSize: '3rem' }}></i>
                  <p className="text-muted">No recent activity to display</p>
                  <Button variant="outline-primary" size="sm" onClick={() => navigate('/my-predictions')}>
                    View All Activity
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
