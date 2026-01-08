import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Lottery from './models/Lottery.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, 'env') });

const lotteries = [
  {
    name: 'Powerball',
    code: 'POWERBALL',
    type: 'double',
    description: 'Pick 5 from 69 + 1 from 26. America\'s favorite multi-state lottery game with huge jackpots.',
    price: 2,
    currency: 'USD',
    state: 'Multi-State',
    country: 'USA',
    officialWebsite: 'https://www.powerball.com',
    isActive: true,
    drawSchedule: [
      { day: 'wednesday', time: '20:59' },
      { day: 'saturday', time: '20:59' }
    ],
    // Note: Times are in 24-hour format. 8:59 PM EST = 20:59
    doubleSelection: {
      whiteBalls: {
        pickCount: 5,
        totalNumbers: 69
      },
      redBalls: {
        pickCount: 1,
        totalNumbers: 26
      }
    }
  },
  {
    name: 'Mega Millions',
    code: 'MEGAMILLION',
    type: 'double',
    description: 'Pick 5 from 70 + 1 from 25. One of the largest lottery jackpots in the world.',
    price: 5,
    currency: 'USD',
    state: 'Multi-State',
    country: 'USA',
    officialWebsite: 'https://www.megamillions.com',
    isActive: true,
    drawSchedule: [
      { day: 'tuesday', time: '23:00' },
      { day: 'friday', time: '23:00' }
    ],
    doubleSelection: {
      whiteBalls: {
        pickCount: 5,
        totalNumbers: 70
      },
      redBalls: {
        pickCount: 1,
        totalNumbers: 25
      }
    }
  },
  {
    name: 'Lotto America',
    code: 'LOTTOAMERICA',
    type: 'double',
    description: 'Pick 5 from 52 + 1 from 10. A multi-state lottery game with great odds.',
    price: 1,
    currency: 'USD',
    state: 'Multi-State',
    country: 'USA',
    officialWebsite: 'https://www.lottoamerica.com',
    isActive: true,
    drawSchedule: [
      { day: 'wednesday', time: '22:00' },
      { day: 'saturday', time: '22:00' }
    ],
    doubleSelection: {
      whiteBalls: {
        pickCount: 5,
        totalNumbers: 52
      },
      redBalls: {
        pickCount: 1,
        totalNumbers: 10
      }
    }
  },
  {
    name: 'Gopher 5',
    code: 'GOPHER5',
    type: 'single',
    description: 'Pick 5 numbers from 1-47. Minnesota\'s popular state lottery game.',
    price: 1,
    currency: 'USD',
    state: 'Minnesota',
    country: 'USA',
    officialWebsite: 'https://www.mnlottery.com/games/draw-games/gopher-5',
    isActive: true,
    drawSchedule: [
      { day: 'monday', time: '18:00' },
      { day: 'wednesday', time: '18:00' },
      { day: 'friday', time: '18:00' }
    ],
    singleSelection: {
      pickCount: 5,
      totalNumbers: 47
    }
  },
  {
    name: 'Pick 3',
    code: 'PICK3',
    type: 'single',
    description: 'Pick 3 numbers from 0-9. Daily drawings with multiple ways to win.',
    price: 1,
    currency: 'USD',
    state: 'Minnesota',
    country: 'USA',
    officialWebsite: 'https://www.mnlottery.com/games/draw-games/pick-3',
    isActive: true,
    drawSchedule: [
      { day: 'monday', time: '18:00' },
      { day: 'tuesday', time: '18:00' },
      { day: 'wednesday', time: '18:00' },
      { day: 'thursday', time: '18:00' },
      { day: 'friday', time: '18:00' },
      { day: 'saturday', time: '18:00' },
      { day: 'sunday', time: '18:00' }
    ],
    singleSelection: {
      pickCount: 3,
      totalNumbers: 10  // 0-9 is 10 numbers
    }
  }
];

async function seedLotteries() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');

    // Clear existing lotteries (optional - comment out if you want to keep existing ones)
    // await Lottery.deleteMany({});
    // console.log('Cleared existing lotteries');

    // Insert lotteries
    for (const lotteryData of lotteries) {
      try {
        // Check if lottery already exists
        const existingLottery = await Lottery.findOne({ code: lotteryData.code });
        if (existingLottery) {
          console.log(`Lottery ${lotteryData.code} already exists, skipping...`);
          continue;
        }

        const lottery = await Lottery.create(lotteryData);
        console.log(`✓ Created lottery: ${lottery.name} (${lottery.code})`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`✗ Lottery ${lotteryData.code} already exists (duplicate key)`);
        } else {
          console.error(`✗ Error creating ${lotteryData.code}:`, error.message);
        }
      }
    }

    console.log('\n✓ Lottery seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding lotteries:', error);
    process.exit(1);
  }
}

seedLotteries();

