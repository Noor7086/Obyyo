import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

// Import models
import Wallet from './backend/models/Wallet.js';
import User from './backend/models/User.js';

const migrateWalletBalances = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected');

        // Find all users with wallet balance > 0
        const usersWithBalance = await User.find({ walletBalance: { $gt: 0 } });
        console.log(`\n📊 Found ${usersWithBalance.length} users with wallet balance > 0`);

        if (usersWithBalance.length === 0) {
            console.log('No users with balance to migrate.');
            process.exit(0);
        }

        for (const user of usersWithBalance) {
            console.log(`\n👤 Processing user: ${user.email} (Balance: $${user.walletBalance})`);

            // Check if wallet exists
            let wallet = await Wallet.findOne({ user: user._id });

            if (!wallet) {
                console.log('   Creating new wallet...');
                wallet = await Wallet.createForUser(user._id);
            }

            // Check if wallet already has transactions
            if (wallet.transactions.length > 0) {
                console.log(`   ⚠️  Wallet already has ${wallet.transactions.length} transactions. Skipping.`);
                continue;
            }

            // Create a migration transaction for the existing balance
            console.log(`   💰 Creating migration transaction for $${user.walletBalance}`);

            await wallet.addTransaction({
                type: 'credit',
                amount: user.walletBalance,
                description: 'Balance migration from User model',
                reference: `MIGRATION-${Date.now()}`,
                status: 'completed',
                metadata: {
                    source: 'migration',
                    migratedAt: new Date()
                }
            });

            // Sync wallet balance with user balance
            wallet.balance = user.walletBalance;
            await wallet.save();

            console.log(`   ✅ Migration complete! Wallet now has balance: $${wallet.balance}`);
        }

        console.log('\n🎉 Migration completed successfully!');
        console.log('\nVerifying results...');

        const walletsWithTransactions = await Wallet.find({ 'transactions.0': { $exists: true } });
        console.log(`✅ Total wallets with transactions: ${walletsWithTransactions.length}`);

        const totalWalletRevenue = await Wallet.aggregate([
            { $unwind: '$transactions' },
            { $match: { 'transactions.type': 'credit', 'transactions.status': 'completed' } },
            { $group: { _id: null, total: { $sum: '$transactions.amount' } } }
        ]);

        console.log(`💵 Total wallet revenue: $${totalWalletRevenue[0]?.total || 0}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

migrateWalletBalances();
