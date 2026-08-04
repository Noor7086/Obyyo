import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Form, Row, Col, Spinner, Alert, Pagination } from 'react-bootstrap';
import { useWallet } from '../../contexts/WalletContext';
import { FaFilter, FaEye, FaDownload } from 'react-icons/fa';

const TransactionHistory: React.FC = () => {
  const { 
    transactions, 
    loading, 
    error, 
    fetchTransactions,
    formatCurrency,
    formatTransactionType,
    getTransactionIcon,
    getTransactionColorClass
  } = useWallet();

  const [filters, setFilters] = useState({
    type: '',
    status: '',
    page: 1,
    limit: 10
  });
  const [pagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalTransactions: 0,
    hasNext: false,
    hasPrev: false
  });

  useEffect(() => {
    loadTransactions();
  }, [filters]);

  const loadTransactions = async () => {
    try {
      await fetchTransactions(filters);
      // Note: fetchTransactions doesn't return pagination info in current implementation
      // This would need to be updated in the context
    } catch (err) {
      console.error('Failed to load transactions:', err);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({
      ...prev,
      page
    }));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { variant: 'success', text: 'Completed' },
      pending: { variant: 'warning', text: 'Pending' },
      failed: { variant: 'danger', text: 'Failed' },
      cancelled: { variant: 'secondary', text: 'Cancelled' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'secondary', text: status };
    
    return (
      <Badge bg={config.variant} className="text-capitalize">
        {config.text}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading transactions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error Loading Transactions</Alert.Heading>
        <p>{error}</p>
        <Button variant="outline-danger" size="sm" onClick={loadTransactions}>
          Try Again
        </Button>
      </Alert>
    );
  }

  return (
    <div className="transaction-history">
      <Card className="shadow-sm">
        <Card.Header className="bg-white border-bottom">
          <div className="d-flex align-items-center justify-content-between">
            <h5 className="card-title mb-0">
              <FaEye className="me-2" />
              Transaction History
            </h5>
            <Button variant="outline-primary" size="sm">
              <FaDownload className="me-2" />
              Export
            </Button>
          </div>
        </Card.Header>

        <Card.Body>
          {/* Filters */}
          <Row className="mb-4">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Type</Form.Label>
                <Form.Select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="credit">Deposit</option>
                  <option value="debit">Payment</option>
                  <option value="withdrawal">Withdrawal</option>
                  <option value="bonus">Bonus</option>
                  <option value="refund">Refund</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Per Page</Form.Label>
                <Form.Select
                  value={filters.limit}
                  onChange={(e) => handleFilterChange('limit', e.target.value)}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3} className="d-flex align-items-end">
              <Button 
                variant="outline-secondary" 
                onClick={() => setFilters({ type: '', status: '', page: 1, limit: 10 })}
              >
                <FaFilter className="me-2" />
                Clear Filters
              </Button>
            </Col>
          </Row>

          {/* Transactions Table */}
          {transactions.length === 0 ? (
            <div className="text-center py-5">
              <FaEye className="text-muted fs-1 mb-3" />
              <h5 className="text-muted">No transactions found</h5>
              <p className="text-muted">Your transaction history will appear here.</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction._id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <span className="me-2 fs-5">
                              {getTransactionIcon(transaction.type)}
                            </span>
                            <span className={getTransactionColorClass(transaction.type)}>
                              {formatTransactionType(transaction.type)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div className="fw-medium">{transaction.description}</div>
                            {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
                              <small className="text-muted">
                                {JSON.stringify(transaction.metadata)}
                              </small>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`fw-bold ${
                            transaction.type === 'credit' || transaction.type === 'bonus' || transaction.type === 'refund'
                              ? 'text-success'
                              : 'text-danger'
                          }`}>
                            {transaction.type === 'credit' || transaction.type === 'bonus' || transaction.type === 'refund' ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </span>
                        </td>
                        <td>
                          {getStatusBadge(transaction.status)}
                        </td>
                        <td>
                          <small className="text-muted">
                            {formatDate(transaction.createdAt)}
                          </small>
                        </td>
                        <td>
                          {transaction.reference && (
                            <small className="text-muted font-monospace">
                              {transaction.reference}
                            </small>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <Pagination>
                    <Pagination.Prev 
                      disabled={!pagination.hasPrev}
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                    />
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                      <Pagination.Item
                        key={page}
                        active={page === pagination.currentPage}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next 
                      disabled={!pagination.hasNext}
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                    />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default TransactionHistory;



