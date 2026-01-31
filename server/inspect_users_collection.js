const mongoose = require('mongoose');

async function inspectUsers() {
    try {
        await mongoose.connect('mongodb://localhost:27017/counpaign');
        const count = await mongoose.connection.db.collection('users').countDocuments();
        console.log(`Users count: ${count}`);

        const users = await mongoose.connection.db.collection('users').find({}).toArray();
        console.log(JSON.stringify(users, null, 2));

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspectUsers();
