const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/admin-panel')
    .then(async () => {
        const user = await Admin.findOne({ username: 'admin' });
        console.log('Current Admin User:', user);
        process.exit();
    })
    .catch(err => console.error(err));
