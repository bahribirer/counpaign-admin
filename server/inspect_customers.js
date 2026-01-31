const mongoose = require('mongoose');

async function inspectCustomers() {
    try {
        await mongoose.connect('mongodb://localhost:27017/counpaign');
        const count = await mongoose.connection.db.collection('customers').countDocuments();
        console.log(`Customers count: ${count}`);

        const customers = await mongoose.connection.db.collection('customers').find({}).toArray();
        console.log(JSON.stringify(customers, null, 2));

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspectCustomers();
