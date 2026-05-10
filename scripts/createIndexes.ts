import { getMongoDb } from "../src/lib/mongodb";

async function run() {
  try {
    const db = await getMongoDb();
    const events = db.collection('events');

    // 5 years in seconds
    const fiveYearsSeconds = 5 * 365 * 24 * 60 * 60; // 157680000

    console.log('Creating TTL index on events.archivedAt (expireAfterSeconds=', fiveYearsSeconds, ')');
    await events.createIndex({ archivedAt: 1 }, { expireAfterSeconds: fiveYearsSeconds });

    console.log('Index created/ensured successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to create indexes:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}
