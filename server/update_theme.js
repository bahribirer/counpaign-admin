const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/admin-panel')
    .then(async () => {
        console.log('MongoDB Connected');

        // Update admin user
        const res = await Admin.updateOne({ username: 'admin' }, { $set: { theme: 'counpaign' } });
        console.log('Admin Theme Updated:', res);

        process.exit();
    })
    .catch(err => console.error(err));
