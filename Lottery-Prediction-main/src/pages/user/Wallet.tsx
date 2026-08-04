import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Alert, Spinner, Table, Badge } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { walletService, Transaction, WalletStats } from '../../services/walletService';
import { FaWallet, FaPlus, FaHistory, FaCreditCard, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import toast from 'react-hot-toast';

const Wallet: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const hasRefreshedRef = useRef(false);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);


  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [walletStats, setWalletStats] = useState<WalletStats | null>(null);
  const [loadingWalletStats, setLoadingWalletStats] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Refresh data when navigating to wallet page
  useEffect(() => {
    if (user && location.pathname === '/wallet') {
      fetchWalletStats();
      fetchTransactions(true); // Always fetch page 1 when navigating to wallet
      hasRefreshedRef.current = true;
    }
  }, [location.pathname, user]);

  useEffect(() => {
    if (user) {
      fetchWalletStats();
      fetchTransactions(); // Fetch transactions on mount
    }
  }, [user]); // Fetch stats when user is available

  useEffect(() => {
    if (user && currentPage !== undefined && currentPage > 0) {
      fetchTransactions(); // Fetch transactions when page changes
    }
  }, [currentPage]); // Fetch transactions when page changes

  // Listen for wallet updates from other pages
  useEffect(() => {
    const handleWalletUpdate = () => {
      console.log('Wallet update event received, refreshing transactions...');
      // Reset to first page and fetch latest transactions
      setTimeout(() => {
        fetchTransactions(true); // Force page 1
        fetchWalletStats();
        refreshUser();
      }, 1000); // Delay to ensure backend has saved the transaction
    };

    window.addEventListener('walletBalanceUpdated', handleWalletUpdate);

    return () => {
      window.removeEventListener('walletBalanceUpdated', handleWalletUpdate);
    };
  }, []);

  const fetchTransactions = async (forcePageOne = false) => {
    try {
      setLoadingTransactions(true);
      const pageToFetch = forcePageOne ? 1 : currentPage;
      const response = await walletService.getTransactions({
        page: pageToFetch,
        limit: 10
      });
      console.log('Fetched transactions:', response.transactions); // Debug log
      console.log('Total transactions:', response.pagination.totalTransactions); // Debug log
      console.log('Current page:', response.pagination.currentPage); // Debug log
      if (forcePageOne && pageToFetch === 1) {
        setCurrentPage(1);
      }
      setTransactions(response.transactions);
      setTotalPages(response.pagination.totalPages);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast.error(error.message || 'Failed to fetch transactions');
    } finally {
      setLoadingTransactions(false);
    }
  };

  const fetchWalletStats = async () => {
    try {
      setLoadingWalletStats(true);
      const stats = await walletService.getWalletStats();
      console.log('Wallet stats fetched:', stats); // Debug log
      setWalletStats(stats);
    } catch (error: any) {
      console.error('Error fetching wallet stats:', error);
      toast.error('Failed to fetch wallet statistics');
      // Set fallback to user wallet balance
      if (user) {
        setWalletStats({
          currentBalance: user.walletBalance,
          totalDeposited: user.totalDeposited || 0,
          totalWithdrawn: user.totalWithdrawn || 0,
          transactionCount: 0,
          recentTransactions: [],
          monthlyStats: { thisMonth: 0, lastMonth: 0 },
          deposits: {
            last7Days: 0,
            last30Days: 0,
            thisMonth: 0,
            recentTransactions: []
          },
          spending: {
            last7Days: 0,
            last30Days: 0,
            thisMonth: 0,
            recentTransactions: []
          }
        });
      }
    } finally {
      setLoadingWalletStats(false);
    }
  };

  const handleAddFunds = () => {
    setShowAddFundsModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowAddFundsModal(false);
    setAmount('');
    setError('');
    setSuccess('');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and one decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const validateAmount = () => {
    const numAmount = parseFloat(amount);
    if (!amount || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return false;
    }
    if (numAmount < 1) {
      setError('Minimum amount is $1.00');
      return false;
    }
    if (numAmount > 1000) {
      setError('Maximum amount is $1,000.00');
      return false;
    }
    return true;
  };

  const createOrder = (_data: any, actions: any) => {
    if (!validateAmount()) {
      return Promise.reject('Invalid amount');
    }

    return actions.order.create({
      purchase_units: [
        {
          amount: {
            value: amount,
            currency_code: 'USD'
          },
          description: `Add $${amount} to wallet balance`
        }
      ]
    });
  };

  const onApprove = async (_data: any, actions: any) => {
    try {
      setLoading(true);
      setError('');

      // Capture the payment
      const details = await actions.order.capture();

      // Send payment details to backend to update wallet
      const depositAmount = parseFloat(amount);

      await walletService.depositFunds({
        amount: depositAmount,
        description: `PayPal deposit - Order ID: ${details.id}`,
        reference: details.id
      });

      // Refresh wallet stats and transactions
      await fetchWalletStats();
      await fetchTransactions();

      // Refresh user data to sync wallet balance in context
      await refreshUser();

      // Trigger a custom event to update navbar wallet balance
      window.dispatchEvent(new Event('walletBalanceUpdated'));

      setSuccess(`Successfully added $${amount} to your wallet!`);
      toast.success(`Successfully added $${amount} to your wallet!`);

      // Close modal after a short delay
      setTimeout(() => {
        handleCloseModal();
      }, 2000);

    } catch (error: any) {
      console.error('Payment error:', error);
      const errorMessage = error.message || 'Payment failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onError = (err: any) => {
    console.error('PayPal error:', err);
    setError('Payment failed. Please try again.');
  };

  return (
    <Container className="py-4" style={{ marginTop: '4rem' }}>
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
            <Button
              variant="success"
              size="lg"
              onClick={handleAddFunds}
            >
              <FaPlus className="me-2" />
              Add Funds
            </Button>
          </div>
        </Col>
      </Row>

      <Row className="g-4">
        {/* Wallet Balance Card */}
        <Col lg={8}>
          <Card className="h-100 shadow-sm">
            <Card.Body className="p-4">
              {loadingWalletStats ? (
                <div className="text-center py-4">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3 text-muted">Loading balance...</p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <FaWallet className="text-primary mb-3" style={{ fontSize: '4rem' }} />
                  <h3 className="mb-2">Current Balance</h3>
                  <h1 className="display-4 fw-bold text-primary mb-3">
                    ${(walletStats?.currentBalance ?? user?.walletBalance ?? 0).toFixed(2)}
                  </h1>
                  <p className="text-muted">
                    Available funds for lottery predictions
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Quick Stats */}
        <Col lg={4}>
          <Row className="g-3">
            <Col xs={12}>
              <Card className="h-100 shadow-sm">
                <Card.Body className="text-center">
                  <FaPlus className="text-success fs-2 mb-2" />
                  <h6 className="card-title">Total Deposited</h6>
                  <h4 className="text-success fw-bold">
                    ${(walletStats?.totalDeposited ?? user?.totalDeposited ?? 0).toFixed(2)}
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
                    {walletStats?.transactionCount ?? 0}
                  </h4>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12}>
              <Card className="h-100 shadow-sm">
                <Card.Body className="text-center">
                  <FaCreditCard className="text-warning fs-2 mb-2" />
                  <h6 className="card-title">Last Payment</h6>
                  <p className="text-muted small mb-0">
                    {walletStats?.lastTransactionDate
                      ? new Date(walletStats.lastTransactionDate).toLocaleDateString()
                      : 'Never'
                    }
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Transaction History */}
      <Row className="mt-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">
                  <FaHistory className="me-2" />
                  Transaction History
                </h5>
              </div>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => {
                  setCurrentPage(1);
                  fetchTransactions(true);
                  fetchWalletStats();
                }}
                disabled={loadingTransactions}
              >
                <FaHistory className="me-2" />
                Refresh
              </Button>
            </Card.Header>
            <Card.Body>
              {loadingTransactions ? (
                <div className="text-center py-5">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                  <p className="mt-3 text-muted">Loading transactions...</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-5">
                  <FaHistory className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                  <h5 className="text-muted">No transactions yet</h5>
                  <p className="text-muted">Your transaction history will appear here after you add funds.</p>
                  <Button variant="outline-primary" onClick={handleAddFunds}>
                    <FaPlus className="me-2" />
                    Add Your First Funds
                  </Button>
                </div>
              ) : (
                <>
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => (
                        <tr key={transaction._id}>
                          <td>
                            {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              {transaction.type === 'credit' || transaction.type === 'bonus' || transaction.type === 'refund' ? (
                                <FaArrowUp className="text-success me-2" />
                              ) : (
                                <FaArrowDown className="text-danger me-2" />
                              )}
                              <span>{walletService.formatTransactionType(transaction.type)}</span>
                            </div>
                          </td>
                          <td>{transaction.description}</td>
                          <td>
                            <span className={
                              transaction.type === 'credit' || transaction.type === 'bonus' || transaction.type === 'refund'
                                ? 'text-success fw-bold'
                                : 'text-danger fw-bold'
                            }>
                              {transaction.type === 'credit' || transaction.type === 'bonus' || transaction.type === 'refund' ? '+' : '-'}
                              ${transaction.amount.toFixed(2)}
                            </span>
                          </td>
                          <td>
                            <Badge
                              bg={
                                transaction.status === 'completed' ? 'success' :
                                  transaction.status === 'pending' ? 'warning' :
                                    transaction.status === 'failed' ? 'danger' : 'secondary'
                              }
                            >
                              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center align-items-center mt-3">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="me-2"
                      >
                        Previous
                      </Button>
                      <span className="mx-3">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add Funds Modal */}
      <Modal show={showAddFundsModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaPlus className="me-2 text-success" />
            Add Funds to Wallet
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}

          {success && (
            <Alert variant="success" className="mb-3">
              {success}
            </Alert>
          )}

          <div className="mb-4">
            <h6>Current Balance: ${(user?.walletBalance ?? walletStats?.currentBalance ?? 0).toFixed(2)}</h6>
          </div>

          <Form.Group className="mb-4">
            <Form.Label>Enter amount you want to add to your account</Form.Label>
            <Form.Control
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              className="form-control-lg"
              disabled={loading}
            />
            <Form.Text className="text-muted">
              Minimum: $1.00 | Maximum: $1,000.00
            </Form.Text>
          </Form.Group>

          {amount && parseFloat(amount) > 0 && (
            <div className="text-center">
              <h6 className="mb-3">Payment Amount: ${parseFloat(amount).toFixed(2)}</h6>

              <PayPalScriptProvider
                key={`paypal-${amount}`}
                options={{
                  clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || "",
                  currency: "USD"
                }}
              >
                <PayPalButtons
                  key={`buttons-${amount}`}
                  createOrder={createOrder}
                  onApprove={onApprove}
                  onError={onError}
                  style={{
                    layout: 'vertical',
                    color: 'blue',
                    shape: 'rect',
                    label: 'paypal'
                  }}
                />
              </PayPalScriptProvider>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal} disabled={loading}>
            Cancel
          </Button>
          {loading && (
            <div className="d-flex align-items-center">
              <Spinner size="sm" className="me-2" />
              Processing payment...
            </div>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Wallet;
