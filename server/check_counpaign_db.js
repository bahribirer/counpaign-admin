const mongoose = require('mongoose');
require('dotenv').config();

// Force counpaign DB just in case .env is wrong in this context
const uri = 'mongodb://localhost:27017/counpaign';

mongoose.connect(uri)
    .then(async () => {
        console.log('Connected to:', uri);
        const Admin = require('./models/Admin');

        const count = await Admin.countDocuments();
        console.log('Total Admins in counpaign:', count);

        const stock = await Admin.findOne({ username: 'stock' });
        console.log('User stock:', stock ? 'FOUND' : 'NOT FOUND');

        const bahri = await Admin.findOne({ username: 'bahri@counpaign.com' });
        console.log('User bahri:', bahri ? 'FOUND' : 'NOT FOUND');

        process.exit();
    })
    .catch(err => {
        console.error('Connection Failed:', err);
        process.exit(1);
    });
