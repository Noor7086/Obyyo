import mongoose from 'mongoose';

const predictionSchema = new mongoose.Schema({
  lotteryType: {
    type: String,
    required: [true, 'Lottery type is required'],
    enum: ['gopher5', 'pick3', 'lottoamerica', 'megamillion', 'powerball']
  },
  drawDate: {
    type: Date,
    required: [true, 'Draw date is required']
  },
  drawTime: {
    type: String,
    required: [true, 'Draw time is required']
  },
  // Viable numbers - the numbers that ARE recommended (will appear in draw)
  viableNumbers: {
    whiteBalls: [{
      type: Number,
      required: false
    }],
    redBalls: [{
      type: Number,
      required: false
    }]
  },
  // For single selection lotteries like Gopher 5
  viableNumbersSingle: [{
    type: Number,
    required: false
  }],
  // For Pick 3 type lotteries
  viableNumbersPick3: [{
    type: Number,
    required: false
  }],
  // Legacy support - keep nonViableNumbers for backward compatibility
  nonViableNumbers: {
    whiteBalls: {
      type: [Number],
      default: []
    },
    redBalls: {
      type: [Number],
      default: []
    }
  },
  nonViableNumbersSingle: {
    type: [Number],
    default: []
  },
  nonViableNumbersPick3: {
    type: [Number],
    default: []
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  purchaseCount: {
    type: Number,
    default: 0
  },
  accuracy: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient queries
predictionSchema.index({ lotteryType: 1, drawDate: 1 });
predictionSchema.index({ isActive: 1, drawDate: 1 });

// Virtual for lottery display name
predictionSchema.virtual('lotteryDisplayName').get(function() {
  const lotteryNames = {
    'gopher5': 'Gopher 5 (Minnesota)',
    'pick3': 'Pick 3 (Minnesota)',
    'lottoamerica': 'Lotto America (USA)',
    'megamillion': 'Mega Millions (USA)',
    'powerball': 'Powerball (USA)'
  };
  return lotteryNames[this.lotteryType] || this.lotteryType;
});

// Method to get viable numbers based on lottery type (preferred)
predictionSchema.methods.getViableNumbers = function() {
  // Convert to plain object if it's a Mongoose document (for consistent access)
  const self = this.toObject ? this.toObject() : this;
  
  switch (this.lotteryType) {
    case 'powerball':
    case 'megamillion':
    case 'lottoamerica':
      // First check viableNumbers (new format)
      if (self.viableNumbers && typeof self.viableNumbers === 'object') {
        // Handle both Mongoose subdocuments and plain objects
        const whiteBalls = self.viableNumbers.whiteBalls ? 
          (Array.isArray(self.viableNumbers.whiteBalls) ? self.viableNumbers.whiteBalls : []) : [];
        const redBalls = self.viableNumbers.redBalls ? 
          (Array.isArray(self.viableNumbers.redBalls) ? self.viableNumbers.redBalls : []) : [];
        // If viableNumbers has data, return it
        if (whiteBalls.length > 0 || redBalls.length > 0) {
          return {
            whiteBalls: whiteBalls,
            redBalls: redBalls
          };
        }
      }
      
      // Also check the Mongoose document directly (in case toObject() doesn't include it)
      if (this.viableNumbers && typeof this.viableNumbers === 'object') {
        const whiteBalls = this.viableNumbers.whiteBalls ? 
          (Array.isArray(this.viableNumbers.whiteBalls) ? Array.from(this.viableNumbers.whiteBalls) : []) : [];
        const redBalls = this.viableNumbers.redBalls ? 
          (Array.isArray(this.viableNumbers.redBalls) ? Array.from(this.viableNumbers.redBalls) : []) : [];
        if (whiteBalls.length > 0 || redBalls.length > 0) {
          return {
            whiteBalls: whiteBalls,
            redBalls: redBalls
          };
        }
      }
      
      // Legacy support: if viableNumbers doesn't exist or is empty, check nonViableNumbers
      // Treat nonViableNumbers as viableNumbers for backward compatibility
      if ((self.nonViableNumbers && typeof self.nonViableNumbers === 'object') ||
          (this.nonViableNumbers && typeof this.nonViableNumbers === 'object')) {
        const nonViable = self.nonViableNumbers || this.nonViableNumbers;
        const whiteBalls = nonViable.whiteBalls ? 
          (Array.isArray(nonViable.whiteBalls) ? 
            (nonViable.whiteBalls.length ? Array.from(nonViable.whiteBalls) : []) : []) : [];
        const redBalls = nonViable.redBalls ? 
          (Array.isArray(nonViable.redBalls) ? 
            (nonViable.redBalls.length ? Array.from(nonViable.redBalls) : []) : []) : [];
        // Return nonViableNumbers as viableNumbers (backward compat - old predictions stored as nonViable)
        if (whiteBalls.length > 0 || redBalls.length > 0) {
          return {
            whiteBalls: whiteBalls,
            redBalls: redBalls
          };
        }
      }
      
      // Return empty structure if nothing found
      return {
        whiteBalls: [],
        redBalls: []
      };
    case 'gopher5':
      const viableSingle = self.viableNumbersSingle || this.viableNumbersSingle;
      if (viableSingle && Array.isArray(viableSingle) && viableSingle.length > 0) {
        return Array.from(viableSingle);
      }
      // Legacy support
      const nonViableSingle = self.nonViableNumbersSingle || this.nonViableNumbersSingle;
      if (nonViableSingle && Array.isArray(nonViableSingle) && nonViableSingle.length > 0) {
        return Array.from(nonViableSingle);
      }
      return [];
    case 'pick3':
      const viablePick3 = self.viableNumbersPick3 || this.viableNumbersPick3;
      if (viablePick3 && Array.isArray(viablePick3) && viablePick3.length > 0) {
        return Array.from(viablePick3);
      }
      // Legacy support
      const nonViablePick3 = self.nonViableNumbersPick3 || this.nonViableNumbersPick3;
      if (nonViablePick3 && Array.isArray(nonViablePick3) && nonViablePick3.length > 0) {
        return Array.from(nonViablePick3);
      }
      return [];
    default:
      return [];
  }
};

// Legacy method - kept for backward compatibility
predictionSchema.methods.getNonViableNumbers = function() {
  // If we have viable numbers, calculate non-viable as the inverse
  const viable = this.getViableNumbers();
  
  switch (this.lotteryType) {
    case 'powerball':
    case 'megamillion':
    case 'lottoamerica':
      if (typeof viable === 'object' && viable.whiteBalls) {
        // For backward compat, return empty (we're using viable now)
        return { whiteBalls: [], redBalls: [] };
      }
      return {
        whiteBalls: this.nonViableNumbers?.whiteBalls || [],
        redBalls: this.nonViableNumbers?.redBalls || []
      };
    case 'gopher5':
    case 'pick3':
      if (Array.isArray(viable)) {
        return [];
      }
      return this.nonViableNumbersSingle || this.nonViableNumbersPick3 || [];
    default:
      return [];
  }
};

export default mongoose.model('Prediction', predictionSchema);

