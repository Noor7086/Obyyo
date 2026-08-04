import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminStats, LotteryType, Lottery } from '../../types';
import { apiService } from '../../services/api';
import { lotteryService } from '../../services/lotteryService';
import AdminLayout from '../../components/layout/AdminLayout';
import toast from 'react-hot-toast';
import {
  LineChart,
  Line,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface AnalyticsData {
  userGrowth: Array<{ date: string; count: number }>;
  revenueData: Array<{ date: string; amount: number }>;
  purchaseRevenueData: Array<{ date: string; amount: number }>;
  walletRevenueData: Array<{ date: string; amount: number }>;
  totalWalletDeposits?: number;
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
  const [dateRange, setDateRange] = useState<string>('30d');
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchStats();
    fetchLotteries();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedLottery, dateRange]);

  const fetchStats = async () => {
    try {
      const response = await apiService.get('/admin/stats');
      if ((response as any).success) {
        setStats((response as any).data);
        setError(null);
      } else {
        setError('Failed to fetch statistics');
      }
    } catch (err: any) {
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
      setLoading(true);
      const lotteryParam = selectedLottery !== 'all' ? `&lotteryType=${selectedLottery}` : '';
      const response = await apiService.get(`/admin/analytics?range=${dateRange}${lotteryParam}`);
      if ((response as any).success) {
        setAnalytics((response as any).data);
      }
    } catch (err: any) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPurchases = (): number => {
    if (selectedLottery === 'all') {
      return stats?.totalPurchases || 0;
    }
    const lotteryStats = analytics?.predictionStats?.find(
      stat => stat.lotteryType.toLowerCase() === selectedLottery.toLowerCase()
    );
    return lotteryStats?.count || 0;
  };

  const calculatePurchaseRevenueTrend = (): string => {
    if (!analytics?.purchaseRevenueData || analytics.purchaseRevenueData.length < 2) return '0';
    const current = analytics.purchaseRevenueData[analytics.purchaseRevenueData.length - 1]?.amount || 0;
    const previous = analytics.purchaseRevenueData[analytics.purchaseRevenueData.length - 2]?.amount || 0;
    if (previous === 0) return '0';
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const calculateWalletRevenueTrend = (): string => {
    if (!analytics?.walletRevenueData || analytics.walletRevenueData.length < 2) return '0';
    const current = analytics.walletRevenueData[analytics.walletRevenueData.length - 1]?.amount || 0;
    const previous = analytics.walletRevenueData[analytics.walletRevenueData.length - 2]?.amount || 0;
    if (previous === 0) return '0';
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const getLotteryDisplayName = (lotteryType: LotteryType | 'all'): string => {
    if (lotteryType === 'all') return 'All Lotteries';
    const lottery = lotteries.find(l => l.id?.toLowerCase() === lotteryType.toLowerCase() || l.code?.toLowerCase() === lotteryType.toLowerCase());
    return lottery?.name || lotteryType;
  };

  const getPurchaseRevenueData = () => {
    if (!analytics?.purchaseRevenueData) return { data: [], labelKey: 'date', title: 'Purchase Revenue' };
    
    const isShortRange = dateRange === '7d' || dateRange === '30d';
    
    if (isShortRange) {
      const dailyDataMap = new Map<string, number>();
      analytics.purchaseRevenueData.forEach(item => {
        const date = new Date(item.date);
        const dateKey = date.toISOString().split('T')[0];
        dailyDataMap.set(dateKey, (dailyDataMap.get(dateKey) || 0) + item.amount);
      });
      
      const sortedEntries = Array.from(dailyDataMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      
      return {
        data: sortedEntries.map(([dateKey, amount]) => {
          const date = new Date(dateKey);
          return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            revenue: amount
          };
        }),
        labelKey: 'date',
        title: dateRange === '7d' ? 'Daily Purchase Revenue (Last 7 Days)' : 'Daily Purchase Revenue (Last 30 Days)'
      };
    } else {
      // For monthly data, only show months that actually have data, sorted chronologically
      const monthlyDataMap = new Map<string, { month: string; revenue: number; date: Date }>();
      
      analytics.purchaseRevenueData.forEach(item => {
        const date = new Date(item.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short' });
        
        if (monthlyDataMap.has(monthKey)) {
          const existing = monthlyDataMap.get(monthKey)!;
          existing.revenue += item.amount;
        } else {
          monthlyDataMap.set(monthKey, {
            month: monthLabel,
            revenue: item.amount,
            date: new Date(date.getFullYear(), date.getMonth(), 1)
          });
        }
      });

      // Sort by date and return only months with data
      const sortedMonths = Array.from(monthlyDataMap.values())
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      return {
        data: sortedMonths.map(item => ({
          month: item.month,
          revenue: item.revenue
        })),
        labelKey: 'month',
        title: dateRange === 'alltime' || dateRange === 'all' 
          ? 'Monthly Purchase Revenue (All Time)' 
          : dateRange === '90d' 
          ? 'Monthly Purchase Revenue (Last 90 Days)' 
          : 'Monthly Purchase Revenue (Last Year)'
      };
    }
  };

  const getWalletRevenueData = () => {
    if (!analytics?.walletRevenueData) return { data: [], labelKey: 'date', title: 'Wallet Deposit Revenue' };
    
    const isShortRange = dateRange === '7d' || dateRange === '30d';
    
    if (isShortRange) {
      const dailyDataMap = new Map<string, number>();
      analytics.walletRevenueData.forEach(item => {
        const date = new Date(item.date);
        const dateKey = date.toISOString().split('T')[0];
        dailyDataMap.set(dateKey, (dailyDataMap.get(dateKey) || 0) + item.amount);
      });
      
      const sortedEntries = Array.from(dailyDataMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      
      return {
        data: sortedEntries.map(([dateKey, amount]) => {
          const date = new Date(dateKey);
          return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            revenue: amount
          };
        }),
        labelKey: 'date',
        title: dateRange === '7d' ? 'Daily Wallet Deposit Revenue (Last 7 Days)' : 'Daily Wallet Deposit Revenue (Last 30 Days)'
      };
    } else {
      // For monthly data, only show months that actually have data, sorted chronologically
      const monthlyDataMap = new Map<string, { month: string; revenue: number; date: Date }>();
      
      analytics.walletRevenueData.forEach(item => {
        const date = new Date(item.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short' });
        
        if (monthlyDataMap.has(monthKey)) {
          const existing = monthlyDataMap.get(monthKey)!;
          existing.revenue += item.amount;
        } else {
          monthlyDataMap.set(monthKey, {
            month: monthLabel,
            revenue: item.amount,
            date: new Date(date.getFullYear(), date.getMonth(), 1)
          });
        }
      });

      // Sort by date and return only months with data
      const sortedMonths = Array.from(monthlyDataMap.values())
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      return {
        data: sortedMonths.map(item => ({
          month: item.month,
          revenue: item.revenue
        })),
        labelKey: 'month',
        title: dateRange === 'alltime' || dateRange === 'all' 
          ? 'Monthly Wallet Deposit Revenue (All Time)' 
          : dateRange === '90d' 
          ? 'Monthly Wallet Deposit Revenue (Last 90 Days)' 
          : 'Monthly Wallet Deposit Revenue (Last Year)'
      };
    }
  };

  const getTotalPurchaseRevenue = (): number => {
    if (!analytics?.purchaseRevenueData) return 0;
    return analytics.purchaseRevenueData.reduce((sum, item) => sum + item.amount, 0);
  };

  const getTotalWalletRevenue = (): number => {
    if (!analytics?.walletRevenueData) return 0;
    return analytics.walletRevenueData.reduce((sum, item) => sum + item.amount, 0);
  };

  const getWeeklyActivityData = () => {
    if (!analytics?.userActivity) return [];
    
    const last7Days = analytics.userActivity.slice(-7);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return last7Days.map((item, index) => {
      const date = new Date(item.date);
      return {
        day: days[date.getDay()] || `Day ${index + 1}`,
        activeUsers: item.activeUsers || 0,
        newUsers: item.newUsers || 0
      };
    });
  };

  const calculateUserGrowthTrend = (): string => {
    if (!analytics?.userGrowth || analytics.userGrowth.length < 2) return '0';
    const current = analytics.userGrowth[analytics.userGrowth.length - 1]?.count || 0;
    const previous = analytics.userGrowth[analytics.userGrowth.length - 2]?.count || 0;
    if (previous === 0) return '0';
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const exportData = async (type: 'revenue' | 'analytics' | 'purchaseRevenue' | 'walletRevenue' = 'analytics') => {
    try {
      if (!analytics) {
        toast.error('No data to export');
        return;
      }

      let csvContent = '';
      let filename = '';

      if (type === 'revenue') {
        csvContent = 'Date,Total Revenue,Purchase Revenue,Wallet Revenue\n';
        const dateMap = new Map<string, { purchase: number; wallet: number }>();
        analytics.purchaseRevenueData?.forEach(item => {
          dateMap.set(item.date, { purchase: item.amount, wallet: 0 });
        });
        analytics.walletRevenueData?.forEach(item => {
          const existing = dateMap.get(item.date);
          if (existing) {
            existing.wallet = item.amount;
          } else {
            dateMap.set(item.date, { purchase: 0, wallet: item.amount });
          }
        });
        Array.from(dateMap.entries()).sort().forEach(([date, amounts]) => {
          csvContent += `${date},${amounts.purchase + amounts.wallet},${amounts.purchase},${amounts.wallet}\n`;
        });
        filename = `revenue-export-${new Date().toISOString().split('T')[0]}.csv`;
      } else if (type === 'purchaseRevenue') {
        csvContent = 'Date,Purchase Revenue\n';
        analytics.purchaseRevenueData?.forEach(item => {
          csvContent += `${item.date},${item.amount}\n`;
        });
        filename = `purchase-revenue-export-${new Date().toISOString().split('T')[0]}.csv`;
      } else if (type === 'walletRevenue') {
        csvContent = 'Date,Wallet Deposit Revenue\n';
        analytics.walletRevenueData?.forEach(item => {
          csvContent += `${item.date},${item.amount}\n`;
        });
        filename = `wallet-deposit-revenue-export-${new Date().toISOString().split('T')[0]}.csv`;
      } else {
        csvContent = 'Date,New Users,Active Users\n';
        analytics.userActivity.forEach(item => {
          csvContent += `${item.date},${item.newUsers},${item.activeUsers}\n`;
        });
        filename = `analytics-export-${new Date().toISOString().split('T')[0]}.csv`;
      }

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
      <AdminLayout stats={{ totalUsers: stats?.totalUsers, totalPredictions: stats?.totalPredictions }}>
        <div className="dashboard-loading-container">
          <div style={{ textAlign: 'center' }}>
            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-4 text-muted" style={{ marginTop: '1rem' }}>Loading dashboard data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout stats={{ totalUsers: stats?.totalUsers, totalPredictions: stats?.totalPredictions }}>
        <div className="dashboard-error-container">
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-heading">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              Error Loading Dashboard
            </h4>
            <p>{error}</p>
            <hr />
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
      </AdminLayout>
    );
  }

  return (
    <AdminLayout stats={{ totalUsers: stats?.totalUsers, totalPredictions: stats?.totalPredictions }}>
      <div className="admin-dashboard-container">
        {/* Header Section */}
        <div className="dashboard-header-section">
          <div className="header-content">
            <div>
              <h1 className="dashboard-main-title">Dashboard Overview</h1>
              <p className="dashboard-subtitle">Monitor your platform performance and analytics</p>
            </div>
            <button 
              className="btn btn-primary btn-refresh" 
              onClick={() => {
                fetchStats();
                fetchAnalytics();
                toast.success('Dashboard refreshed');
              }}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Refresh Data
            </button>
          </div>
        </div>

        {/* Stats Cards Grid */}
        <div className="stats-grid-modern">
          <div className="stat-card-modern stat-card-primary">
            <div className="stat-card-icon-wrapper">
              <div className="stat-card-icon stat-icon-primary">
                <i className="bi bi-people-fill"></i>
              </div>
            </div>
            <div className="stat-card-content">
              <h3 className="stat-card-value">{stats?.totalUsers || 0}</h3>
              <p className="stat-card-label">Total Users</p>
              <div className="stat-card-trend">
                {parseFloat(calculateUserGrowthTrend()) >= 0 ? (
                  <span className="trend-up">
                    <i className="bi bi-arrow-up"></i>
                    <span>+{calculateUserGrowthTrend()}%</span>
                  </span>
                ) : (
                  <span className="trend-down">
                    <i className="bi bi-arrow-down"></i>
                    <span>{calculateUserGrowthTrend()}%</span>
                  </span>
                )}
                <span className="trend-label">from last period</span>
              </div>
            </div>
          </div>

          <div className="stat-card-modern stat-card-success">
            <div className="stat-card-icon-wrapper">
              <div className="stat-card-icon stat-icon-success">
                <i className="bi bi-person-check-fill"></i>
              </div>
            </div>
            <div className="stat-card-content">
              <h3 className="stat-card-value">{stats?.activeUsers || 0}</h3>
              <p className="stat-card-label">Active Users</p>
              <div className="stat-card-trend">
                <span className="trend-label">Currently active</span>
              </div>
            </div>
          </div>

          <div className="stat-card-modern stat-card-warning">
            <div className="stat-card-icon-wrapper">
              <div className="stat-card-icon stat-icon-warning">
                <i className="bi bi-clock-fill"></i>
              </div>
            </div>
            <div className="stat-card-content">
              <h3 className="stat-card-value">{stats?.trialUsers || 0}</h3>
              <p className="stat-card-label">Trial Users</p>
              <div className="stat-card-trend">
                <span className="trend-label">On trial period</span>
              </div>
            </div>
          </div>

          <div className="stat-card-modern stat-card-info">
            <div className="stat-card-icon-wrapper">
              <div className="stat-card-icon stat-icon-info">
                <i className="bi bi-graph-up"></i>
              </div>
            </div>
            <div className="stat-card-content">
              <h3 className="stat-card-value">{stats?.totalPredictions || 0}</h3>
              <p className="stat-card-label">Total Predictions</p>
              <div className="stat-card-trend">
                <span className="trend-label">Total uploaded</span>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Analytics Section */}
        <div className="revenue-analytics-section">
          {/* Prediction Purchase Revenue Card */}
          <div className="analytics-card-modern">
            <div className="analytics-card-header">
              <div className="analytics-card-title-section">
                <div className="analytics-card-icon-wrapper">
                  <i className="bi bi-cart-check-fill"></i>
                </div>
                <div>
                  <h4 className="analytics-card-title">Prediction Purchase Revenue</h4>
                  <p className="analytics-card-subtitle">Revenue from prediction purchases</p>
                </div>
              </div>
              <div className="analytics-card-filters">
                <select
                  className="form-select form-select-sm filter-select"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  title="Date Range"
                >
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="1y">Last Year</option>
                  <option value="alltime">All Time</option>
                </select>
                <select
                  className="form-select form-select-sm filter-select"
                  value={selectedLottery}
                  onChange={(e) => setSelectedLottery(e.target.value as LotteryType | 'all')}
                  title="Lottery Filter"
                >
                  <option value="all">All Lotteries</option>
                  {lotteries.map((lottery) => (
                    <option key={lottery.id || lottery.code} value={lottery.id?.toLowerCase() || lottery.code?.toLowerCase()}>
                      {lottery.name}
                    </option>
                  ))}
                </select>
                <button 
                  className="btn btn-sm btn-outline-secondary btn-icon"
                  onClick={() => exportData('purchaseRevenue')}
                  title="Export Data"
                >
                  <i className="bi bi-download"></i>
                </button>
                <button 
                  className="btn btn-sm btn-primary btn-icon"
                  onClick={() => navigate('/admin/payments')}
                  title="View Details"
                >
                  <i className="bi bi-arrow-right"></i>
                </button>
              </div>
            </div>
            <div className="analytics-card-body">
              <div className="revenue-summary-modern">
                <div className="revenue-summary-item">
                  <div className="revenue-summary-value">
                    <span className="currency">$</span>
                    <span className="amount">{getTotalPurchaseRevenue().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <p className="revenue-summary-label">
                    Total from Prediction Purchases
                    {selectedLottery !== 'all' && (
                      <span className="lottery-badge">{getLotteryDisplayName(selectedLottery)}</span>
                    )}
                  </p>
                  <div className="revenue-trend-modern">
                    {parseFloat(calculatePurchaseRevenueTrend()) >= 0 ? (
                      <span className="trend-indicator trend-positive">
                        <i className="bi bi-arrow-up"></i>
                        <span>+{calculatePurchaseRevenueTrend()}%</span>
                      </span>
                    ) : (
                      <span className="trend-indicator trend-negative">
                        <i className="bi bi-arrow-down"></i>
                        <span>{calculatePurchaseRevenueTrend()}%</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="revenue-summary-item">
                  <div className="revenue-summary-value">
                    <span className="amount">{getCurrentPurchases().toLocaleString()}</span>
                  </div>
                  <p className="revenue-summary-label">
                    Total Purchases
                    {selectedLottery !== 'all' && (
                      <span className="lottery-badge">{getLotteryDisplayName(selectedLottery)}</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="chart-container-modern">
                {(() => {
                  const chartInfo = getPurchaseRevenueData();
                  const chartTitle = selectedLottery !== 'all' 
                    ? `${chartInfo.title} - ${getLotteryDisplayName(selectedLottery)}`
                    : chartInfo.title;
                  const emptyData = chartInfo.labelKey === 'date' 
                    ? [{ date: 'No Data', revenue: 0 }] 
                    : [{ month: 'No Data', revenue: 0 }];
                  return (
                    <div className="chart-wrapper">
                      <h6 className="chart-title-modern">{chartTitle}</h6>
                      <div className="chart-shell">
                        <ResponsiveContainer width="100%" height={isMobile ? 250 : 280}>
                          <LineChart 
                            data={chartInfo.data.length > 0 ? chartInfo.data : emptyData}
                            margin={{ 
                              top: 10, 
                              right: isMobile ? 10 : 20, 
                              left: isMobile ? -10 : 0, 
                              bottom: chartInfo.labelKey === 'date' ? (isMobile ? 60 : 40) : 10 
                            }}
                          >
                          <defs>
                            <linearGradient id="purchaseGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                          <XAxis 
                            dataKey={chartInfo.labelKey}
                            stroke="#64748b"
                            style={{ fontSize: isMobile ? '9px' : '11px', fontWeight: 500 }}
                            tickLine={false}
                            axisLine={{ stroke: '#e2e8f0' }}
                            angle={chartInfo.labelKey === 'date' ? (isMobile ? -60 : -45) : 0}
                            textAnchor={chartInfo.labelKey === 'date' ? 'end' : 'middle'}
                            height={chartInfo.labelKey === 'date' ? (isMobile ? 70 : 50) : 30}
                            interval={isMobile && chartInfo.data.length > 7 ? 'preserveStartEnd' : 0}
                          />
                          <YAxis 
                            stroke="#64748b"
                            style={{ fontSize: isMobile ? '9px' : '11px', fontWeight: 500 }}
                            tickFormatter={(value) => {
                              if (isMobile && value >= 1000) {
                                return `$${(value / 1000).toFixed(1)}k`;
                              }
                              return `$${value > 0 ? value.toFixed(0) : '0'}`;
                            }}
                            tickLine={false}
                            axisLine={false}
                            width={isMobile ? 40 : 50}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#ffffff', 
                              border: 'none', 
                              borderRadius: '10px',
                              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                              padding: isMobile ? '10px 12px' : '14px 18px',
                              fontSize: isMobile ? '11px' : '13px'
                            }}
                            labelStyle={{ 
                              color: '#1e293b', 
                              fontWeight: 600,
                              marginBottom: '10px',
                              fontSize: isMobile ? '10px' : '12px'
                            }}
                            formatter={(value: number | undefined) => {
                              const val = value ?? 0;
                              return [`$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Revenue'];
                            }}
                            cursor={{ stroke: '#10b981', strokeWidth: 2, strokeDasharray: '5 5' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#10b981" 
                            strokeWidth={isMobile ? 2.5 : 3}
                            fill="url(#purchaseGradient)"
                            dot={{ fill: '#10b981', strokeWidth: 2, stroke: '#ffffff', r: isMobile ? 4 : 5 }}
                            activeDot={{ r: isMobile ? 6 : 8, stroke: '#10b981', strokeWidth: 2, fill: '#ffffff' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="none" 
                            fill="url(#purchaseGradient)"
                          />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Wallet Deposit Revenue Card */}
          <div className="analytics-card-modern">
            <div className="analytics-card-header">
              <div className="analytics-card-title-section">
                <div className="analytics-card-icon-wrapper wallet-icon">
                  <i className="bi bi-wallet2"></i>
                </div>
                <div>
                  <h4 className="analytics-card-title">Wallet Deposit Revenue</h4>
                  <p className="analytics-card-subtitle">Total amount added to user wallets</p>
                </div>
              </div>
              <div className="analytics-card-filters">
                <select
                  className="form-select form-select-sm filter-select"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  title="Date Range"
                >
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="1y">Last Year</option>
                  <option value="alltime">All Time</option>
                </select>
                <button 
                  className="btn btn-sm btn-outline-secondary btn-icon"
                  onClick={() => exportData('walletRevenue')}
                  title="Export Data"
                >
                  <i className="bi bi-download"></i>
                </button>
                <button 
                  className="btn btn-sm btn-primary btn-icon"
                  onClick={() => navigate('/admin/payments')}
                  title="View Details"
                >
                  <i className="bi bi-arrow-right"></i>
                </button>
              </div>
            </div>
            <div className="analytics-card-body">
              <div className="revenue-summary-modern">
                <div className="revenue-summary-item">
                  <div className="revenue-summary-value">
                    <span className="currency">$</span>
                    <span className="amount">{getTotalWalletRevenue().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <p className="revenue-summary-label">Total Added to Wallets</p>
                  <div className="revenue-trend-modern">
                    {parseFloat(calculateWalletRevenueTrend()) >= 0 ? (
                      <span className="trend-indicator trend-positive">
                        <i className="bi bi-arrow-up"></i>
                        <span>+{calculateWalletRevenueTrend()}%</span>
                      </span>
                    ) : (
                      <span className="trend-indicator trend-negative">
                        <i className="bi bi-arrow-down"></i>
                        <span>{calculateWalletRevenueTrend()}%</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="chart-container-modern">
                {(() => {
                  const chartInfo = getWalletRevenueData();
                  const emptyData = chartInfo.labelKey === 'date' 
                    ? [{ date: 'No Data', revenue: 0 }] 
                    : [{ month: 'No Data', revenue: 0 }];
                  return (
                    <div className="chart-wrapper">
                      <h6 className="chart-title-modern">{chartInfo.title}</h6>
                      <div className="chart-shell">
                        <ResponsiveContainer width="100%" height={isMobile ? 250 : 280}>
                          <LineChart 
                            data={chartInfo.data.length > 0 ? chartInfo.data : emptyData}
                            margin={{ 
                              top: 10, 
                              right: isMobile ? 10 : 20, 
                              left: isMobile ? -10 : 0, 
                              bottom: chartInfo.labelKey === 'date' ? (isMobile ? 60 : 40) : 10 
                            }}
                          >
                          <defs>
                            <linearGradient id="walletGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                          <XAxis 
                            dataKey={chartInfo.labelKey}
                            stroke="#64748b"
                            style={{ fontSize: isMobile ? '9px' : '11px', fontWeight: 500 }}
                            tickLine={false}
                            axisLine={{ stroke: '#e2e8f0' }}
                            angle={chartInfo.labelKey === 'date' ? (isMobile ? -60 : -45) : 0}
                            textAnchor={chartInfo.labelKey === 'date' ? 'end' : 'middle'}
                            height={chartInfo.labelKey === 'date' ? (isMobile ? 70 : 50) : 30}
                            interval={isMobile && chartInfo.data.length > 7 ? 'preserveStartEnd' : 0}
                          />
                          <YAxis 
                            stroke="#64748b"
                            style={{ fontSize: isMobile ? '9px' : '11px', fontWeight: 500 }}
                            tickFormatter={(value) => {
                              if (isMobile && value >= 1000) {
                                return `$${(value / 1000).toFixed(1)}k`;
                              }
                              return `$${value > 0 ? value.toFixed(0) : '0'}`;
                            }}
                            tickLine={false}
                            axisLine={false}
                            width={isMobile ? 40 : 50}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#ffffff', 
                              border: 'none', 
                              borderRadius: '10px',
                              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                              padding: isMobile ? '10px 12px' : '14px 18px',
                              fontSize: isMobile ? '11px' : '13px'
                            }}
                            labelStyle={{ 
                              color: '#1e293b', 
                              fontWeight: 600,
                              marginBottom: '10px',
                              fontSize: isMobile ? '10px' : '12px'
                            }}
                            formatter={(value: number | undefined) => {
                              const val = value ?? 0;
                              return [`$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Revenue'];
                            }}
                            cursor={{ stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '5 5' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#f59e0b" 
                            strokeWidth={isMobile ? 2.5 : 3}
                            fill="url(#walletGradient)"
                            dot={{ fill: '#f59e0b', strokeWidth: 2, stroke: '#ffffff', r: isMobile ? 4 : 5 }}
                            activeDot={{ r: isMobile ? 6 : 8, stroke: '#f59e0b', strokeWidth: 2, fill: '#ffffff' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="none" 
                            fill="url(#walletGradient)"
                          />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Quick Actions & User Activity */}
        <div className="bottom-section-modern">
          {/* Quick Actions */}
          <div className="analytics-card-modern quick-actions-modern">
            <div className="analytics-card-header">
              <div className="analytics-card-title-section">
                <div className="analytics-card-icon-wrapper actions-icon">
                  <i className="bi bi-lightning-fill"></i>
                </div>
                <div>
                  <h4 className="analytics-card-title">Quick Actions</h4>
                  <p className="analytics-card-subtitle">Common administrative tasks</p>
                </div>
              </div>
            </div>
            <div className="analytics-card-body">
              <div className="quick-actions-grid">
                <button 
                  className="quick-action-btn"
                  onClick={() => navigate('/admin/users')}
                >
                  <div className="quick-action-icon">
                    <i className="bi bi-people-fill"></i>
                  </div>
                  <span className="quick-action-label">Manage Users</span>
                </button>
                <button 
                  className="quick-action-btn"
                  onClick={() => {
                    fetchAnalytics();
                    fetchStats();
                    toast.success('Analytics refreshed');
                  }}
                >
                  <div className="quick-action-icon">
                    <i className="bi bi-arrow-clockwise"></i>
                  </div>
                  <span className="quick-action-label">Refresh Analytics</span>
                </button>
                <button 
                  className="quick-action-btn"
                  onClick={() => navigate('/admin/predictions')}
                >
                  <div className="quick-action-icon">
                    <i className="bi bi-graph-up"></i>
                  </div>
                  <span className="quick-action-label">Manage Predictions</span>
                </button>
                <button 
                  className="quick-action-btn"
                  onClick={() => navigate('/admin/payments')}
                >
                  <div className="quick-action-icon">
                    <i className="bi bi-credit-card"></i>
                  </div>
                  <span className="quick-action-label">View Payments</span>
                </button>
              </div>
            </div>
          </div>

          {/* User Activity Analytics */}
          <div className="analytics-card-modern">
            <div className="analytics-card-header">
              <div className="analytics-card-title-section">
                <div className="analytics-card-icon-wrapper activity-icon">
                  <i className="bi bi-activity"></i>
                </div>
                <div>
                  <h4 className="analytics-card-title">User Activity Analytics</h4>
                  <p className="analytics-card-subtitle">Weekly user engagement metrics</p>
                </div>
              </div>
              <div className="analytics-card-filters">
                <select
                  className="form-select form-select-sm filter-select"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  title="Date Range"
                >
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="1y">Last Year</option>
                  <option value="alltime">All Time</option>
                </select>
                <button 
                  className="btn btn-sm btn-outline-secondary btn-icon"
                  onClick={() => exportData('analytics')}
                  title="Export Data"
                >
                  <i className="bi bi-download"></i>
                </button>
              </div>
            </div>
            <div className="analytics-card-body">
              <div className="chart-container-modern">
                {(() => {
                  const activityData = getWeeklyActivityData();
                  return (
                    <div className="chart-wrapper">
                      <h6 className="chart-title-modern">Weekly User Activity</h6>
                      <div className="chart-shell">
                        <ResponsiveContainer width="100%" height={isMobile ? 250 : 280}>
                          <BarChart 
                            data={activityData.length > 0 ? activityData : [{ day: 'No Data', activeUsers: 0, newUsers: 0 }]}
                            margin={{ 
                              top: 10, 
                              right: isMobile ? 10 : 20, 
                              left: isMobile ? -10 : 0, 
                              bottom: 10 
                            }}
                          >
                          <defs>
                            <linearGradient id="activeUsersGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.7}/>
                            </linearGradient>
                            <linearGradient id="newUsersGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.7}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                          <XAxis 
                            dataKey="day" 
                            stroke="#64748b"
                            style={{ fontSize: isMobile ? '9px' : '11px', fontWeight: 500 }}
                            tickLine={false}
                            axisLine={{ stroke: '#e2e8f0' }}
                          />
                          <YAxis 
                            stroke="#64748b"
                            style={{ fontSize: isMobile ? '9px' : '11px', fontWeight: 500 }}
                            tickLine={false}
                            axisLine={false}
                            width={isMobile ? 35 : 45}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#ffffff', 
                              border: 'none', 
                              borderRadius: '10px',
                              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                              padding: isMobile ? '10px 12px' : '14px 18px',
                              fontSize: isMobile ? '11px' : '13px'
                            }}
                            labelStyle={{ 
                              color: '#1e293b', 
                              fontWeight: 600,
                              marginBottom: '10px',
                              fontSize: isMobile ? '10px' : '12px'
                            }}
                            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                          />
                          <Legend 
                            wrapperStyle={{ paddingTop: '20px', fontSize: isMobile ? '10px' : '12px' }}
                            iconType="circle"
                            iconSize={isMobile ? 6 : 8}
                          />
                          <Bar 
                            dataKey="activeUsers" 
                            fill="url(#activeUsersGradient)" 
                            name="Active Users" 
                            radius={[isMobile ? 6 : 8, isMobile ? 6 : 8, 0, 0]}
                            stroke="#10b981"
                            strokeWidth={1}
                          />
                          <Bar 
                            dataKey="newUsers" 
                            fill="url(#newUsersGradient)" 
                            name="New Users" 
                            radius={[isMobile ? 6 : 8, isMobile ? 6 : 8, 0, 0]}
                            stroke="#3b82f6"
                            strokeWidth={1}
                          />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .admin-dashboard-container {
          padding: 2rem;
          max-width: 100%;
          box-sizing: border-box;
        }

        /* Header Section */
        .dashboard-header-section {
          margin-bottom: 2rem;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 1.5rem;
        }

        .dashboard-main-title {
          font-size: 2rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.02em;
        }

        .dashboard-subtitle {
          font-size: 1rem;
          color: #64748b;
          margin: 0;
        }

        .btn-refresh {
          padding: 0.75rem 1.5rem;
          font-weight: 600;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }

        .btn-refresh:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px -2px rgba(0, 0, 0, 0.15);
        }

        /* Stats Grid */
        .stats-grid-modern {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card-modern {
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          transition: all 0.3s ease;
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }

        .stat-card-modern:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .stat-card-icon-wrapper {
          flex-shrink: 0;
        }

        .stat-card-icon {
          width: 56px;
          height: 56px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          color: white;
        }

        .stat-icon-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .stat-icon-success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        .stat-icon-warning {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }

        .stat-icon-info {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        }

        .stat-card-content {
          flex: 1;
          min-width: 0;
        }

        .stat-card-value {
          font-size: 2rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 0.25rem 0;
          line-height: 1.2;
        }

        .stat-card-label {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0 0 0.75rem 0;
          font-weight: 500;
        }

        .stat-card-trend {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
        }

        .trend-up {
          color: #10b981;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .trend-down {
          color: #ef4444;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .trend-label {
          color: #94a3b8;
        }

        /* Revenue Analytics Section */
        .revenue-analytics-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .analytics-card-modern {
          background: white;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .analytics-card-modern:hover {
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .analytics-card-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .analytics-card-title-section {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
          min-width: 0;
        }

        .analytics-card-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .wallet-icon {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }

        .actions-icon {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        }

        .activity-icon {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        }

        .analytics-card-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 0.25rem 0;
        }

        .analytics-card-subtitle {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0;
        }

        .analytics-card-filters {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .filter-select {
          min-width: 140px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          transition: all 0.2s ease;
        }

        .filter-select:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
          outline: none;
        }

        .btn-icon {
          width: 36px;
          height: 36px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
        }

        .analytics-card-body {
          padding: 1.5rem;
        }

        .revenue-summary-modern {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .revenue-summary-item {
          padding: 1rem;
          background: #f8fafc;
          border-radius: 12px;
        }

        .revenue-summary-value {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
          margin-bottom: 0.5rem;
        }

        .currency {
          font-size: 1.25rem;
          font-weight: 600;
          color: #64748b;
        }

        .amount {
          font-size: 2rem;
          font-weight: 700;
          color: #1e293b;
          line-height: 1;
        }

        .revenue-summary-label {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0 0 0.75rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .lottery-badge {
          background: #e0e7ff;
          color: #6366f1;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .revenue-trend-modern {
          margin-top: 0.5rem;
        }

        .trend-indicator {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
        }

        .trend-positive {
          background: #d1fae5;
          color: #065f46;
        }

        .trend-negative {
          background: #fee2e2;
          color: #991b1b;
        }

        .chart-container-modern {
          margin-top: 1rem;
          width: 100%;
          position: relative;
        }

        .chart-wrapper {
          width: 100%;
          position: relative;
        }

        /* Give Recharts a measurable box */
        .chart-shell {
          width: 100%;
          height: 280px;
          position: relative;
          display: block;
          min-height: 280px;
        }

        .chart-title-modern {
          font-size: 0.875rem;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Ensure charts are scrollable on mobile */
        @media (max-width: 768px) {
          .chart-container-modern {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            overflow-y: visible;
          }

          .chart-wrapper {
            min-width: 100%;
            padding-bottom: 0.5rem;
            position: relative;
          }

          .chart-shell {
            height: 250px;
            min-height: 250px;
            width: 100%;
            min-width: 100%;
            position: relative;
            display: block;
          }

          .chart-title-modern {
            font-size: 0.75rem;
          }
        }

        /* Bottom Section */
        .bottom-section-modern {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
        }

        .quick-actions-modern {
          min-width: 0;
        }

        .quick-actions-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .quick-action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1.5rem 1rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          color: #1e293b;
        }

        .quick-action-btn:hover {
          background: #6366f1;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
          border-color: #6366f1;
        }

        .quick-action-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          margin-bottom: 0.75rem;
          transition: all 0.2s ease;
        }

        .quick-action-btn:hover .quick-action-icon {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .quick-action-label {
          font-size: 0.875rem;
          font-weight: 600;
        }

        /* Loading & Error States */
        .dashboard-loading-container,
        .dashboard-error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 180px);
          width: 100%;
          padding: 2rem;
          margin: -2rem -2rem;
          box-sizing: border-box;
        }
        
        @media (max-width: 768px) {
          .dashboard-loading-container,
          .dashboard-error-container {
            margin: -1rem -1rem;
            min-height: calc(100vh - 140px);
          }
        }
        
        .dashboard-loading-container > div {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .revenue-analytics-section {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .admin-dashboard-container {
            padding: 1rem;
          }

          .dashboard-main-title {
            font-size: 1.5rem;
          }

          .header-content {
            flex-direction: column;
            align-items: stretch;
          }

          .btn-refresh {
            width: 100%;
          }

          .stats-grid-modern {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .analytics-card-header {
            flex-direction: column;
            align-items: stretch;
          }

          .analytics-card-filters {
            width: 100%;
          }

          .filter-select {
            flex: 1;
            min-width: 0;
          }

          .revenue-summary-modern {
            grid-template-columns: 1fr;
          }

          .bottom-section-modern {
            grid-template-columns: 1fr;
          }

          .quick-actions-grid {
            grid-template-columns: 1fr;
          }

          .chart-wrapper {
            overflow-x: auto;
          }
        }

        @media (max-width: 480px) {
          .admin-dashboard-container {
            padding: 0.75rem;
          }

          .stat-card-modern {
            padding: 1rem;
          }

          .analytics-card-header,
          .analytics-card-body {
            padding: 1rem;
          }

          .stat-card-value {
            font-size: 1.5rem;
          }

          .amount {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </AdminLayout>
  );
};

export default AdminDashboard;
