const mongoose = require('mongoose');

async function findUsers() {
    try {
        const conn = await mongoose.createConnection('mongodb://localhost:27017/admin').asPromise();
        const dbs = await conn.db.admin().listDatabases();
        await conn.close();

        console.log('--- Searching for Users ---');

        for (const dbInfo of dbs.databases) {
            const dbName = dbInfo.name;
            if (['admin', 'local', 'config'].includes(dbName)) continue;

            const dbConn = await mongoose.createConnection(`mongodb://localhost:27017/${dbName}`).asPromise();

            // Search Admins
            const adminCol = dbConn.db.collection('admins');
            const bahri = await adminCol.findOne({
                $or: [{ username: /bahri/i }, { email: /bahri/i }]
            });

            // Search Customers
            const custCol = dbConn.db.collection('customers');
            const ahmet = await custCol.findOne({
                $or: [{ fullName: /Ahmet/i }, { email: /Ahmet/i }]
            });

            if (bahri || ahmet) {
                console.log(`\n✅ MATCH FOUND IN DATABASE: [${dbName}]`);
                if (bahri) console.log(`   - Admin Found: ${bahri.username} (${bahri.email})`);
                if (ahmet) console.log(`   - Customer Found: ${ahmet.fullName} (${ahmet.phoneNumber || ahmet.email})`);
            } else {
                console.log(`\n❌ No match in: ${dbName}`);
            }

            await dbConn.close();
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findUsers();
