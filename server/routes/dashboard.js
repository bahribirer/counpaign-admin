const router = require('express').Router();
const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Business = require('../models/Business');
const Transaction = require('../models/Transaction');
const Campaign = require('../models/Campaign');
const Participation = require('../models/Participation');

router.get('/stats', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const last7Days = new Date(today);
        last7Days.setDate(last7Days.getDate() - 6);

        // 1. Users Stats
        const totalUsers = await Customer.countDocuments();
        const newUsersToday = await Customer.countDocuments({ createdAt: { $gte: today } });

        // 2. Firms Stats
        const totalFirms = await Business.countDocuments();
        const newFirmsThisMonth = await Business.countDocuments({ createdAt: { $gte: firstDayOfMonth } });

        // 3. Transactions Stats
        const totalTransactions = await Transaction.countDocuments();
        const transactionsToday = await Transaction.countDocuments({ createdAt: { $gte: today } });

        // 4. Active Campaigns
        const activeCampaigns = await Campaign.countDocuments({ endDate: { $gte: new Date() } });

        // 5. Participation Stats
        const totalParticipations = await Participation.countDocuments();
        const wonParticipations = await Participation.countDocuments({ status: 'WON' });

        // 6. Rewards Stats (Points & Stamps)
        // We aggregate KAZANIM (Earned) vs HARCAMA (Spent)
        // Assuming value is always positive in DB, and category determines sign
        const rewardsStats = await Transaction.aggregate([
            {
                $group: {
                    _id: { type: '$type', category: '$category' },
                    total: { $sum: '$value' }
                }
            }
        ]);

        let earnedPoints = 0;
        let spentPoints = 0;
        let earnedStamps = 0; // Includes 'Kahve' if logical
        let spentStamps = 0; // Redeemed gifts/coffees

        rewardsStats.forEach(stat => {
            const { type, category } = stat._id;
            const val = stat.total;

            if (type === 'POINT') {
                if (category === 'KAZANIM') earnedPoints += val;
                if (category === 'HARCAMA') spentPoints += val;
            } else if (type === 'STAMP') {
                if (category === 'KAZANIM') earnedStamps += val;
                if (category === 'HARCAMA') spentStamps += val; // Usually REDEEM counts as spending stamps
            } else if (type === 'GIFT_REDEEM') {
                // If GIFT_REDEEM exists, it might count as 'Spent Stamps' equivalent or separate
                // For now, let's treat GIFT_REDEEM as 'Redeemed Gifts' count or value?
                // Usually 1 gift = X stamps. But let's just track it if needed.
                // For simpler UI, we might just show "Points" and "Stamps".
                // Let's assume GIFT_REDEEM is 'Spent' side of stamps effectively.
                spentStamps += val; // Assume value 1 = 1 gift
            }
        });

        // 7. Daily Transactions Chart (Last 7 Days)
        // Use timezone +03:00 for Turkey
        const dailyTransactions = await Transaction.aggregate([
            { $match: { createdAt: { $gte: last7Days } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "+03:00" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Fill in missing days
        const chartData = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(last7Days);
            d.setDate(d.getDate() + i);

            // Format YYYY-MM-DD manually using local time (assuming server time is correct or adjusting)
            // A safer way is ensuring we match the output format of Mongo
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            const found = dailyTransactions.find(x => x._id === dateStr);

            // Format Day Name (e.g., 'Pzt', 'Sal')
            const dayName = d.toLocaleDateString('tr-TR', { weekday: 'short' });

            chartData.push({
                date: dateStr,
                day: dayName,
                count: found ? found.count : 0
            });
        }

        res.json({
            users: { total: totalUsers, today: newUsersToday },
            firms: { total: totalFirms, month: newFirmsThisMonth },
            transactions: { total: totalTransactions, today: transactionsToday, chart: chartData },
            campaigns: { active: activeCampaigns },
            participations: { total: totalParticipations, won: wonParticipations },
            rewards: {
                points: { earned: earnedPoints, spent: spentPoints },
                stamps: { earned: earnedStamps, spent: spentStamps } // 'spent' can be interpreted as gifts redeemed
            }
        });

    } catch (err) {
        console.error('Dashboard Stats Error:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/firm-stats', async (req, res) => {
    try {
        const { businessId } = req.query;
        if (!businessId) {
            return res.status(400).json({ error: 'Business ID is required' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Monday
        startOfWeek.setHours(0, 0, 0, 0);

        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // For Charts (last 30 days covers monthly view, last 7 days covers weekly)
        const last30Days = new Date(today);
        last30Days.setDate(last30Days.getDate() - 29);

        // 1. Customer Count (Wallet Adds)
        const totalCustomers = await CustomerBusiness.countDocuments({ business: businessId });

        // 2. Participation Count
        const totalParticipations = await Participation.countDocuments({ business: businessId });

        // 3. Transactions Stats
        const dailyTransactions = await Transaction.countDocuments({ business: businessId, createdAt: { $gte: today } });
        const monthlyTransactions = await Transaction.countDocuments({ business: businessId, createdAt: { $gte: firstDayOfMonth } });

        // 4. Weekly Rewards Given (Kazandırılan)
        const weeklyRewards = await Transaction.aggregate([
            {
                $match: {
                    business: new mongoose.Types.ObjectId(businessId),
                    createdAt: { $gte: startOfWeek }
                }
            },
            {
                $group: {
                    _id: { type: '$type', category: '$category' },
                    total: { $sum: '$value' },
                    count: { $sum: 1 } // For counting gifts if value is not used
                }
            }
        ]);

        let weeklyPoints = 0;
        let weeklyStamps = 0;
        let weeklyCoffee = 0;

        weeklyRewards.forEach(r => {
            // Points Earned by Customer
            if (r._id.type === 'POINT' && r._id.category === 'KAZANIM') {
                weeklyPoints += r.total;
            }
            // Stamps Earned by Customer
            if (r._id.type === 'STAMP' && r._id.category === 'KAZANIM') {
                weeklyStamps += r.total;
            }
            // Gifts Redeemed/Given (Type is GIFT_REDEEM)
            // Assuming GIFT_REDEEM value is 1 per gift, or we can use count
            if (r._id.type === 'GIFT_REDEEM') {
                weeklyCoffee += r.total;
            }
        });

        // 5. Chart 1: Wallet Adds (Daily for last 30 days)
        const walletAdsChartRaw = await CustomerBusiness.aggregate([
            { $match: { business: new mongoose.Types.ObjectId(businessId), joinedAt: { $gte: last30Days } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$joinedAt", timezone: "+03:00" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 6. Chart 2: Transaction Count (Daily for last 30 days)
        const transactionChartRaw = await Transaction.aggregate([
            { $match: { business: new mongoose.Types.ObjectId(businessId), createdAt: { $gte: last30Days } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "+03:00" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Helper to fill chart data
        const fillChartData = (rawData) => {
            const data = [];
            for (let i = 0; i < 30; i++) {
                const d = new Date(last30Days);
                d.setDate(d.getDate() + i);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;

                const found = rawData.find(x => x._id === dateStr);
                data.push({
                    date: dateStr,
                    day: d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
                    count: found ? found.count : 0
                });
            }
            return data;
        };

        res.json({
            customers: { total: totalCustomers },
            participations: { total: totalParticipations },
            transactions: { daily: dailyTransactions, monthly: monthlyTransactions },
            rewards: { weeklyPoints, weeklyStamps, weeklyCoffee },
            charts: {
                walletAdds: fillChartData(walletAdsChartRaw),
                transactions: fillChartData(transactionChartRaw)
            }
        });

    } catch (err) {
        console.error('Firm Stats Error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
