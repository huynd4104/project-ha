import * as admin from 'firebase-admin';
import { initializeFirebaseAdmin } from './firebase-init';

async function run() {
  const db = initializeFirebaseAdmin();
  
  console.log('--- Math Questions URLs ---');
  const mathSnap = await db.collection('mathQuestions').limit(3).get();
  mathSnap.docs.forEach(doc => {
    console.log(`${doc.data().questionText}: ${doc.data().imageUrl}`);
  });

  console.log('--- Flashcard URLs ---');
  const fcSnap = await db.collection('flashcards').limit(3).get();
  fcSnap.docs.forEach(doc => {
    console.log(`${doc.data().frontText}: ${doc.data().imageUrl}`);
  });
}

run().catch(console.error);
