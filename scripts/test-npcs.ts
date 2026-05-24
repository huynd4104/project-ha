import * as admin from 'firebase-admin';
import { initializeFirebaseAdmin } from './firebase-init';

async function run() {
  const db = initializeFirebaseAdmin();
  const npcs = await db.collection('npcs').get();
  npcs.docs.forEach(doc => {
    console.log(`ID: ${doc.id} | Name: ${doc.data().name} | ImageUrl: ${doc.data().imageUrl} | IsActive: ${doc.data().isActive}`);
  });
}

run().catch(console.error);
