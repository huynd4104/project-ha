import * as admin from 'firebase-admin';
import { initializeFirebaseAdmin } from './firebase-init';

/**
 * Resolves or creates Auth users and returns their UIDs.
 */
async function resolveOrCreateAuthUsers(): Promise<{ adminUid: string; parentUid: string }> {
  let adminUid = process.env.ADMIN_UID;
  let parentUid = process.env.PARENT_UID;

  // Resolve Admin
  if (!adminUid || adminUid === 'your-admin-user-uid') {
    try {
      const userRecord = await admin.auth().getUserByEmail('admin@demo.com');
      adminUid = userRecord.uid;
      console.log(`Found existing Auth user admin@demo.com with UID: ${adminUid}`);
      
      // Force email verification flag to true in Firebase Auth
      if (!userRecord.emailVerified) {
        await admin.auth().updateUser(adminUid, { emailVerified: true });
        console.log(`\x1b[32mUpdated emailVerified status to true for admin@demo.com\x1b[0m`);
      }
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log('admin@demo.com not found in Firebase Auth. Creating Auth user...');
        const userRecord = await admin.auth().createUser({
          email: 'admin@demo.com',
          password: '123456',
          displayName: 'Demo Admin',
          emailVerified: true
        });
        adminUid = userRecord.uid;
        console.log(`Created Auth user admin@demo.com with UID: ${adminUid}`);
      } else {
        throw error;
      }
    }
  }

  // Resolve Parent
  if (!parentUid || parentUid === 'your-parent-user-uid') {
    try {
      const userRecord = await admin.auth().getUserByEmail('parent@demo.com');
      parentUid = userRecord.uid;
      console.log(`Found existing Auth user parent@demo.com with UID: ${parentUid}`);
      
      // Force email verification flag to true in Firebase Auth
      if (!userRecord.emailVerified) {
        await admin.auth().updateUser(parentUid, { emailVerified: true });
        console.log(`\x1b[32mUpdated emailVerified status to true for parent@demo.com\x1b[0m`);
      }
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log('parent@demo.com not found in Firebase Auth. Creating Auth user...');
        const userRecord = await admin.auth().createUser({
          email: 'parent@demo.com',
          password: '123456',
          displayName: 'Demo Parent',
          emailVerified: true
        });
        parentUid = userRecord.uid;
        console.log(`Created Auth user parent@demo.com with UID: ${parentUid}`);
      } else {
        throw error;
      }
    }
  }

  return { adminUid, parentUid };
}

/**
 * Seeds or updates the demo users in the 'users' Firestore collection.
 */
async function seedDemoUsers(): Promise<{ adminUid: string; parentUid: string }> {
  const db = initializeFirebaseAdmin();
  const { adminUid, parentUid } = await resolveOrCreateAuthUsers();

  const usersCollection = db.collection('users');

  const adminData = {
    uid: adminUid,
    email: 'admin@demo.com',
    fullName: 'Demo Admin',
    role: 'ADMIN' as const,
    isActive: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  const parentData = {
    uid: parentUid,
    email: 'parent@demo.com',
    fullName: 'Demo Parent',
    role: 'PARENT' as const,
    isActive: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  console.log('\x1b[36mSeeding demo users into Firestore...\x1b[0m');

  // Admin User
  const adminDocRef = usersCollection.doc(adminUid);
  const adminDoc = await adminDocRef.get();
  if (!adminDoc.exists) {
    await adminDocRef.set({
      ...adminData,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`\x1b[32mCreated new ADMIN user: ${adminData.email} (UID: ${adminUid})\x1b[0m`);
  } else {
    await adminDocRef.set(adminData, { merge: true });
    console.log(`\x1b[32mUpdated existing ADMIN user: ${adminData.email} (UID: ${adminUid})\x1b[0m`);
  }

  // Parent User
  const parentDocRef = usersCollection.doc(parentUid);
  const parentDoc = await parentDocRef.get();
  if (!parentDoc.exists) {
    await parentDocRef.set({
      ...parentData,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`\x1b[32mCreated new PARENT user: ${parentData.email} (UID: ${parentUid})\x1b[0m`);
  } else {
    await parentDocRef.set(parentData, { merge: true });
    console.log(`\x1b[32mUpdated existing PARENT user: ${parentData.email} (UID: ${parentUid})\x1b[0m`);
  }

  console.log('\x1b[32mDemo users seeding completed successfully.\x1b[0m');
  return { adminUid, parentUid };
}

// Run if direct execution
if (require.main === module) {
  seedDemoUsers()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('\x1b[31mSeeding failed:\x1b[0m', err);
      process.exit(1);
    });
}

export { seedDemoUsers };
