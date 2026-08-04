import React, { useState } from 'react';
import { Container, Row, Col, Button, Tab, Nav } from 'react-bootstrap';
import { WalletProvider } from '../../contexts/WalletContext';
import WalletOverview from './WalletOverview';
import TransactionHistory from './TransactionHistory';
import WalletActions from './WalletActions';
import { FaWallet, FaHistory, FaPlus, FaMinus, FaCreditCard, FaGift } from 'react-icons/fa';

const WalletContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'deposit' | 'withdraw' | 'payment' | 'bonus' | null>(null);

  const handleActionClick = (action: 'deposit' | 'withdraw' | 'payment' | 'bonus') => {
    setActionType(action);
    setShowActionModal(true);
  };

  const handleCloseModal = () => {
    setShowActionModal(false);
    setActionType(null);
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <h2 className="mb-1">
                <FaWallet className="me-2 text-primary" />
                My Wallet
              </h2>
              <p className="text-muted mb-0">Manage your funds and view transaction history</p>
            </div>
            <div className="d-flex gap-2">
              <Button 
                variant="success" 
                size="sm"
                onClick={() => handleActionClick('deposit')}
              >
                <FaPlus className="me-1" />
                Add Funds
              </Button>
              <Button 
                variant="outline-primary" 
                size="sm"
                onClick={() => handleActionClick('withdraw')}
              >
                <FaMinus className="me-1" />
                Withdraw
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'overview')}>
        <Row>
          <Col lg={3}>
            <Nav variant="pills" className="flex-column">
              <Nav.Item>
                <Nav.Link eventKey="overview" className="d-flex align-items-center">
                  <FaWallet className="me-2" />
                  Overview
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="transactions" className="d-flex align-items-center">
                  <FaHistory className="me-2" />
                  Transactions
                </Nav.Link>
              </Nav.Item>
            </Nav>

            {/* Quick Actions Sidebar */}
            <div className="mt-4">
              <h6 className="text-muted mb-3">Quick Actions</h6>
              <div className="d-grid gap-2">
                <Button 
                  variant="outline-success" 
                  size="sm"
                  onClick={() => handleActionClick('deposit')}
                >
                  <FaPlus className="me-2" />
                  Add Funds
                </Button>
                <Button 
                  variant="outline-danger" 
                  size="sm"
                  onClick={() => handleActionClick('withdraw')}
                >
                  <FaMinus className="me-2" />
                  Withdraw
                </Button>
                <Button 
                  variant="outline-primary" 
                  size="sm"
                  onClick={() => handleActionClick('payment')}
                >
                  <FaCreditCard className="me-2" />
                  Make Payment
                </Button>
                <Button 
                  variant="outline-warning" 
                  size="sm"
                  onClick={() => handleActionClick('bonus')}
                >
                  <FaGift className="me-2" />
                  Add Bonus
                </Button>
              </div>
            </div>
          </Col>

          <Col lg={9}>
            <Tab.Content>
              <Tab.Pane eventKey="overview">
                <WalletOverview />
              </Tab.Pane>
              <Tab.Pane eventKey="transactions">
                <TransactionHistory />
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>

      {/* Action Modal */}
      <WalletActions
        show={showActionModal}
        onHide={handleCloseModal}
        action={actionType}
      />
    </Container>
  );
};

const Wallet: React.FC = () => {
  return (
    <WalletProvider>
      <WalletContent />
    </WalletProvider>
  );
};

export default Wallet;



