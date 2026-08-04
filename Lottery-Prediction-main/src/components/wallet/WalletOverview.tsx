import React from 'react';
import { Card, Row, Col, Button, Spinner, Alert } from 'react-bootstrap';
import { useWallet } from '../../contexts/WalletContext';
import { FaWallet, FaArrowUp, FaArrowDown, FaHistory, FaPlus, FaMinus } from 'react-icons/fa';

const WalletOverview: React.FC = () => {
  const { 
    wallet, 
    walletStats, 
    loading, 
    error, 
    formatCurrency, 
    refreshWallet 
  } = useWallet();

  if (loading && !wallet) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading wallet...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="mb-4">
        <Alert.Heading>Error Loading Wallet</Alert.Heading>
        <p>{error}</p>
        <Button variant="outline-danger" size="sm" onClick={refreshWallet}>
          Try Again
        </Button>
      </Alert>
    );
  }

  if (!wallet) {
    return (
      <Alert variant="info" className="mb-4">
        <Alert.Heading>No Wallet Found</Alert.Heading>
        <p>Your wallet will be created automatically when you make your first transaction.</p>
      </Alert>
    );
  }

  return (
    <div className="wallet-overview">
      <Row className="g-4">
        {/* Main Balance Card */}
        <Col lg={8}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h5 className="card-title mb-1">
                    <FaWallet className="me-2 text-primary" />
                    Wallet Balance
                  </h5>
                  <p className="text-muted mb-0">Available funds</p>
                </div>
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  onClick={refreshWallet}
                  disabled={loading}
                >
                  {loading ? <Spinner size="sm" /> : 'Refresh'}
                </Button>
              </div>
              
              <div className="text-center py-3">
                <h2 className="display-4 fw-bold text-primary mb-2">
                  {formatCurrency(wallet.balance)}
                </h2>
                <p className="text-muted">
                  Last updated: {wallet.lastTransactionDate 
                    ? new Date(wallet.lastTransactionDate).toLocaleDateString()
                    : 'Never'
                  }
                </p>
              </div>

              <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                <Button variant="success" size="lg" className="me-md-2">
                  <FaPlus className="me-2" />
                  Add Funds
                </Button>
                <Button variant="outline-primary" size="lg">
                  <FaMinus className="me-2" />
                  Withdraw
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Quick Stats */}
        <Col lg={4}>
          <Row className="g-3">
            <Col xs={12}>
              <Card className="h-100 shadow-sm">
                <Card.Body className="text-center">
                  <FaArrowUp className="text-success fs-2 mb-2" />
                  <h6 className="card-title">Total Deposited</h6>
                  <h4 className="text-success fw-bold">
                    {formatCurrency(wallet.totalDeposited)}
                  </h4>
                </Card.Body>
              </Card>
            </Col>
            
            <Col xs={12}>
              <Card className="h-100 shadow-sm">
                <Card.Body className="text-center">
                  <FaArrowDown className="text-danger fs-2 mb-2" />
                  <h6 className="card-title">Total Withdrawn</h6>
                  <h4 className="text-danger fw-bold">
                    {formatCurrency(wallet.totalWithdrawn)}
                  </h4>
                </Card.Body>
              </Card>
            </Col>
            
            <Col xs={12}>
              <Card className="h-100 shadow-sm">
                <Card.Body className="text-center">
                  <FaHistory className="text-info fs-2 mb-2" />
                  <h6 className="card-title">Transactions</h6>
                  <h4 className="text-info fw-bold">
                    {wallet.transactions.length}
                  </h4>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Additional Stats */}
      {walletStats && (
        <Row className="mt-4">
          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Body>
                <h6 className="card-title">This Month</h6>
                <p className="text-muted mb-0">
                  {walletStats.monthlyStats.thisMonth} transactions
                </p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Body>
                <h6 className="card-title">Last Month</h6>
                <p className="text-muted mb-0">
                  {walletStats.monthlyStats.lastMonth} transactions
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default WalletOverview;







