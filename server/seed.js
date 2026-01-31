const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/admin-panel')
    .then(() => {
        console.log('MongoDB Connected for Seeding');
        seedUsers();
    })
    .catch(err => console.error(err));

async function seedUsers() {
    try {
        await Admin.deleteMany({}); // Clear existing users

        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash('123456', salt);

        const users = [
            {
                username: 'admin',
                password: password,
                role: 'super_admin',
                businessName: 'Super Admin',
                theme: 'default'
            },
            {
                username: 'stock',
                password: password,
                role: 'business',
                businessName: 'Stock',
                theme: 'stock'
            },
            {
                username: 'starbucks',
                password: password,
                role: 'business',
                businessName: 'Starbucks',
                theme: 'starbucks'
            }
        ];

        await Admin.insertMany(users);
        console.log('Users Seeded Successfully');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
