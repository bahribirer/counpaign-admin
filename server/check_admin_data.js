const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

const checkAdmins = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const admins = await Admin.find({});
        console.log('--- ADMIN RECORDS ---');
        admins.forEach(admin => {
            console.log(`User: ${admin.username}, Role: ${admin.role}, BusinessId: ${admin.businessId} (Type: ${typeof admin.businessId})`);
        });
        console.log('---------------------');

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkAdmins();
