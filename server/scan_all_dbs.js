const mongoose = require('mongoose');

async function scan() {
    try {
        const conn = await mongoose.createConnection('mongodb://localhost:27017/admin').asPromise();
        const adminDb = conn.db.admin();
        const dbs = await adminDb.listDatabases();

        console.log('--- Found Databases ---');
        console.log(dbs.databases.map(d => d.name));
        await conn.close();

        for (const dbInfo of dbs.databases) {
            const dbName = dbInfo.name;
            if (['admin', 'local', 'config'].includes(dbName)) continue;

            console.log(`\nInspecting: ${dbName}`);
            const dbConn = await mongoose.createConnection(`mongodb://localhost:27017/${dbName}`).asPromise();
            const collections = await dbConn.db.listCollections().toArray();

            for (const col of collections) {
                const count = await dbConn.db.collection(col.name).countDocuments();
                if (count > 0) {
                    console.log(`  - ${col.name}: ${count}`);
                }
            }
            await dbConn.close();
        }

    } catch (err) {
        console.error(err);
    }
}

scan();
