import * as admin from 'firebase-admin';
import { initializeFirebaseAdmin } from './firebase-init';

async function run() {
  const db = initializeFirebaseAdmin();
  
  const collections = ['npcs', 'badges', 'lessons', 'mathQuestions', 'dialogues', 'flashcards', 'mediaAssets'];
  for (const col of collections) {
    const snap = await db.collection(col).get();
    for (const doc of snap.docs) {
      const data = doc.data();
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string' && value.startsWith('data:image/')) {
          console.log(`Found base64 image in collection "${col}", doc ID "${doc.id}", field "${key}": ${value.substring(0, 50)}...`);
        }
      }
    }
  }
}

run().catch(console.error);
