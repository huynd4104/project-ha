import { initializeFirebaseAdmin } from './firebase-init';
import { seedDomainData } from './seed-domain-helpers';

async function run() {
  console.log('\n\x1b[36mInitializing Firestore connection...\x1b[0m');
  const db = initializeFirebaseAdmin();
  await seedDomainData(db);
  console.log('\n\x1b[32mDomain seed completed successfully.\x1b[0m\n');
  process.exit(0);
}

run().catch((err) => {
  console.error('\n\x1b[31mAn error occurred during domain seeding:\x1b[0m', err);
  process.exit(1);
});
