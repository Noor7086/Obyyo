import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Wallet from './backend/models/Wallet.js';
import User from './backend/models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Check Wallets
        const wallets = await Wallet.find({});
        console.log(`Found ${wallets.length} wallets.`);

        if (wallets.length > 0) {
            console.log('Sample Wallet:', JSON.stringify(wallets[0], null, 2));
            const transactions = wallets.reduce((acc, w) => acc + w.transactions.length, 0);
            console.log(`Total Transactions in Wallets: ${transactions}`);

            // Check credit transactions
            const credits = wallets.flatMap(w => w.transactions.filter(t => t.type === 'credit'));
            console.log(`Total Credit Transactions: ${credits.length}`);
            if (credits.length > 0) console.log('Sample Credit:', credits[0]);
        } else {
            console.log('No wallets found! This explains why Admin Panel is empty.');
        }

        // Check Users with walletBalance > 0
        const richUsers = await User.find({ walletBalance: { $gt: 0 } });
        console.log(`Found ${richUsers.length} users with walletBalance > 0 in User model.`);
        if (richUsers.length > 0) {
            console.log('Sample User:', richUsers[0].email, richUsers[0].walletBalance);
        }

        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

connectDB();
