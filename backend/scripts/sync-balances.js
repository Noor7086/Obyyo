import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env
dotenv.config({ path: join(__dirname, '..', 'env') });

import User from '../models/User.js';
import Wallet from '../models/Wallet.js';

const syncBalances = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({});
        console.log(`Found ${users.length} users to check.`);

        for (const user of users) {
            let wallet = await Wallet.findOne({ user: user._id });

            if (!wallet) {
                console.log(`Creating wallet for user: ${user.email}`);
                wallet = await Wallet.createForUser(user._id);
            }

            // If User has a balance but Wallet doesn't match or has no transactions
            if (user.walletBalance > 0 && wallet.balance !== user.walletBalance) {
                console.log(`Syncing balance for ${user.email}: User(${user.walletBalance}) -> Wallet(${wallet.balance})`);

                // Update wallet balance to match user balance if it's higher
                // (Assuming user.walletBalance might have been the previously updated one in some flows)
                // BUT the user said "one is showing 0 (User) and one is showing 413 (Wallet)"
                // So we should probably sync whichever is higher or just log the discrepancy.

                if (wallet.balance > user.walletBalance) {
                    console.log(`Updating User ${user.email} walletBalance to match Wallet: ${wallet.balance}`);
                    user.walletBalance = wallet.balance;
                    await user.save();
                } else if (user.walletBalance > wallet.balance) {
                    console.log(`Updating Wallet for ${user.email} to match User: ${user.walletBalance}`);
                    wallet.balance = user.walletBalance;
                    await wallet.save();

                    // Add a migration transaction if it doesn't have any
                    if (wallet.transactions.length === 0) {
                        await wallet.addTransaction({
                            type: 'credit',
                            amount: user.walletBalance,
                            description: 'Balance synchronization from User model',
                            status: 'completed'
                        });
                    }
                }
            } else if (wallet.balance > 0 && user.walletBalance !== wallet.balance) {
                console.log(`Syncing User ${user.email} to match Wallet: ${wallet.balance}`);
                user.walletBalance = wallet.balance;
                await user.save();
            }
        }

        console.log('Synchronization complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error during synchronization:', error);
        process.exit(1);
    }
};

syncBalances();
