const mongoose = require('mongoose');

async function inspect() {
    try {
        // Check admin-panel
        const connAdmin = await mongoose.createConnection('mongodb://localhost:27017/admin-panel').asPromise();
        console.log('--- Database: admin-panel ---');
        const collectionsAdmin = await connAdmin.db.listCollections().toArray();
        for (let col of collectionsAdmin) {
            const count = await connAdmin.db.collection(col.name).countDocuments();
            console.log(`${col.name}: ${count}`);
        }
        await connAdmin.close();

        // Check counpaign
        const connCounpaign = await mongoose.createConnection('mongodb://localhost:27017/counpaign').asPromise();
        console.log('\n--- Database: counpaign ---');
        const collectionsCounpaign = await connCounpaign.db.listCollections().toArray();
        for (let col of collectionsCounpaign) {
            const count = await connCounpaign.db.collection(col.name).countDocuments();
            console.log(`${col.name}: ${count}`);
        }
        await connCounpaign.close();

    } catch (err) {
        console.error(err);
    }
}

inspect();
