import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  prediction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prediction',
    required: [true, 'Prediction is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  paymentMethod: {
    type: String,
    enum: ['wallet', 'stripe', 'paypal', 'trial'],
    required: [true, 'Payment method is required']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'trial'],
    default: 'pending'
  },
  isTrialView: {
    type: Boolean,
    default: false
  },
  stripePaymentIntentId: {
    type: String,
    sparse: true
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastDownloaded: {
    type: Date
  },
  isRefunded: {
    type: Boolean,
    default: false
  },
  refundReason: {
    type: String,
    maxlength: [200, 'Refund reason cannot exceed 200 characters']
  },
  // Additional transaction metadata
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  paymentGatewayResponse: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for efficient queries
purchaseSchema.index({ user: 1, prediction: 1 });
purchaseSchema.index({ paymentStatus: 1 });
purchaseSchema.index({ createdAt: -1 });

// Virtual for purchase status display
purchaseSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    'pending': 'Payment Pending',
    'completed': 'Completed',
    'failed': 'Payment Failed',
    'refunded': 'Refunded',
    'trial': 'Free Trial'
  };
  return statusMap[this.paymentStatus] || this.paymentStatus;
});

// Method to check if purchase is active
purchaseSchema.methods.isActive = function() {
  return this.paymentStatus === 'completed' && !this.isRefunded;
};

export default mongoose.model('Purchase', purchaseSchema);

