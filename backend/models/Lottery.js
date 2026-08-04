import mongoose from 'mongoose';

const lotterySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Lottery name is required'],
    unique: true
  },
  code: {
    type: String,
    required: [true, 'Lottery code is required'],
    uppercase: true
  },
  type: {
    type: String,
    enum: ['single', 'double'],
    required: [true, 'Lottery type is required']
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  // For single selection lotteries (e.g., Gopher 5: 5/47)
  singleSelection: {
    pickCount: {
      type: Number,
      min: 1,
      max: 10
    },
    totalNumbers: {
      type: Number,
      min: 1,
      max: 100
    }
  },
  // For double selection lotteries (e.g., Powerball: 5/69 + 1/26)
  doubleSelection: {
    whiteBalls: {
      pickCount: {
        type: Number,
        min: 1,
        max: 10
      },
      totalNumbers: {
        type: Number,
        min: 1,
        max: 100
      }
    },
    redBalls: {
      pickCount: {
        type: Number,
        min: 1,
        max: 10
      },
      totalNumbers: {
        type: Number,
        min: 1,
        max: 100
      }
    }
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP']
  },
  drawSchedule: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    time: {
      type: String,
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  state: {
    type: String,
    required: [true, 'State is required']
  },
  country: {
    type: String,
    required: [true, 'Country is required']
  },
  officialWebsite: {
    type: String,
    match: [/^https?:\/\/.+/, 'Please enter a valid URL']
  },
  lastDrawDate: {
    type: Date
  },
  nextDrawDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
lotterySchema.index({ code: 1 });
lotterySchema.index({ isActive: 1 });
lotterySchema.index({ state: 1, country: 1 });

// Virtual for display name
lotterySchema.virtual('displayName').get(function() {
  return `${this.name} (${this.state})`;
});

// Method to get lottery configuration
lotterySchema.methods.getConfiguration = function() {
  if (this.type === 'single') {
    return {
      type: 'single',
      pickCount: this.singleSelection.pickCount,
      totalNumbers: this.singleSelection.totalNumbers
    };
  } else {
    return {
      type: 'double',
      whiteBalls: {
        pickCount: this.doubleSelection.whiteBalls.pickCount,
        totalNumbers: this.doubleSelection.whiteBalls.totalNumbers
      },
      redBalls: {
        pickCount: this.doubleSelection.redBalls.pickCount,
        totalNumbers: this.doubleSelection.redBalls.totalNumbers
      }
    };
  }
};

// Method to get next draw date
lotterySchema.methods.getNextDrawDate = function() {
  if (this.nextDrawDate) {
    return this.nextDrawDate;
  }
  
  // Calculate next draw based on schedule
  const now = new Date();
  const today = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  for (const schedule of this.drawSchedule) {
    const scheduleDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(schedule.day);
    const [hours, minutes] = schedule.time.split(':').map(Number);
    
    const nextDraw = new Date(now);
    nextDraw.setHours(hours, minutes, 0, 0);
    
    if (scheduleDay > today || (scheduleDay === today && nextDraw > now)) {
      const daysUntilDraw = (scheduleDay - today + 7) % 7;
      nextDraw.setDate(nextDraw.getDate() + daysUntilDraw);
      return nextDraw;
    }
  }
  
  return null;
};

export default mongoose.model('Lottery', lotterySchema);

