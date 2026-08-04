// One-time migration: discontinue Pick 3 and set Mega Millions price to $3.
// Run from the backend directory:  node scripts/remove-pick3-update-megamillion-price.js
// Uses MONGODB_URI from backend/.env — run again with the production URI when deploying.
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dns from 'dns';

// Same workaround as server.js — local DNS blocks SRV lookups for Atlas
dns.setServers(['8.8.8.8', '8.8.4.4']);

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;

  const lotteryPrice = await db.collection('lotteries').updateMany(
    { code: 'MEGAMILLION' },
    { $set: { price: 3 } }
  );
  console.log(`Mega Millions price set to $3 (matched ${lotteryPrice.matchedCount}, modified ${lotteryPrice.modifiedCount})`);

  const pick3Lottery = await db.collection('lotteries').updateMany(
    { code: 'PICK3' },
    { $set: { isActive: false } }
  );
  console.log(`Pick 3 lottery deactivated (matched ${pick3Lottery.matchedCount}, modified ${pick3Lottery.modifiedCount})`);

  const pick3Predictions = await db.collection('predictions').updateMany(
    { lotteryType: 'pick3' },
    { $set: { isActive: false } }
  );
  console.log(`Pick 3 predictions deactivated (matched ${pick3Predictions.matchedCount}, modified ${pick3Predictions.modifiedCount})`);

  await mongoose.disconnect();
  console.log('Done');
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
