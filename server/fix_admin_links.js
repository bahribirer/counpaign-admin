const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const Business = require('./models/Business');
require('dotenv').config();

const fixLinks = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const admins = await Admin.find({ role: 'business', businessId: null });
        console.log(`Found ${admins.length} admins with missing businessId`);

        for (const admin of admins) {
            console.log(`Processing admin: ${admin.username} (Business: ${admin.businessName})`);

            // Try to find business matching the businessName
            // We use a regex for loose matching or exact match
            const business = await Business.findOne({
                companyName: { $regex: new RegExp(`^${admin.businessName}$`, 'i') }
            });

            if (business) {
                console.log(`  Found business: ${business.companyName} (_id: ${business._id})`);
                admin.businessId = business._id;
                await admin.save();
                console.log('  Updated admin with businessId');
            } else {
                console.log('  WARNING: No matching business found for name:', admin.businessName);
            }
        }

        console.log('Done');
        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixLinks();
