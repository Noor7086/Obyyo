import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && user.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [user, loading, navigate]);

  // Show loading while checking user role
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // If user is admin, don't render children (will redirect)
  if (user && user.role === 'admin') {
    return null;
  }

  // Render children for non-admin users or logged out users
  return <>{children}</>;
};

export default PublicRoute;


