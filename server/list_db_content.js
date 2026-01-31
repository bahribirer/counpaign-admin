const mongoose = require('mongoose');

async function listNames() {
    try {
        await mongoose.connect('mongodb://localhost:27017/counpaign');
        const Business = require('./models/Business');
        const Admin = require('./models/Admin');

        const businesses = await Business.find({}, 'companyName email');
        console.log('--- Businesses in counpaign ---');
        businesses.forEach(b => console.log(`- ${b.companyName} (${b.email})`));

        const admins = await Admin.find({}, 'username role businessId');
        console.log('\n--- Admins in counpaign ---');
        admins.forEach(u => console.log(`- ${u.username} [${u.role}] (BizID: ${u.businessId})`));

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listNames();
