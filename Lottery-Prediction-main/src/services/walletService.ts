import { apiService } from './api';

export interface Transaction {
  _id: string;
  type: 'credit' | 'debit' | 'refund' | 'payment' | 'bonus' | 'withdrawal';
  amount: number;
  description: string;
  reference?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  _id: string;
  user: string;
  balance: number;
  currency: string;
  isActive: boolean;
  transactions: Transaction[];
  totalDeposited: number;
  totalWithdrawn: number;
  lastTransactionDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletStats {
  currentBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  transactionCount: number;
  lastTransactionDate?: string;
  recentTransactions: Transaction[];
  monthlyStats: {
    thisMonth: number;
    lastMonth: number;
  };
  deposits: {
    last7Days: number;
    last30Days: number;
    thisMonth: number;
    recentTransactions: Transaction[];
  };
  spending: {
    last7Days: number;
    last30Days: number;
    thisMonth: number;
    recentTransactions: Transaction[];
  };
}

export interface DepositRequest {
  amount: number;
  description?: string;
  reference?: string;
}

export interface WithdrawRequest {
  amount: number;
  description?: string;
  reference?: string;
}

export interface PaymentRequest {
  amount: number;
  description: string;
  reference?: string;
  metadata?: any;
}

export interface BonusRequest {
  amount: number;
  description: string;
  reference?: string;
  metadata?: any;
}

export interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
}

export interface PaginatedTransactions {
  transactions: Transaction[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalTransactions: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class WalletService {
  // Get user's wallet
  async getWallet(): Promise<Wallet> {
    const response = await apiService.get<{ success: boolean; data: Wallet }>('/wallet');
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch wallet');
    }
    return response.data;
  }

  // Get wallet statistics
  async getWalletStats(): Promise<WalletStats> {
    const response = await apiService.get<{ success: boolean; data: WalletStats }>('/wallet/stats');
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch wallet statistics');
    }
    // Debug log removed
    return response.data;
  }

  // Get wallet transactions with pagination and filtering
  async getTransactions(filters: TransactionFilters = {}): Promise<PaginatedTransactions> {
    const params = new URLSearchParams();
    
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.type) params.append('type', filters.type);
    if (filters.status) params.append('status', filters.status);

    const response = await apiService.get<{ success: boolean; data: PaginatedTransactions }>(`/wallet/transactions?${params.toString()}`);
    if (!response.success || !response.data) {
      throw new Error('Failed to fetch transactions');
    }
    return response.data;
  }

  // Deposit funds to wallet
  async depositFunds(depositData: DepositRequest): Promise<Wallet> {
    const response = await apiService.post<{ success: boolean; data: Wallet; message: string }>('/wallet/deposit', depositData);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to deposit funds');
    }
    return response.data;
  }

  // Withdraw funds from wallet
  async withdrawFunds(withdrawData: WithdrawRequest): Promise<Wallet> {
    const response = await apiService.post<{ success: boolean; data: Wallet; message: string }>('/wallet/withdraw', withdrawData);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to withdraw funds');
    }
    return response.data;
  }

  // Make payment from wallet
  async makePayment(paymentData: PaymentRequest): Promise<Wallet> {
    const response = await apiService.post<{ success: boolean; data: Wallet; message: string }>('/wallet/payment', paymentData);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to process payment');
    }
    return response.data;
  }

  // Add bonus to wallet
  async addBonus(bonusData: BonusRequest): Promise<Wallet> {
    const response = await apiService.post<{ success: boolean; data: Wallet; message: string }>('/wallet/bonus', bonusData);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to add bonus');
    }
    return response.data;
  }

  // Get recent transactions (last 10)
  async getRecentTransactions(): Promise<Transaction[]> {
    const response = await this.getTransactions({ limit: 10 });
    return response.transactions;
  }

  // Get transactions by type
  async getTransactionsByType(type: string): Promise<Transaction[]> {
    const response = await this.getTransactions({ type });
    return response.transactions;
  }

  // Get pending transactions
  async getPendingTransactions(): Promise<Transaction[]> {
    const response = await this.getTransactions({ status: 'pending' });
    return response.transactions;
  }

  // Format currency
  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  // Format transaction type for display
  formatTransactionType(type: string): string {
    const typeMap: { [key: string]: string } = {
      credit: 'Deposit',
      debit: 'Payment',
      refund: 'Refund',
      payment: 'Payment',
      bonus: 'Bonus',
      withdrawal: 'Withdrawal'
    };
    return typeMap[type] || type;
  }

  // Get transaction icon
  getTransactionIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      credit: '💰',
      debit: '💸',
      refund: '↩️',
      payment: '💳',
      bonus: '🎁',
      withdrawal: '🏦'
    };
    return iconMap[type] || '💵';
  }

  // Get transaction color class
  getTransactionColorClass(type: string): string {
    const colorMap: { [key: string]: string } = {
      credit: 'text-success',
      debit: 'text-danger',
      refund: 'text-info',
      payment: 'text-warning',
      bonus: 'text-primary',
      withdrawal: 'text-secondary'
    };
    return colorMap[type] || 'text-muted';
  }
}

export const walletService = new WalletService();







