const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function restoreAdmins() {
    try {
        await mongoose.connect('mongodb://localhost:27017/counpaign');
        const Business = require('./models/Business');
        const Admin = require('./models/Admin');

        const businesses = await Business.find({});
        console.log(`Found ${businesses.length} businesses.`);

        for (const biz of businesses) {
            // Check if admin exists for this business
            const existingAdmin = await Admin.findOne({ businessId: biz._id });
            if (!existingAdmin) {
                console.log(`Restoring admin for: ${biz.companyName}`);

                // Determine username (use email or lowercase name)
                const username = biz.email || biz.companyName.toLowerCase().replace(/\s+/g, '');

                // Default password '123456'
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash('123456', salt);

                const newAdmin = new Admin({
                    username: username,
                    password: hashedPassword,
                    role: 'business',
                    businessId: biz._id,
                    businessName: biz.companyName,
                    theme: 'dark', // Default
                });

                await newAdmin.save();
                console.log(`  -> Created Admin: ${username} / 123456`);
            } else {
                console.log(`  Admin already exists for ${biz.companyName}: ${existingAdmin.username}`);
            }
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

restoreAdmins();
