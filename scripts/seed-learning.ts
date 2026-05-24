import { initializeFirebaseAdmin } from './firebase-init';
import { seedDemoUsers } from './seed-demo-users';
import { seedLearningContent } from './seed-learning-content';

async function run() {
  console.log('\n\x1b[36mInitializing Firestore connection...\x1b[0m');
  const db = initializeFirebaseAdmin();
  
  console.log('\x1b[36mResolving/Seeding demo users...\x1b[0m');
  const { adminUid, parentUid } = await seedDemoUsers();
  
  console.log('\x1b[36mSeeding learning content...\x1b[0m');
  await seedLearningContent(db, { adminUid, parentUid });
  
  console.log('\n\x1b[32mSeeding learning content completed successfully.\x1b[0m\n');
  process.exit(0);
}

run().catch((err) => {
  console.error('\n\x1b[31mAn error occurred during seeding:\x1b[0m', err);
  process.exit(1);
});
