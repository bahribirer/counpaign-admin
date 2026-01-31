const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const Business = require('./models/Business');
require('dotenv').config();

const fixStarbucks = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const admin = await Admin.findOne({ username: 'starbucks' });
        if (!admin) {
            console.log('Starbucks admin not found.');
            process.exit();
        }

        if (admin.businessId) {
            console.log('Starbucks admin already has a businessId:', admin.businessId);
            process.exit();
        }

        console.log('Creating missing business for Starbucks...');

        const newBusiness = new Business({
            companyName: 'Starbucks',
            email: 'starbucks@example.com', // Dummy email to satisfy unique constraint
            password: 'dummy_hash_will_not_be_used',
            category: 'Cafe',
            city: 'Ankara',
            district: 'Çankaya',
            neighborhood: 'Bahçelievler',
            settings: {
                pointsPerVisit: 10,
                redemptionThreshold: 100
            }
        });

        const savedBusiness = await newBusiness.save();
        console.log('Created Business:', savedBusiness.companyName, savedBusiness._id);

        admin.businessId = savedBusiness._id;
        admin.businessName = 'Starbucks'; // Ensure name matches
        await admin.save();
        console.log('Updated Admin check complete.');

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixStarbucks();
