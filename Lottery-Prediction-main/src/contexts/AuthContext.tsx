import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType, LoginForm, RegisterForm, ProfileUpdateForm, PasswordChangeForm } from '../types';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on app load
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginForm) => {
    try {
      setLoading(true);
      const response = await authService.login(credentials);
      setUser(response.user);
      localStorage.setItem('token', response.token);
      toast.success('Login successful!');
      return response; // Return the response so components can access user data
    } catch (error: any) {
      // Don't show toast for login errors - let the component handle error display
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterForm) => {
    try {
      setLoading(true);
      const response = await authService.register(userData);
      setUser(response.user);
      localStorage.setItem('token', response.token);
      // toast.success('Registration successful! Welcome to Obyyo!'); // Moved to VerifyOTP
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = (silent = false) => {
    setUser(null);
    localStorage.removeItem('token');
    if (!silent) {
      toast.success('Logged out successfully');
    }
  };

  const updateProfile = async (data: ProfileUpdateForm) => {
    try {
      const updatedUser = await authService.updateProfile(data);
      setUser(prev => (prev ? { ...prev, ...updatedUser } : updatedUser));
      toast.success('Profile updated successfully!');
      return updatedUser;
    } catch (error: any) {
      toast.error(error.message || 'Profile update failed');
      throw error;
    }
  };

  const changePassword = async (data: PasswordChangeForm) => {
    try {
      await authService.changePassword(data);
      // Don't show toast here, let the component handle success/error messages
    } catch (error: any) {
      console.error('AuthContext changePassword error:', error);
      console.error('AuthContext error message:', error.message);
      // Don't show toast here, let the component handle error messages
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Refresh user error:', error);
      logout();
    }
  };

  // Trial helper functions
  const isTrialActive = (): boolean => {
    if (!user || !user.isInTrial || !user.trialEndDate) return false;
    const now = new Date();
    const trialEnd = new Date(user.trialEndDate);
    return now <= trialEnd;
  };

  const isTrialExpired = (): boolean => {
    if (!user || !user.trialEndDate) return false;
    const now = new Date();
    const trialEnd = new Date(user.trialEndDate);
    return now > trialEnd;
  };

  const canStartTrial = (): boolean => {
    // User can only start trial if they haven't used it and are not currently in trial
    if (!user) return true; // Not logged in, can register for trial
    // Safety check: if hasUsedTrial is undefined, treat as false (newer users have this field)
    const hasUsedTrialValue = user.hasUsedTrial ?? false;
    return !hasUsedTrialValue && !user.isInTrial;
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshUser,
    isTrialActive,
    isTrialExpired,
    canStartTrial
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

