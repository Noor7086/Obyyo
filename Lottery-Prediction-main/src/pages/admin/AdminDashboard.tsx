import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminStats, LotteryType, Lottery } from '../../types';
import { apiService } from '../../services/api';
import { lotteryService } from '../../services/lotteryService';
import AdminLayout from '../../components/layout/AdminLayout';
import SimpleChart from '../../components/charts/SimpleChart';
import toast from 'react-hot-toast';

interface AnalyticsData {
  userGrowth: Array<{ date: string; count: number }>;
  revenueData: Array<{ date: string; amount: number }>;
  predictionStats: Array<{ lotteryType: string; count: number; revenue: number }>;
  topPredictions: Array<any>;
  userActivity: Array<{ date: string; activeUsers: number; newUsers: number }>;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLottery, setSelectedLottery] = useState<LotteryType | 'all'>('all');
  const [lotteries, setLotteries] = useState<Lottery[]>([]);

  useEffect(() => {
    fetchStats();
    fetchLotteries();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedLottery]);

  const fetchStats = async () => {
    try {
      console.log('📊 Fetching admin stats...');
      const response = await apiService.get('/admin/stats');
      console.log('📊 Admin stats response:', response);
      if ((response as any).success) {
        setStats((response as any).data);
        setError(null);
      } else {
        console.error('❌ Admin stats failed - no success flag:', response);
        setError('Failed to fetch statistics');
      }
    } catch (err: any) {
      console.error('❌ Admin stats error:', err);
      console.error('❌ Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url,
        baseURL: err.config?.baseURL,
        fullURL: err.config?.baseURL + err.config?.url
      });
      setError(err.message || 'Failed to fetch statistics');
    }
  };

  const fetchLotteries = async () => {
    try {
      const fetchedLotteries = await lotteryService.getLotteries();
      setLotteries(fetchedLotteries);
    } catch (err: any) {
      console.error('Failed to fetch lotteries:', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const lotteryParam = selectedLottery !== 'all' ? `&lotteryType=${selectedLottery}` : '';
      const response = await apiService.get(`/admin/analytics?range=30d${lotteryParam}`);
      if ((response as any).success) {
        setAnalytics((response as any).data);
      }
    } catch (err: any) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get current revenue and purchases based on selected lottery
  const getCurrentRevenue = (): number => {
    if (selectedLottery === 'all') {
      return stats?.totalRevenue || 0;
    }
    // Calculate revenue from predictionStats for selected lottery
    const lotteryStats = analytics?.predictionStats?.find(
      stat => stat.lotteryType.toLowerCase() === selectedLottery.toLowerCase()
    );
    return lotteryStats?.revenue || 0;
  };

  const getCurrentPurchases = (): number => {
    if (selectedLottery === 'all') {
      return stats?.totalPurchases || 0;
    }
    // Calculate purchases count from predictionStats for selected lottery
    const lotteryStats = analytics?.predictionStats?.find(
      stat => stat.lotteryType.toLowerCase() === selectedLottery.toLowerCase()
    );
    // If we have revenue data, we can estimate purchases, or use count from stats
    // For now, let's use the count from predictionStats
    return lotteryStats?.count || 0;
  };

  // Calculate trend percentage for revenue
  const calculateRevenueTrend = (): string => {
    if (!analytics?.revenueData || analytics.revenueData.length < 2) return '0';
    const current = analytics.revenueData[analytics.revenueData.length - 1]?.amount || 0;
    const previous = analytics.revenueData[analytics.revenueData.length - 2]?.amount || 0;
    if (previous === 0) return '0';
    return ((current - previous) / previous * 100).toFixed(1);
  };

  // Get lottery display name
  const getLotteryDisplayName = (lotteryType: LotteryType | 'all'): string => {
    if (lotteryType === 'all') return 'All Lotteries';
    const lottery = lotteries.find(l => l.id?.toLowerCase() === lotteryType.toLowerCase() || l.code?.toLowerCase() === lotteryType.toLowerCase());
    return lottery?.name || lotteryType;
  };

  // Get monthly revenue chart data
  const getMonthlyRevenueData = () => {
    if (!analytics?.revenueData) return { data: [], labels: [] };
    
    // Group by month
    const monthlyData: { [key: string]: number } = {};
    analytics.revenueData.forEach(item => {
      const date = new Date(item.date);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + item.amount;
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map(month => monthlyData[month] || 0);
    
    return { data, labels: months };
  };

  // Get weekly user activity data
  const getWeeklyActivityData = () => {
    if (!analytics?.userActivity) return { data: [], labels: [] };
    
    // Get last 7 days
    const last7Days = analytics.userActivity.slice(-7);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Map dates to day names and get active users
    const data = last7Days.map(item => {
      return item.activeUsers || 0;
    });
    
    const labels = last7Days.map((item, index) => {
      const date = new Date(item.date);
      return days[date.getDay()] || `Day ${index + 1}`;
    });
    
    return { data, labels };
  };

  // Calculate user growth trend
  const calculateUserGrowthTrend = (): string => {
    if (!analytics?.userGrowth || analytics.userGrowth.length < 2) return '0';
    const current = analytics.userGrowth[analytics.userGrowth.length - 1]?.count || 0;
    const previous = analytics.userGrowth[analytics.userGrowth.length - 2]?.count || 0;
    if (previous === 0) return '0';
    return ((current - previous) / previous * 100).toFixed(1);
  };

  // Export data functionality
  const exportData = async (type: 'revenue' | 'analytics' = 'analytics') => {
    try {
      if (!analytics) {
        toast.error('No data to export');
        return;
      }

      let csvContent = '';
      let filename = '';

      if (type === 'revenue') {
        // Export revenue data
        csvContent = 'Date,Revenue\n';
        analytics.revenueData.forEach(item => {
          csvContent += `${item.date},${item.amount}\n`;
        });
        filename = `revenue-export-${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        // Export analytics data
        csvContent = 'Date,New Users,Active Users\n';
        analytics.userActivity.forEach(item => {
          csvContent += `${item.date},${item.newUsers},${item.activeUsers}\n`;
        });
        filename = `analytics-export-${new Date().toISOString().split('T')[0]}.csv`;
      }

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  if (loading) {
    return (
      <div className="container py-5 mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5 mt-5">
        <div className="text-center">
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-heading">Error!</h4>
            <p>{error}</p>
            <button 
              className="btn btn-outline-danger" 
              onClick={() => {
                fetchStats();
                fetchAnalytics();
              }}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout stats={{ totalUsers: stats?.totalUsers, totalPredictions: stats?.totalPredictions }}>
          {/* Header */}
          <div className="dashboard-header">
            <div className="header-left">
              <div>
                <h1>Dashboard Overview</h1>
                <p>Welcome back! Here's what's happening with your platform.</p>
              </div>
            </div>
            <div className="header-actions">
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  fetchStats();
                  fetchAnalytics();
                  toast.success('Dashboard refreshed');
                }}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card primary">
              <div className="stat-icon">
                <i className="bi bi-people-fill"></i>
              </div>
              <div className="stat-content">
                <h3>{stats?.totalUsers || 0}</h3>
                <p>Total Users</p>
                <div className="stat-trend">
                  {parseFloat(calculateUserGrowthTrend()) >= 0 ? (
                    <>
                      <i className="bi bi-arrow-up text-success"></i>
                      <span className="text-success">+{calculateUserGrowthTrend()}%</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-arrow-down text-danger"></i>
                      <span className="text-danger">{calculateUserGrowthTrend()}%</span>
                    </>
                  )}
                  <span className="text-muted">from last period</span>
                </div>
              </div>
            </div>

            <div className="stat-card success">
              <div className="stat-icon">
                <i className="bi bi-person-check-fill"></i>
              </div>
              <div className="stat-content">
                <h3>{stats?.activeUsers || 0}</h3>
                <p>Active Users</p>
                <div className="stat-trend">
                  <span className="text-muted">Currently active</span>
                </div>
              </div>
            </div>

            <div className="stat-card warning">
              <div className="stat-icon">
                <i className="bi bi-clock-fill"></i>
              </div>
              <div className="stat-content">
                <h3>{stats?.trialUsers || 0}</h3>
                <p>Trial Users</p>
                <div className="stat-trend">
                  <span className="text-muted">On trial period</span>
                </div>
              </div>
            </div>

            <div className="stat-card info">
              <div className="stat-icon">
                <i className="bi bi-graph-up"></i>
              </div>
              <div className="stat-content">
                <h3>{stats?.totalPredictions || 0}</h3>
                <p>Total Predictions</p>
                <div className="stat-trend">
                  <span className="text-muted">Total uploaded</span>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue and Performance Cards */}
          <div className="revenue-section">
            <div className="revenue-card">
              <div className="card-header">
                <h4>Revenue Overview</h4>
                <div className="card-actions">
                  <select
                    className="form-select form-select-sm me-2"
                    style={{ width: 'auto', display: 'inline-block' }}
                    value={selectedLottery}
                    onChange={(e) => {
                      setSelectedLottery(e.target.value as LotteryType | 'all');
                      setLoading(true);
                    }}
                  >
                    <option value="all">All Lotteries</option>
                    {lotteries.map((lottery) => (
                      <option key={lottery.id || lottery.code} value={lottery.id?.toLowerCase() || lottery.code?.toLowerCase()}>
                        {lottery.name}
                      </option>
                    ))}
                  </select>
                  <button 
                    className="btn btn-sm btn-outline-secondary me-2"
                    onClick={() => exportData('revenue')}
                  >
                    <i className="bi bi-download me-1"></i>
                    Export
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => navigate('/admin/payments')}
                  >
                    View Details
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="revenue-stats">
                  <div className="revenue-item">
                    <h2>${getCurrentRevenue().toFixed(2)}</h2>
                    <p>Total Revenue {selectedLottery !== 'all' && `(${getLotteryDisplayName(selectedLottery)})`}</p>
                    <div className="trend positive">
                      {parseFloat(calculateRevenueTrend()) >= 0 ? (
                        <>
                          <i className="bi bi-arrow-up"></i>
                          <span>+{calculateRevenueTrend()}%</span>
                        </>
                      ) : (
                        <>
                          <i className="bi bi-arrow-down"></i>
                          <span>{calculateRevenueTrend()}%</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="revenue-item">
                    <h2>{getCurrentPurchases()}</h2>
                    <p>Total Purchases {selectedLottery !== 'all' && `(${getLotteryDisplayName(selectedLottery)})`}</p>
                    <div className="trend positive">
                      <span>Active purchases</span>
                    </div>
                  </div>
                </div>
                <div className="revenue-chart">
                  {(() => {
                    const chartData = getMonthlyRevenueData();
                    const chartTitle = selectedLottery !== 'all' 
                      ? `Monthly Revenue - ${getLotteryDisplayName(selectedLottery)}`
                      : 'Monthly Revenue';
                    return (
                      <SimpleChart
                        type="line"
                        data={chartData.data.length > 0 ? chartData.data : [0]}
                        labels={chartData.labels.length > 0 ? chartData.labels : ['No Data']}
                        title={chartTitle}
                        color="#6366f1"
                      />
                    );
                  })()}
                </div>
              </div>
            </div>

            <div className="quick-actions-card">
              <div className="card-header">
                <h4>Quick Actions</h4>
              </div>
              <div className="card-body">
                <div className="quick-actions">
                  <button 
                    className="action-btn"
                    onClick={() => navigate('/admin/users')}
                  >
                    <i className="bi bi-person-plus"></i>
                    <span>Manage Users</span>
                  </button>
                  <button 
                    className="action-btn"
                    onClick={() => {
                      fetchAnalytics();
                      fetchStats();
                      toast.success('Analytics refreshed');
                    }}
                  >
                    <i className="bi bi-graph-up"></i>
                    <span>Refresh Analytics</span>
                  </button>
                  <button 
                    className="action-btn"
                    onClick={() => navigate('/admin/predictions')}
                  >
                    <i className="bi bi-list-ul"></i>
                    <span>Manage Predictions</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Section */}
          <div className="analytics-section">
            <div className="analytics-card">
              <div className="card-header">
                <h4>User Activity Analytics</h4>
                <div className="card-actions">
                  <button 
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => exportData('analytics')}
                  >
                    <i className="bi bi-download me-1"></i>
                    Export
                  </button>
                </div>
              </div>
              <div className="card-body">
                {(() => {
                  const activityData = getWeeklyActivityData();
                  return (
                    <SimpleChart
                      type="bar"
                      data={activityData.data.length > 0 ? activityData.data : [0]}
                      labels={activityData.labels.length > 0 ? activityData.labels : ['No Data']}
                      title="Weekly User Activity"
                      color="#10b981"
                    />
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="activity-section">
            <div className="activity-card">
              <div className="card-header">
                <h4>Recent Activity</h4>
                <div className="card-actions">
                  <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => navigate('/admin/users')}
                  >
                    View All
                  </button>
                </div>
              </div>
              <div className="card-body">
                {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                  <div className="activity-list">
                    {stats.recentActivity.map((activity, index) => (
                      <div key={index} className="activity-item">
                        <div className="activity-icon">
                          <i className={`bi bi-${getActivityIcon(activity.type)}`}></i>
                        </div>
                        <div className="activity-content">
                          <h6>{activity.description}</h6>
                          <p className="text-muted">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="activity-badge">
                          <span className={`badge ${getActivityBadgeClass(activity.type)}`}>
                            {activity.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <i className="bi bi-inbox"></i>
                    <h5>No recent activity</h5>
                    <p>Activity will appear here as users interact with your platform.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

    </AdminLayout>
  );
};

// Helper functions
const getActivityIcon = (type: string): string => {
  const iconMap: { [key: string]: string } = {
    'user': 'person-plus',
    'prediction': 'graph-up',
    'purchase': 'cart-check',
    'lottery': 'trophy',
    'default': 'activity'
  };
  return iconMap[type.toLowerCase()] || iconMap.default;
};

const getActivityBadgeClass = (type: string): string => {
  const classMap: { [key: string]: string } = {
    'user': 'bg-primary',
    'prediction': 'bg-info',
    'purchase': 'bg-success',
    'lottery': 'bg-warning',
    'default': 'bg-secondary'
  };
  return classMap[type.toLowerCase()] || classMap.default;
};

export default AdminDashboard;