import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import { apiService } from '../../services/api';

interface AdminLayoutProps {
  children: React.ReactNode;
  stats?: {
    totalUsers?: number;
    totalPredictions?: number;
  };
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, stats: propStats }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Initialize with cached stats from sessionStorage to prevent flash of 0
  const getCachedStats = (): { totalUsers?: number; totalPredictions?: number } => {
    try {
      const cached = sessionStorage.getItem('admin_sidebar_stats');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Only use cache if it's recent (less than 5 minutes old)
        if (parsed.timestamp && Date.now() - parsed.timestamp < 5 * 60 * 1000) {
          return parsed.data;
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
    return {};
  };

  const [layoutStats, setLayoutStats] = useState<{ totalUsers?: number; totalPredictions?: number }>(getCachedStats());
  const location = useLocation();

  // Fetch stats for sidebar counters - fetches on mount and route changes
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiService.get('/admin/stats');
        if ((response as any).success) {
          const data = (response as any).data;
          const newStats = {
            totalUsers: data.totalUsers,
            totalPredictions: data.totalPredictions
          };
          setLayoutStats(newStats);
          // Cache the stats in sessionStorage
          try {
            sessionStorage.setItem('admin_sidebar_stats', JSON.stringify({
              data: newStats,
              timestamp: Date.now()
            }));
          } catch (e) {
            // Ignore storage errors
          }
        }
      } catch (err) {
        console.error('Failed to fetch stats for sidebar:', err);
        // On error, only set prop stats if we haven't loaded stats yet
        setLayoutStats(prevStats => {
          if (prevStats.totalUsers === undefined && prevStats.totalPredictions === undefined) {
            return {
              totalUsers: propStats?.totalUsers,
              totalPredictions: propStats?.totalPredictions
            };
          }
          return prevStats; // Keep existing stats
        });
      }
    };

    fetchStats();
  }, [location.pathname]); // Fetch on route change to keep stats updated

  useEffect(() => {
    // Listen for sidebar toggle events from navbar
    const handleToggleSidebar = () => {
      setSidebarOpen(prev => !prev);
    };
    
    window.addEventListener('toggleSidebar', handleToggleSidebar);
    
    return () => {
      window.removeEventListener('toggleSidebar', handleToggleSidebar);
    };
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (sidebarOpen && !target.closest('.dashboard-sidebar') && !target.closest('.sidebar-toggle-btn')) {
        setSidebarOpen(false);
      }
    };

    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Always prioritize layoutStats (from API) - these are the global stats
  // Only use propStats as initial fallback if layoutStats is not yet loaded
  // This ensures consistent numbers across all pages
  const displayStats = {
    totalUsers: layoutStats.totalUsers !== undefined 
      ? layoutStats.totalUsers 
      : (propStats?.totalUsers ?? 0),
    totalPredictions: layoutStats.totalPredictions !== undefined 
      ? layoutStats.totalPredictions 
      : (propStats?.totalPredictions ?? 0)
  };

  return (
    <div className="admin-dashboard">
      <AdminNavbar />
      
      <div className="dashboard-container">
        {/* Sidebar */}
        <div className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <Link 
              to="/admin"
              className="d-flex align-items-center justify-content-start fw-bold text-dark"
              style={{ 
                textDecoration: 'none',
                fontSize: '1.25rem',
                paddingLeft: '1.5rem'
              }}
            >
              <span>Admin Panel</span>
            </Link>
            <button 
              className="sidebar-toggle d-admin-desktop-toggle ms-auto"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Close sidebar"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          
          <nav className="sidebar-nav">
            <a href="/admin" className={`nav-item ${isActive('/admin') ? 'active' : ''}`}>
              <i className="bi bi-speedometer2"></i>
              <span>Dashboard</span>
            </a>
            <a href="/admin/users" className={`nav-item ${isActive('/admin/users') ? 'active' : ''}`}>
              <i className="bi bi-people-fill"></i>
              <span>Users</span>
              <span className="badge">{displayStats.totalUsers}</span>
            </a>
            <a href="/admin/predictions" className={`nav-item ${isActive('/admin/predictions') ? 'active' : ''}`}>
              <i className="bi bi-graph-up"></i>
              <span>Predictions</span>
              <span className="badge">{displayStats.totalPredictions}</span>
            </a>
            <a href="/admin/payments" className={`nav-item ${isActive('/admin/payments') ? 'active' : ''}`}>
              <i className="bi bi-credit-card"></i>
              <span>Recent Payments</span>
            </a>
          </nav>
        </div>

        {/* Main Content */}
        <div className="dashboard-main">
          {children}
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay d-admin-desktop-toggle"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default AdminLayout;
