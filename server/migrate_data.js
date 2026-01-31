const mongoose = require('mongoose');

async function migrate() {
    console.log('Starting Migration: admin-panel -> counpaign');

    const sourceUri = 'mongodb://localhost:27017/admin-panel';
    const targetUri = 'mongodb://localhost:27017/counpaign';

    const sourceConn = await mongoose.createConnection(sourceUri).asPromise();
    const targetConn = await mongoose.createConnection(targetUri).asPromise();

    const collections = ['admins', 'businesses', 'customers', 'campaigns', 'participations', 'transactions', 'reviews', 'terminals', 'customerbusinesses'];

    for (const colName of collections) {
        try {
            const sourceCol = sourceConn.db.collection(colName);
            const targetCol = targetConn.db.collection(colName);

            const sourceDocs = await sourceCol.find({}).toArray();
            console.log(`Migrating ${colName}: found ${sourceDocs.length} documents.`);

            if (sourceDocs.length > 0) {
                // Determine unique key based on collection
                let uniqueField = '_id';
                if (colName === 'admins') uniqueField = 'username';
                if (colName === 'businesses') uniqueField = 'email';
                if (colName === 'customers') uniqueField = 'phoneNumber';

                let inserted = 0;
                let skipped = 0;

                for (const doc of sourceDocs) {
                    const exists = await targetCol.findOne({ [uniqueField]: doc[uniqueField] });
                    if (!exists) {
                        try {
                            await targetCol.insertOne(doc);
                            inserted++;
                        } catch (e) {
                            console.error(`Error inserting into ${colName}:`, e.message);
                        }
                    } else {
                        // Optional: Update if exists? For now, we want to recover OLD data, maybe we should overwrite?
                        // User said "eski tabloları geri getir" (bring back old tables).
                        // If target (counpaign) has empty data, this insert works.
                        // If target has NEW data, we keep it.
                        // But wait, if I created 'Starbucks' in counpaign, and 'Stock' is in admin-panel. They will merge nicely.
                        skipped++;
                    }
                }
                console.log(`  -> Inserted: ${inserted}, Skipped: ${skipped}`);
            }
        } catch (err) {
            console.error(`Error processing ${colName}:`, err.message);
        }
    }

    console.log('Migration Complete.');
    await sourceConn.close();
    await targetConn.close();
    process.exit();
}

migrate();
