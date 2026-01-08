import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { walletService, Wallet, WalletStats, Transaction, DepositRequest, WithdrawRequest, PaymentRequest, BonusRequest } from '../services/walletService';
import toast from 'react-hot-toast';

interface WalletContextType {
  wallet: Wallet | null;
  walletStats: WalletStats | null;
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchWallet: () => Promise<void>;
  fetchWalletStats: () => Promise<void>;
  fetchTransactions: (filters?: any) => Promise<void>;
  depositFunds: (data: DepositRequest) => Promise<boolean>;
  withdrawFunds: (data: WithdrawRequest) => Promise<boolean>;
  makePayment: (data: PaymentRequest) => Promise<boolean>;
  addBonus: (data: BonusRequest) => Promise<boolean>;
  
  // Utility functions
  formatCurrency: (amount: number) => string;
  formatTransactionType: (type: string) => string;
  getTransactionIcon: (type: string) => string;
  getTransactionColorClass: (type: string) => string;
  
  // State management
  refreshWallet: () => Promise<void>;
  clearError: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [walletStats, setWalletStats] = useState<WalletStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch wallet data
  const fetchWallet = async () => {
    try {
      setLoading(true);
      setError(null);
      const walletData = await walletService.getWallet();
      setWallet(walletData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch wallet');
      console.error('Fetch wallet error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch wallet statistics
  const fetchWalletStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const stats = await walletService.getWalletStats();
      setWalletStats(stats);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch wallet statistics');
      console.error('Fetch wallet stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch transactions
  const fetchTransactions = async (filters: any = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await walletService.getTransactions(filters);
      setTransactions(response.transactions);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch transactions');
      console.error('Fetch transactions error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Deposit funds
  const depositFunds = async (data: DepositRequest): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const updatedWallet = await walletService.depositFunds(data);
      setWallet(updatedWallet);
      toast.success('Funds deposited successfully!');
      
      // Refresh stats and transactions
      await Promise.all([
        fetchWalletStats(),
        fetchTransactions()
      ]);
      
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to deposit funds';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Withdraw funds
  const withdrawFunds = async (data: WithdrawRequest): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const updatedWallet = await walletService.withdrawFunds(data);
      setWallet(updatedWallet);
      toast.success('Withdrawal request submitted successfully!');
      
      // Refresh stats and transactions
      await Promise.all([
        fetchWalletStats(),
        fetchTransactions()
      ]);
      
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to withdraw funds';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Make payment
  const makePayment = async (data: PaymentRequest): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const updatedWallet = await walletService.makePayment(data);
      setWallet(updatedWallet);
      toast.success('Payment completed successfully!');
      
      // Refresh stats and transactions
      await Promise.all([
        fetchWalletStats(),
        fetchTransactions()
      ]);
      
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to process payment';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Add bonus
  const addBonus = async (data: BonusRequest): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const updatedWallet = await walletService.addBonus(data);
      setWallet(updatedWallet);
      toast.success('Bonus added successfully!');
      
      // Refresh stats and transactions
      await Promise.all([
        fetchWalletStats(),
        fetchTransactions()
      ]);
      
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to add bonus';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Refresh all wallet data
  const refreshWallet = async () => {
    await Promise.all([
      fetchWallet(),
      fetchWalletStats(),
      fetchTransactions()
    ]);
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Utility functions
  const formatCurrency = (amount: number): string => {
    return walletService.formatCurrency(amount, wallet?.currency);
  };

  const formatTransactionType = (type: string): string => {
    return walletService.formatTransactionType(type);
  };

  const getTransactionIcon = (type: string): string => {
    return walletService.getTransactionIcon(type);
  };

  const getTransactionColorClass = (type: string): string => {
    return walletService.getTransactionColorClass(type);
  };

  // Initial data fetch
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      refreshWallet();
    }
  }, []);

  const value: WalletContextType = {
    wallet,
    walletStats,
    transactions,
    loading,
    error,
    fetchWallet,
    fetchWalletStats,
    fetchTransactions,
    depositFunds,
    withdrawFunds,
    makePayment,
    addBonus,
    formatCurrency,
    formatTransactionType,
    getTransactionIcon,
    getTransactionColorClass,
    refreshWallet,
    clearError
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

// Custom hook to use wallet context
export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};







