const router = require('express').Router();
const Customer = require('../models/Customer');
const CustomerBusiness = require('../models/CustomerBusiness');
const Transaction = require('../models/Transaction');
const Review = require('../models/Review');
const Participation = require('../models/Participation');

// GET /api/users - List all customers
router.get('/', async (req, res) => {
    try {
        const users = await Customer.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/:id - Get specific user details
router.get('/:id', async (req, res) => {
    try {
        const user = await Customer.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/users/:id/cafes - Get cafes in user's wallet
router.get('/:id/cafes', async (req, res) => {
    try {
        const { id } = req.params;
        const cafes = await CustomerBusiness.find({ customer: id })
            .populate('business', 'companyName category logo cardColor cardIcon city district neighborhood')
            .sort({ joinedAt: -1 });
        res.json(cafes);
    } catch (err) {
        console.error('Error fetching user cafes:', err);
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/users/:userId/wallet/:recordId - Update wallet record
router.patch('/:userId/wallet/:recordId', async (req, res) => {
    try {
        const { recordId } = req.params;
        const { points, stamps, giftsCount } = req.body;

        const currentRecord = await CustomerBusiness.findById(recordId);
        if (!currentRecord) {
            return res.status(404).json({ message: 'Wallet record not found' });
        }

        const updateData = {};
        if (points !== undefined) updateData.points = Number(points);

        let finalStamps = stamps !== undefined ? Number(stamps) : currentRecord.stamps;
        let finalGifts = giftsCount !== undefined ? Number(giftsCount) : currentRecord.giftsCount;

        // Loyalty logic: 6 stamps = 1 gift
        if (stamps !== undefined) {
            while (finalStamps >= 6) {
                finalStamps -= 6;
                finalGifts += 1;
            }
        }

        updateData.stamps = finalStamps;
        updateData.giftsCount = finalGifts;

        const updatedRecord = await CustomerBusiness.findByIdAndUpdate(
            recordId,
            { $set: updateData },
            { new: true }
        ).populate('business', 'companyName');

        res.json({
            message: 'Wallet updated successfully',
            record: updatedRecord
        });
    } catch (err) {
        console.error('Error updating wallet:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/users/:userId/wallet/:recordId - Delete specific wallet record
router.delete('/:userId/wallet/:recordId', async (req, res) => {
    try {
        const { recordId } = req.params;
        await CustomerBusiness.findByIdAndDelete(recordId);
        res.json({ message: 'Business removed from user wallet' });
    } catch (err) {
        console.error('Error deleting wallet record:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/users/:id - Delete a user and associated data
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const deletedUser = await Customer.findByIdAndDelete(id);
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Cascading delete
        await Promise.all([
            CustomerBusiness.deleteMany({ customer: id }),
            Transaction.deleteMany({ customer: id }),
            Review.deleteMany({ customer: id }),
            Participation.deleteMany({ customer: id })
        ]);

        res.json({
            message: 'User and all associated data deleted successfully',
            deletedUser: {
                id: deletedUser._id,
                email: deletedUser.email
            }
        });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
