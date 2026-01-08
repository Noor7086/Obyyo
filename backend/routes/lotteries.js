import express from 'express';
import Lottery from '../models/Lottery.js';

const router = express.Router();

// @route   GET /api/lotteries
// @desc    Get all supported lotteries (from database, fallback to hardcoded)
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Try to fetch from database first
    const dbLotteries = await Lottery.find({ isActive: true }).sort({ name: 1 });
    
    if (dbLotteries && dbLotteries.length > 0) {
      // Format database lotteries to match expected format
      const formattedLotteries = dbLotteries.map(lottery => ({
        id: lottery.code.toLowerCase(),
        name: lottery.name,
        code: lottery.code,
        type: lottery.type,
        description: lottery.description,
        price: lottery.price,
        currency: lottery.currency,
        drawSchedule: lottery.drawSchedule,
        isActive: lottery.isActive,
        state: lottery.state,
        country: lottery.country,
        officialWebsite: lottery.officialWebsite,
        lastDrawDate: lottery.lastDrawDate,
        nextDrawDate: lottery.nextDrawDate,
        singleSelection: lottery.singleSelection,
        doubleSelection: lottery.doubleSelection
      }));

      return res.json({
        success: true,
        data: { lotteries: formattedLotteries }
      });
    }

    // Fallback to hardcoded lotteries if database is empty
    const lotteries = [
      {
        id: 'gopher5',
        name: 'Gopher 5',
        code: 'GOPHER5',
        type: 'single',
        description: 'Pick 5 numbers from 1-47',
        price: 1,
        currency: 'USD',
        drawSchedule: [
          { day: 'monday', time: '18:00' },
          { day: 'wednesday', time: '18:00' },
          { day: 'friday', time: '18:00' }
        ],
        isActive: true,
        state: 'Minnesota',
        country: 'USA',
        officialWebsite: 'https://www.mnlottery.com/games/draw-games/gopher-5',
        singleSelection: {
          pickCount: 5,
          totalNumbers: 47
        }
      },
      {
        id: 'pick3',
        name: 'Pick 3',
        code: 'PICK3',
        type: 'single',
        description: 'Pick 3 numbers from 0-9',
        price: 1,
        currency: 'USD',
        drawSchedule: [
          { day: 'monday', time: '18:00' },
          { day: 'tuesday', time: '18:00' },
          { day: 'wednesday', time: '18:00' },
          { day: 'thursday', time: '18:00' },
          { day: 'friday', time: '18:00' },
          { day: 'saturday', time: '18:00' },
          { day: 'sunday', time: '18:00' }
        ],
        isActive: true,
        state: 'Minnesota',
        country: 'USA',
        officialWebsite: 'https://www.mnlottery.com/games/draw-games/pick-3',
        singleSelection: {
          pickCount: 3,
          totalNumbers: 10
        }
      },
      {
        id: 'lottoamerica',
        name: 'Lotto America',
        code: 'LOTTOAMERICA',
        type: 'double',
        description: 'Pick 5 from 52 + 1 from 10',
        price: 1,
        currency: 'USD',
        drawSchedule: [
          { day: 'wednesday', time: '22:00' },
          { day: 'saturday', time: '22:00' }
        ],
        isActive: true,
        state: 'Multi-State',
        country: 'USA',
        officialWebsite: 'https://www.lottoamerica.com',
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
        id: 'megamillion',
        name: 'Mega Millions',
        code: 'MEGAMILLION',
        type: 'double',
        description: 'Pick 5 from 70 + 1 from 25',
        price: 5,
        currency: 'USD',
        drawSchedule: [
          { day: 'tuesday', time: '23:00' },
          { day: 'friday', time: '23:00' }
        ],
        isActive: true,
        state: 'Multi-State',
        country: 'USA',
        officialWebsite: 'https://www.megamillions.com',
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
        id: 'powerball',
        name: 'Powerball',
        code: 'POWERBALL',
        type: 'double',
        description: 'Pick 5 from 69 + 1 from 26',
        price: 2,
        currency: 'USD',
        drawSchedule: [
          { day: 'wednesday', time: '20:59' },
          { day: 'saturday', time: '20:59' }
        ],
        isActive: true,
        state: 'Multi-State',
        country: 'USA',
        officialWebsite: 'https://www.powerball.com',
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
      }
    ];

    res.json({
      success: true,
      data: { lotteries }
    });
  } catch (error) {
    console.error('Get lotteries error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;

