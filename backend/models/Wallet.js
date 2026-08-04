import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['credit', 'debit', 'refund', 'payment', 'bonus', 'withdrawal'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  reference: {
    type: String, // For payment references, transaction IDs, etc.
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  transactions: [transactionSchema],
  totalDeposited: {
    type: Number,
    default: 0
  },
  totalWithdrawn: {
    type: Number,
    default: 0
  },
  lastTransactionDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for better query performance
walletSchema.index({ user: 1 });
walletSchema.index({ 'transactions.createdAt': -1 });

// Virtual for transaction count
walletSchema.virtual('transactionCount').get(function() {
  return this.transactions.length;
});

// Method to add transaction
walletSchema.methods.addTransaction = function(transactionData) {
  const transaction = {
    ...transactionData,
    createdAt: new Date()
  };
  
  this.transactions.push(transaction);
  this.lastTransactionDate = new Date();
  
  // Update totals
  if (transactionData.type === 'credit' || transactionData.type === 'refund' || transactionData.type === 'bonus') {
    this.totalDeposited += transactionData.amount;
  } else if (transactionData.type === 'debit' || transactionData.type === 'withdrawal') {
    this.totalWithdrawn += transactionData.amount;
  }
  
  return this.save();
};

// Method to update balance
walletSchema.methods.updateBalance = function(amount, type) {
  if (type === 'credit' || type === 'refund' || type === 'bonus') {
    this.balance += amount;
  } else if (type === 'debit' || type === 'withdrawal') {
    if (this.balance >= amount) {
      this.balance -= amount;
    } else {
      throw new Error('Insufficient balance');
    }
  }
  
  return this.save();
};

// Method to get recent transactions
walletSchema.methods.getRecentTransactions = function(limit = 10) {
  return this.transactions
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
};

// Method to get transactions by type
walletSchema.methods.getTransactionsByType = function(type) {
  return this.transactions.filter(transaction => transaction.type === type);
};

// Method to get balance history (for charts)
walletSchema.methods.getBalanceHistory = function(days = 30) {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
  
  return this.transactions
    .filter(transaction => transaction.createdAt >= startDate)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
};

// Static method to create wallet for user
walletSchema.statics.createForUser = async function(userId) {
  const existingWallet = await this.findOne({ user: userId });
  if (existingWallet) {
    return existingWallet;
  }
  
  const wallet = new this({
    user: userId,
    balance: 0
  });
  
  return wallet.save();
};

// Pre-save middleware to ensure balance is not negative
walletSchema.pre('save', function(next) {
  if (this.balance < 0) {
    return next(new Error('Wallet balance cannot be negative'));
  }
  next();
});

export default mongoose.model('Wallet', walletSchema);

