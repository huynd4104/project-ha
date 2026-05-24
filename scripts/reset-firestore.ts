import * as admin from 'firebase-admin';
import * as readline from 'readline';
import { initializeFirebaseAdmin } from './firebase-init';
import { seedDemoUsers } from './seed-demo-users';

// Collections to completely clear
const COLLECTIONS_TO_DELETE = [
  'children',
  'npcs',
  'qrCodes',
  'userUnlockedNpcs',
  'lessons',
  'mathQuestions',
  'dialogues',
  'flashcards',
  'spellingActivities',
  'rhymeChallenges',
  'progress',
  'xpLogs',
  'streaks',
  'mediaAssets',
  'badges',
  'userBadges',
  'dailyMissions',
  'userMissionProgress'
];

/**
 * Deletes all documents in a collection in batches.
 * Returns the total number of deleted documents.
 */
async function deleteCollection(db: admin.firestore.Firestore, collectionPath: string, batchSize = 100): Promise<number> {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.limit(batchSize);

  let totalDeleted = 0;
  while (true) {
    const snapshot = await query.get();
    if (snapshot.size === 0) {
      break;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    totalDeleted += snapshot.size;
  }

  return totalDeleted;
}

/**
 * Clears users collection except demo admin and parent.
 * Returns number of users deleted.
 */
async function cleanUsersCollection(db: admin.firestore.Firestore, adminUid: string, parentUid: string): Promise<number> {
  const usersCollection = db.collection('users');
  const snapshot = await usersCollection.get();
  
  let deletedCount = 0;
  let batch = db.batch();
  let opCount = 0;

  for (const doc of snapshot.docs) {
    const uid = doc.id;
    if (uid !== adminUid && uid !== parentUid) {
      batch.delete(doc.ref);
      deletedCount++;
      opCount++;

      // Firebase Firestore batch writes are capped at 500 operations
      if (opCount === 400) {
        await batch.commit();
        batch = db.batch();
        opCount = 0;
      }
    }
  }

  if (opCount > 0) {
    await batch.commit();
  }

  return deletedCount;
}

/**
 * Clears Firebase Authentication users except demo admin and parent.
 * Returns number of users deleted.
 */
async function cleanAuthUsers(adminUid: string, parentUid: string): Promise<number> {
  let deletedCount = 0;
  let nextPageToken: string | undefined;

  do {
    const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
    const uidsToDelete = listUsersResult.users
      .filter(user => user.uid !== adminUid && user.uid !== parentUid && user.email !== 'admin@demo.com' && user.email !== 'parent@demo.com')
      .map(user => user.uid);

    if (uidsToDelete.length > 0) {
      const deleteResult = await admin.auth().deleteUsers(uidsToDelete);
      deletedCount += deleteResult.successCount;
      if (deleteResult.failureCount > 0) {
        console.error(`Failed to delete ${deleteResult.failureCount} users from Auth. Errors:`, deleteResult.errors);
      }
    }
    nextPageToken = listUsersResult.pageToken;
  } while (nextPageToken);

  return deletedCount;
}

/**
 * Prompts the user for text input in the CLI.
 */
async function askConfirmation(promptText: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(promptText, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Executes the database reset and seeding workflow.
 */
async function runReset() {
  console.log('\n\x1b[41m\x1b[37m WARNING: CRITICAL DATABASE RESET OPERATION \x1b[0m');
  console.log('\x1b[31mThis script will permanently destroy all Firestore data in the following collections:\x1b[0m');
  COLLECTIONS_TO_DELETE.forEach(col => console.log(`  - ${col}`));
  console.log('\x1b[31mAdditionally, all profiles in the "users" collection will be deleted EXCEPT:\x1b[0m');
  console.log(`  - Admin UID: ${process.env.ADMIN_UID || 'Not Configured'}`);
  console.log(`  - Parent UID: ${process.env.PARENT_UID || 'Not Configured'}\n`);
  console.log('\x1b[31mAdditionally, all registered users in Firebase Authentication (except Admin and Parent) will be permanently deleted.\x1b[0m\n');

  const answer = await askConfirmation('To confirm this action, please type exactly "\x1b[1m\x1b[31mRESET\x1b[0m": ');

  if (answer !== 'RESET') {
    console.log('\n\x1b[33mOperation aborted. No data was modified.\x1b[0m\n');
    process.exit(0);
  }

  console.log('\n\x1b[36mInitializing Firestore connection...\x1b[0m');
  const db = initializeFirebaseAdmin();

  console.log('\x1b[36mResolving demo users and seeding Firestore...\x1b[0m');
  // Seed demo users first to resolve or create their Auth users and get their UIDs
  const { adminUid, parentUid } = await seedDemoUsers();

  console.log('\x1b[36mStarting Firestore Reset...\x1b[0m');

  const deletedCollectionsReport: { [col: string]: number } = {};

  // Delete standard collections
  for (const collectionName of COLLECTIONS_TO_DELETE) {
    console.log(`Clearing collection "${collectionName}"...`);
    const count = await deleteCollection(db, collectionName);
    deletedCollectionsReport[collectionName] = count;
  }

  // Clean users collection
  console.log('Cleaning users collection...');
  const deletedUsersCount = await cleanUsersCollection(db, adminUid, parentUid);

  // Clean Firebase Authentication users
  console.log('Cleaning Firebase Authentication users...');
  const deletedAuthUsersCount = await cleanAuthUsers(adminUid, parentUid);

  console.log('\n\x1b[32m=========================================\x1b[0m');
  console.log('\x1b[32m        RESET COMPLETED SUCCESSFULLY      \x1b[0m');
  console.log('\x1b[32m=========================================\x1b[0m\n');

  console.log('\x1b[1mDeleted Collections Summary:\x1b[0m');
  Object.entries(deletedCollectionsReport).forEach(([col, count]) => {
    console.log(`  - \x1b[33m${col}\x1b[0m: deleted ${count} document(s)`);
  });
  console.log(`  - \x1b[33musers (others)\x1b[0m: deleted ${deletedUsersCount} document(s) from Firestore`);
  console.log(`  - \x1b[33mAuth users (others)\x1b[0m: deleted ${deletedAuthUsersCount} user(s) from Firebase Authentication`);

  console.log('\n\x1b[1mDemo Accounts Retained / Seeded:\x1b[0m');
  console.log(`  - \x1b[32m[ADMIN]\x1b[0m  admin@demo.com  (UID: ${adminUid})`);
  console.log(`  - \x1b[32m[PARENT]\x1b[0m parent@demo.com (UID: ${parentUid})\n`);
  process.exit(0);
}

runReset().catch((err) => {
  console.error('\n\x1b[31mAn error occurred during reset:\x1b[0m', err);
  process.exit(1);
});
