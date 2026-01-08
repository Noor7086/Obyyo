import Purchase from '../models/Purchase.js';
import User from '../models/User.js';
import Prediction from '../models/Prediction.js';
import Wallet from '../models/Wallet.js';

// @desc    Get all payment transactions for admin
// @route   GET /api/admin/payments
// @access  Private/Admin
export const getAdminPayments = async (req, res, next) => {
  try {
    console.log('🔍 Full req.query:', JSON.stringify(req.query, null, 2));
    const { page = 1, limit = 20, status, method, lottery, search } = req.query;

    console.log('🔍 Payment query params:', { page, limit, status, method, lottery, search });
    console.log('🔍 Lottery value check:', {
      lottery,
      type: typeof lottery,
      isTruthy: !!lottery,
      notAll: lottery !== 'all',
      condition: lottery && lottery !== 'all',
      rawLottery: req.query.lottery
    });

    // Build query filters
    let query = {};

    if (status && status !== 'all') {
      query.paymentStatus = status;
    }

    if (method && method !== 'all') {
      query.paymentMethod = method;
    }

    // Note: Lottery filtering is handled in aggregation pipeline below for proper pagination

    // Search by transaction ID or stripe payment intent ID
    let searchQuery = {};
    if (search) {
      searchQuery = {
        $or: [
          { transactionId: { $regex: search, $options: 'i' } },
          { stripePaymentIntentId: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const finalQuery = { ...query, ...searchQuery };

    // If filtering by lottery, use aggregation pipeline for proper filtering
    // Check both req.query.lottery and the destructured lottery variable
    const lotteryFilter = lottery || req.query.lottery;
    let lotteryValue = null;

    if (lotteryFilter) {
      if (lotteryFilter !== 'all') {
        if (lotteryFilter !== undefined) {
          if (lotteryFilter !== null) {
            const trimmed = String(lotteryFilter).trim();
            if (trimmed !== '') {
              // Convert 'wallet' filter to 'wallet_deposit' to match the lotteryType field
              const originalValue = trimmed.toLowerCase();
              lotteryValue = originalValue === 'wallet' ? 'wallet_deposit' : originalValue;
              if (originalValue === 'wallet') {
                console.log(`🔄 CONVERTING: "wallet" → "wallet_deposit"`);
              }
              console.log(`🎯 Filtering by lottery: "${lotteryValue}" (original: "${lotteryFilter}")`);
            }
          }
        }
      }
    }


    // Special handling: if filtering by wallet_deposit, skip the Purchase aggregation
    // and go directly to fetching wallet transactions
    if (lotteryValue === 'wallet_deposit') {
      console.log('💳 Wallet deposit filter detected - skipping Purchase aggregation, fetching wallet transactions only');
      // We'll handle this in the standard query path below, not the aggregation path
    } else if (lotteryValue && lotteryValue !== 'wallet_deposit') {
      const skip = (parseInt(page) - 1) * (parseInt(limit) || 20);
      const limitNum = parseInt(limit) || 20;

      const pipeline = [
        { $match: finalQuery },
        {
          $lookup: {
            from: 'predictions',
            localField: 'prediction',
            foreignField: '_id',
            as: 'predictionData'
          }
        },
        {
          $unwind: {
            path: '$predictionData',
            preserveNullAndEmptyArrays: false // Exclude purchases with no prediction
          }
        },
        {
          $match: {
            'predictionData.lotteryType': lotteryValue
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'userData'
          }
        },
        {
          $unwind: {
            path: '$userData',
            preserveNullAndEmptyArrays: true
          }
        },
        { $sort: { createdAt: -1 } },
        {
          $facet: {
            data: [
              { $skip: skip },
              { $limit: limitNum }
            ],
            total: [{ $count: 'count' }]
          }
        }
      ];

      const result = await Purchase.aggregate(pipeline);
      const purchasesData = result[0]?.data || [];
      const totalCount = result[0]?.total[0]?.count || 0;

      console.log(`📊 Aggregation result: ${purchasesData.length} purchases, total: ${totalCount} for lottery "${lotteryValue}"`);
      if (purchasesData.length > 0 && purchasesData[0].predictionData) {
        console.log(`🎲 First purchase lottery type: "${purchasesData[0].predictionData.lotteryType}"`);
      }

      // Format the purchases
      const formattedPurchases = purchasesData.map(purchase => {
        const user = purchase.userData || null;
        const prediction = purchase.predictionData || null;

        return {
          id: purchase._id?.toString() || '',
          userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User' : 'Unknown User',
          userEmail: user?.email || 'N/A',
          userPhone: user?.phone || 'N/A',
          amount: purchase.amount || 0,
          lotteryType: prediction?.lotteryType || 'N/A',
          lotteryDisplayName: (() => {
            if (!prediction?.lotteryType) return 'N/A';
            const lotteryNames = {
              'gopher5': 'Gopher 5 (Minnesota)',
              'pick3': 'Pick 3 (Minnesota)',
              'lottoamerica': 'Lotto America (USA)',
              'megamillion': 'Mega Millions (USA)',
              'powerball': 'Powerball (USA)'
            };
            return lotteryNames[prediction.lotteryType] || prediction.lotteryType;
          })(),
          drawDate: prediction?.drawDate || null,
          drawTime: prediction?.drawTime || null,
          paymentMethod: purchase.paymentMethod || 'N/A',
          paymentStatus: purchase.paymentStatus || 'pending',
          transactionId: purchase.transactionId || 'N/A',
          stripePaymentIntentId: purchase.stripePaymentIntentId || null,
          downloadCount: purchase.downloadCount || 0,
          lastDownloaded: purchase.lastDownloaded || null,
          isRefunded: purchase.isRefunded || false,
          refundReason: purchase.refundReason || null,
          ipAddress: purchase.ipAddress || null,
          createdAt: purchase.createdAt || new Date(),
          updatedAt: purchase.updatedAt || purchase.createdAt || new Date()
        };
      });

      // Calculate statistics with lottery filter
      const statsPipeline = [
        { $match: finalQuery },
        {
          $lookup: {
            from: 'predictions',
            localField: 'prediction',
            foreignField: '_id',
            as: 'predictionData'
          }
        },
        {
          $unwind: {
            path: '$predictionData',
            preserveNullAndEmptyArrays: false
          }
        },
        {
          $match: {
            'predictionData.lotteryType': lotteryValue
          }
        }
      ];

      const [totalStats, completedStats, pendingStats, failedStats, refundedStats, revenueStats] = await Promise.all([
        Purchase.aggregate([...statsPipeline, { $count: 'count' }]),
        Purchase.aggregate([...statsPipeline, { $match: { paymentStatus: 'completed' } }, { $count: 'count' }]),
        Purchase.aggregate([...statsPipeline, { $match: { paymentStatus: 'pending' } }, { $count: 'count' }]),
        Purchase.aggregate([...statsPipeline, { $match: { paymentStatus: 'failed' } }, { $count: 'count' }]),
        Purchase.aggregate([...statsPipeline, { $match: { paymentStatus: 'refunded' } }, { $count: 'count' }]),
        Purchase.aggregate([
          ...statsPipeline,
          { $match: { paymentStatus: 'completed', isRefunded: false } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
      ]);

      const stats = {
        total: totalStats[0]?.count || 0,
        completed: completedStats[0]?.count || 0,
        pending: pendingStats[0]?.count || 0,
        failed: failedStats[0]?.count || 0,
        refunded: refundedStats[0]?.count || 0,
        totalRevenue: revenueStats[0]?.total || 0
      };

      console.log(`📊 Found ${formattedPurchases.length} purchases out of ${totalCount} total (Filters: status=${status || 'all'}, method=${method || 'all'}, lottery=${lotteryValue})`);

      return res.json({
        success: true,
        data: {
          purchases: formattedPurchases,
          statistics: stats,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(totalCount / limitNum),
            total: totalCount,
            limit: limitNum
          }
        }
      });
    }

    // Standard query when no lottery filter
    const purchases = await Purchase.find(finalQuery)
      .populate({
        path: 'user',
        select: 'firstName lastName email phone',
        options: { strictPopulate: false }
      })
      .populate({
        path: 'prediction',
        select: 'lotteryType lotteryDisplayName drawDate drawTime price',
        options: { strictPopulate: false }
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) || 20)
      .skip((parseInt(page) - 1) * (parseInt(limit) || 20))
      .lean();

    // If search includes email, filter in memory (populate doesn't support regex on nested fields)
    let filteredPurchases = purchases;
    if (search && search.includes('@')) {
      filteredPurchases = purchases.filter(p =>
        p.user && typeof p.user === 'object' && p.user.email &&
        p.user.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = await Purchase.countDocuments(finalQuery);

    console.log(`📊 Found ${filteredPurchases.length} purchases out of ${total} total (Filters: status=${status || 'all'}, method=${method || 'all'}, lottery=${lottery || 'all'})`);

    // --- WALLET TRANSACTIONS FETCHING ---
    // Only fetch wallet transactions if we are not filtering by a specific lottery type (unless filter is 'wallet')
    // or if we are filtering specifically for 'wallet'
    let walletTransactions = [];
    const includeWallet = !lotteryValue || lotteryValue === 'wallet_deposit';

    if (includeWallet) {
      const walletPipeline = [
        { $unwind: '$transactions' },
        {
          $match: {
            'transactions.type': 'credit',
            // Apply status filter if present
            ...(status && status !== 'all' ? { 'transactions.status': status } : {})
          }
        },
        { $sort: { 'transactions.createdAt': -1 } },
        // If searching, we'll need to filter after lookup or do a more complex match
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'userData'
          }
        },
        { $unwind: '$userData' },
        {
          $project: {
            _id: 0,
            walletId: '$_id',
            transaction: '$transactions',
            user: {
              _id: '$userData._id',
              firstName: '$userData.firstName',
              lastName: '$userData.lastName',
              email: '$userData.email',
              phone: '$userData.phone'
            }
          }
        }
      ];

      // Add search filter if exists
      if (search) {
        // This is a basic implementation, complex regex in aggregation can be slow
        // We filter in memory for simplicity as we did with purchases
      }

      const walletResults = await Wallet.aggregate(walletPipeline);

      walletTransactions = walletResults.map(w => ({
        id: w.transaction._id.toString(),
        userName: `${w.user.firstName} ${w.user.lastName}`.trim(),
        userEmail: w.user.email,
        userPhone: w.user.phone,
        amount: w.transaction.amount,
        lotteryType: 'wallet_deposit',
        lotteryDisplayName: 'Wallet Deposit',
        drawDate: null,
        drawTime: null,
        paymentMethod: 'paypal', // Usually paypal for now
        paymentStatus: w.transaction.status,
        transactionId: w.transaction.reference || 'N/A',
        stripePaymentIntentId: null,
        downloadCount: 0,
        lastDownloaded: null,
        isRefunded: false,
        refundReason: null,
        ipAddress: null,
        createdAt: w.transaction.createdAt,
        updatedAt: w.transaction.createdAt,
        isWalletTransaction: true
      }));

      // Filter wallet transactions by search if needed
      if (search) {
        const searchLower = search.toLowerCase();
        walletTransactions = walletTransactions.filter(t =>
          t.userName.toLowerCase().includes(searchLower) ||
          t.userEmail.toLowerCase().includes(searchLower) ||
          (t.transactionId && t.transactionId.toLowerCase().includes(searchLower))
        );
      }
    }

    // Format the purchases (Purchase model)
    const formattedPurchases = filteredPurchases.map(purchase => {
      const user = purchase.user && typeof purchase.user === 'object' ? purchase.user : null;
      const prediction = purchase.prediction && typeof purchase.prediction === 'object' ? purchase.prediction : null;

      return {
        id: purchase._id?.toString() || '',
        userName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User' : 'Unknown User',
        userEmail: user?.email || 'N/A',
        userPhone: user?.phone || 'N/A',
        amount: purchase.amount || 0,
        lotteryType: prediction?.lotteryType || 'N/A',
        lotteryDisplayName: prediction?.lotteryDisplayName || 'N/A',
        drawDate: prediction?.drawDate || null,
        drawTime: prediction?.drawTime || null,
        paymentMethod: purchase.paymentMethod || 'N/A',
        paymentStatus: purchase.paymentStatus || 'pending',
        transactionId: purchase.transactionId || 'N/A',
        stripePaymentIntentId: purchase.stripePaymentIntentId || null,
        downloadCount: purchase.downloadCount || 0,
        lastDownloaded: purchase.lastDownloaded || null,
        isRefunded: purchase.isRefunded || false,
        refundReason: purchase.refundReason || null,
        ipAddress: purchase.ipAddress || null,
        createdAt: purchase.createdAt || new Date(),
        updatedAt: purchase.updatedAt || purchase.createdAt || new Date(),
        isWalletTransaction: false
      };
    });

    // MERGE AND SORT
    let combinedPayments = [];

    // If filtering specifically for wallet, only include wallet transactions
    if (lotteryValue === 'wallet_deposit') {
      combinedPayments = [...walletTransactions];
      console.log(`💳 Wallet filter active: showing ${walletTransactions.length} wallet deposits only`);
    } else {
      // Otherwise, include purchases and optionally wallet transactions
      combinedPayments = [...formattedPurchases];
      if (includeWallet) {
        combinedPayments = [...combinedPayments, ...walletTransactions];
      }
    }

    // Sort by date descending
    combinedPayments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Handle Search for the combined list if it wasn't strictly handled before
    // (We did partial filtering above, but robust search across combined list is best done here if list is small)
    // Assuming default pagination limits, let's paginate the *combined* list manually

    const combinedTotal = combinedPayments.length;
    const pagedPayments = combinedPayments.slice((parseInt(page) - 1) * (parseInt(limit) || 20), parseInt(page) * (parseInt(limit) || 20));

    // Calculate statistics
    // Calculate statistics
    const purchaseStats = {
      completed: await Purchase.countDocuments({ ...finalQuery, paymentStatus: 'completed' }),
      pending: await Purchase.countDocuments({ ...finalQuery, paymentStatus: 'pending' }),
      failed: await Purchase.countDocuments({ ...finalQuery, paymentStatus: 'failed' }),
      refunded: await Purchase.countDocuments({ ...finalQuery, paymentStatus: 'refunded' }),
      revenue: await Purchase.aggregate([
        { $match: { ...finalQuery, paymentStatus: 'completed', isRefunded: false } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).then(result => result[0]?.total || 0)
    };

    // Calculate wallet stats
    const walletStatsResult = await Wallet.aggregate([
      { $unwind: '$transactions' },
      { $match: { 'transactions.type': 'credit' } },
      {
        $group: {
          _id: '$transactions.status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$transactions.amount' }
        }
      }
    ]);

    const walletRevenue = walletStatsResult.find(s => s._id === 'completed')?.totalAmount || 0;

    const stats = {
      total: combinedTotal,
      completed: purchaseStats.completed + (walletStatsResult.find(s => s._id === 'completed')?.count || 0),
      pending: purchaseStats.pending + (walletStatsResult.find(s => s._id === 'pending')?.count || 0),
      failed: purchaseStats.failed + (walletStatsResult.find(s => s._id === 'failed')?.count || 0),
      refunded: purchaseStats.refunded + (walletStatsResult.find(s => s._id === 'refunded')?.count || 0),
      totalRevenue: purchaseStats.revenue + walletRevenue
    };

    res.json({
      success: true,
      data: {
        purchases: pagedPayments,
        statistics: stats,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(combinedTotal / (parseInt(limit) || 20)),
          total: combinedTotal,
          limit: parseInt(limit) || 20
        }
      }
    });
  } catch (error) {
    console.error('❌ Get admin payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get payment statistics summary
// @route   GET /api/admin/payments/stats
// @access  Private/Admin
export const getPaymentStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateQuery = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
      if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
    }

    const [
      totalTransactions,
      completedTransactions,
      totalRevenue,
      recentTransactions
    ] = await Promise.all([
      Purchase.countDocuments(dateQuery),
      Purchase.countDocuments({ ...dateQuery, paymentStatus: 'completed' }),
      Purchase.aggregate([
        { $match: { ...dateQuery, paymentStatus: 'completed', isRefunded: false } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).then(result => result[0]?.total || 0),
      Purchase.find(dateQuery)
        .populate('user', 'firstName lastName email')
        .populate('prediction', 'lotteryType lotteryDisplayName')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
    ]);

    res.json({
      success: true,
      data: {
        totalTransactions,
        completedTransactions,
        totalRevenue,
        recentTransactions: recentTransactions.map(t => ({
          id: t._id,
          user: t.user ? `${t.user.firstName} ${t.user.lastName}` : 'Unknown',
          amount: t.amount,
          lottery: t.prediction?.lotteryDisplayName || 'N/A',
          status: t.paymentStatus,
          date: t.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payment statistics'
    });
  }
};

