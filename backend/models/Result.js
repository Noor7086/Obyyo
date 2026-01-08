import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema({
  prediction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prediction',
    required: [true, 'Prediction is required']
  },
  lotteryType: {
    type: String,
    required: [true, 'Lottery type is required'],
    enum: ['gopher5', 'pick3', 'lottoamerica', 'megamillion', 'powerball']
  },
  drawDate: {
    type: Date,
    required: [true, 'Draw date is required']
  },
  // Winning numbers based on lottery type
  winningNumbers: {
    whiteBalls: [{
      type: Number,
      required: false
    }],
    redBalls: [{
      type: Number,
      required: false
    }]
  },
  // For single selection lotteries
  winningNumbersSingle: [{
    type: Number,
    required: false
  }],
  // For Pick 3 type lotteries
  winningNumbersPick3: [{
    type: Number,
    required: false
  }],
  jackpot: {
    type: Number,
    required: false,
    default: 0
  },
  winners: {
    jackpot: {
      type: Number,
      default: 0
    },
    match5: {
      type: Number,
      default: 0
    },
    match4: {
      type: Number,
      default: 0
    },
    match3: {
      type: Number,
      default: 0
    },
    exact: {
      type: Number,
      default: 0
    },
    any: {
      type: Number,
      default: 0
    }
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
resultSchema.index({ lotteryType: 1, drawDate: -1 });
resultSchema.index({ prediction: 1 });

export default mongoose.model('Result', resultSchema);



