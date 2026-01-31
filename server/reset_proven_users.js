const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function resetPasswords() {
    try {
        await mongoose.connect('mongodb://localhost:27017/counpaign');
        const Admin = require('./models/Admin');
        const Customer = require('./models/Customer');

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('123456', salt);

        // Reset Admin: Bahri
        const bahri = await Admin.findOne({
            $or: [{ username: /bahri/i }, { email: /bahri/i }]
        });

        if (bahri) {
            bahri.password = hash;
            await bahri.save();
            console.log(`✅ Admin Password Reset for: ${bahri.username}`);
        } else {
            console.log('❌ Admin "Bahri" not found to reset.');
        }

        // Reset Customer: Ahmet
        const ahmet = await Customer.findOne({
            $or: [{ fullName: /Ahmet/i }, { email: /Ahmet/i }]
        });

        if (ahmet) {
            ahmet.password = hash;
            await ahmet.save();
            console.log(`✅ Customer Password Reset for: ${ahmet.fullName}`);
        } else {
            console.log('❌ Customer "Ahmet" not found to reset.');
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

resetPasswords();
