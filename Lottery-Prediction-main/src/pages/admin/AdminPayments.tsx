import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import { LotteryType } from '../../types';

interface Purchase {
  id: string;
  userName: string;
  userEmail: string;
  amount: number;
  lotteryType: string;
  lotteryDisplayName: string;
  drawDate: string;
  drawTime: string;
  paymentMethod: 'wallet' | 'stripe' | 'paypal';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId: string;
  createdAt: string;
  isRefunded: boolean;
}

interface Statistics {
  total: number;
  completed: number;
  pending: number;
  failed: number;
  refunded: number;
  totalRevenue: number;
}

interface ApiResponse {
  success: boolean;
  data: {
    purchases: Purchase[];
    statistics?: Statistics;
    pagination: {
      current: number;
      pages: number;
      total: number;
      limit: number;
    };
  };
  message?: string;
}

const AdminPayments: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPurchases, setTotalPurchases] = useState(0);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [filterLottery, setFilterLottery] = useState<LotteryType | 'all' | 'wallet'>('all');

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filter changes
  }, [filterLottery]);

  useEffect(() => {
    fetchPayments();
  }, [currentPage, filterLottery]);

  const fetchPayments = async () => {
    try {
      setLoading(true);

      // First test if the route exists (without auth for testing)
      try {
        const testResponse = await fetch('/api/admin/test-payments');
        const testData = await testResponse.json();
        console.log('✅ Server test route works:', testData);
      } catch (testErr) {
        console.warn('⚠️ Test route not accessible (might require auth):', testErr);
      }

      console.log('📤 Fetching payments from /admin/payments');
      const lotteryParam = filterLottery !== 'all' ? `&lottery=${filterLottery}` : '';
      const response = await apiService.get<ApiResponse>(`/admin/payments?page=${currentPage}&limit=20${lotteryParam}`);
      console.log('✅ Payments response:', response);

      if (response.success && response.data) {
        setPurchases(response.data.purchases || []);
        setTotalPages(response.data.pagination?.pages || 1);
        setTotalPurchases(response.data.pagination?.total || 0);
        setStatistics(response.data.statistics || null);

        if (!response.data.purchases || response.data.purchases.length === 0) {
          console.log('No purchases found - this is expected if no one has purchased predictions yet');
        }
      } else {
        console.error('API response error:', response);
        toast.error(response.message || 'Failed to fetch payments');
      }
    } catch (error: any) {
      console.error('Fetch payments error:', error);
      console.error('Error response:', error.response);
      if (error.response?.status === 404) {
        toast.error('Payments endpoint not found. Please check if backend server is running.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to fetch payments');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodBadge = (method: string) => {
    const badges: { [key: string]: string } = {
      wallet: 'bg-primary',
      stripe: 'bg-success',
      paypal: 'bg-info'
    };
    return badges[method] || 'bg-secondary';
  };

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: string } = {
      completed: 'bg-success',
      pending: 'bg-warning',
      failed: 'bg-danger',
      refunded: 'bg-secondary'
    };
    return badges[status] || 'bg-secondary';
  };

  const getLotteryIcon = (lotteryType: string) => {
    const icons: { [key: string]: string } = {
      powerball: '⚡',
      megamillion: '💰',
      lottoamerica: '🇺🇸',
      gopher5: '🎯',
      pick3: '🎲',
      wallet_deposit: '💳'
    };
    return icons[lotteryType?.toLowerCase()] || '🎰';
  };

  const getLotteryDisplayName = (lotteryType: string, lotteryDisplayName?: string): string => {
    if (lotteryDisplayName && lotteryDisplayName !== 'N/A') {
      return lotteryDisplayName;
    }

    const lotteryNames: { [key: string]: string } = {
      powerball: 'Powerball',
      megamillion: 'Mega Million',
      lottoamerica: 'Lotto America',
      gopher5: 'Gopher 5',
      pick3: 'Pick 3'
    };

    return lotteryNames[lotteryType?.toLowerCase()] || lotteryType || 'N/A';
  };

  return (
    <AdminLayout>
      <div className="admin-content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Recent Payments</h2>
            <p className="text-muted mb-0">View all prediction purchases and payment history</p>
          </div>
          <div className="badge bg-primary fs-6 px-3 py-2">
            Total: {totalPurchases}
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Filter by Type</label>
                <select
                  className="form-select"
                  value={filterLottery}
                  onChange={(e) => setFilterLottery(e.target.value as LotteryType | 'all' | 'wallet')}
                >
                  <option value="all">All Transactions</option>
                  <option value="wallet">Wallet Deposits</option>
                  <option value="powerball">Powerball</option>
                  <option value="megamillion">Mega Million</option>
                  <option value="lottoamerica">Lotto America</option>
                  <option value="gopher5">Gopher 5</option>
                  <option value="pick3">Pick 3</option>

                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card border-success">
                <div className="card-body">
                  <h6 className="text-muted mb-2">Total Revenue</h6>
                  <h4 className="mb-0 text-success">${statistics.totalRevenue.toFixed(2)}</h4>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-primary">
                <div className="card-body">
                  <h6 className="text-muted mb-2">Completed</h6>
                  <h4 className="mb-0 text-primary">{statistics.completed}</h4>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-warning">
                <div className="card-body">
                  <h6 className="text-muted mb-2">Pending</h6>
                  <h4 className="mb-0 text-warning">{statistics.pending}</h4>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-danger">
                <div className="card-body">
                  <h6 className="text-muted mb-2">Failed</h6>
                  <h4 className="mb-0 text-danger">{statistics.failed}</h4>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : purchases.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-5">
              <i className="bi bi-inbox display-4 text-muted"></i>
              <p className="text-muted mt-3">No payments found</p>
            </div>
          </div>
        ) : (
          <>
            <div className="card">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Date & Time</th>
                        <th>User</th>
                        <th>Lottery</th>
                        <th>Draw Date</th>
                        <th>Amount</th>
                        <th>Payment Method</th>
                        <th>Status</th>
                        <th>Transaction ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchases.map((purchase) => (
                        <tr key={purchase.id}>
                          <td>
                            <small className="text-muted">
                              {formatDate(purchase.createdAt)}
                            </small>
                          </td>
                          <td>
                            <div>
                              <strong>{purchase.userName}</strong>
                              <br />
                              <small className="text-muted">{purchase.userEmail}</small>
                            </div>
                          </td>
                          <td>
                            <span className="me-2">{getLotteryIcon(purchase.lotteryType)}</span>
                            <strong>{getLotteryDisplayName(purchase.lotteryType, purchase.lotteryDisplayName)}</strong>
                          </td>
                          <td>
                            {purchase.drawDate ? (
                              <>
                                {new Date(purchase.drawDate).toLocaleDateString()}
                                <br />
                                <small className="text-muted">{purchase.drawTime}</small>
                              </>
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td>
                            <strong className="text-success">${purchase.amount.toFixed(2)}</strong>
                          </td>
                          <td>
                            <span className={`badge ${getPaymentMethodBadge(purchase.paymentMethod)}`}>
                              {purchase.paymentMethod.charAt(0).toUpperCase() + purchase.paymentMethod.slice(1)}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${getStatusBadge(purchase.paymentStatus)}`}>
                              {purchase.paymentStatus.charAt(0).toUpperCase() + purchase.paymentStatus.slice(1)}
                              {purchase.isRefunded && ' (Refunded)'}
                            </span>
                          </td>
                          <td>
                            <small className="font-monospace">{purchase.transactionId}</small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav aria-label="Payments pagination" className="mt-4">
                <ul className="pagination justify-content-center">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <li
                          key={page}
                          className={`page-item ${currentPage === page ? 'active' : ''}`}
                        >
                          <button
                            className="page-link"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </button>
                        </li>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <li key={page} className="page-item disabled">
                          <span className="page-link">...</span>
                        </li>
                      );
                    }
                    return null;
                  })}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPayments;

