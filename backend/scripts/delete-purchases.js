import mongoose from 'mongoose';
import Purchase from '../models/Purchase.js';
import User from '../models/User.js';
import Prediction from '../models/Prediction.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../env') });

// Transaction IDs to delete
const transactionIds = [
  'WALLET_1761968196163_68e9ee09a6b9c9861906b6b0',
  'WALLET_1761966311270_68e9ee09a6b9c9861906b6b0',
  'WALLET_1761966017346_68e9ee09a6b9c9861906b6b0',
  'WALLET_1761965542521_68e9ee09a6b9c9861906b6b0',
  'WALLET_1761965319290_68e9ee09a6b9c9861906b6b0'
];

async function deletePurchases() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find purchases before deletion
    const purchasesToDelete = await Purchase.find({
      transactionId: { $in: transactionIds }
    }).populate('user', 'email firstName lastName').populate('prediction', 'lotteryType');

    console.log(`\n📋 Found ${purchasesToDelete.length} purchases to delete:`);
    purchasesToDelete.forEach((purchase, index) => {
      console.log(`${index + 1}. Transaction ID: ${purchase.transactionId}`);
      console.log(`   User: ${purchase.user?.email || 'N/A'} (${purchase.user?.firstName || ''} ${purchase.user?.lastName || ''})`);
      console.log(`   Amount: $${purchase.amount}`);
      console.log(`   Date: ${purchase.createdAt}`);
      console.log(`   Lottery: ${purchase.prediction?.lotteryType || 'N/A'}`);
      console.log('');
    });

    // Delete purchases
    const deleteResult = await Purchase.deleteMany({
      transactionId: { $in: transactionIds }
    });

    console.log(`\n✅ Successfully deleted ${deleteResult.deletedCount} purchase(s)`);
    console.log(`📝 Transaction IDs deleted:`, transactionIds);

    // Disconnect
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting purchases:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
deletePurchases();

