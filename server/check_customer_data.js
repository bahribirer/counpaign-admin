const mongoose = require('mongoose');

async function checkCustomer() {
    try {
        await mongoose.connect('mongodb://localhost:27017/counpaign');
        const Customer = require('./models/Customer');

        const ahmet = await Customer.findOne({
            $or: [{ fullName: /Ahmet/i }, { email: /Ahmet/i }]
        });

        if (ahmet) {
            console.log('--- Customer Found ---');
            console.log(`ID: ${ahmet._id}`);
            console.log(`Name: ${ahmet.fullName}`);
            console.log(`Phone: '${ahmet.phoneNumber}' (Type: ${typeof ahmet.phoneNumber})`);
            console.log(`Email: ${ahmet.email}`);
        } else {
            console.log('Customer Ahmet NOT found.');
        }
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkCustomer();
