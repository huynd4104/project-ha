import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from .env
dotenv.config();

/**
 * Initializes the Firebase Admin SDK and returns the Firestore database instance.
 */
export function initializeFirebaseAdmin(): admin.firestore.Firestore {
  if (admin.apps.length > 0) {
    return admin.firestore();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (!projectId) {
    console.error('\x1b[31mError: FIREBASE_PROJECT_ID environment variable is missing in .env\x1b[0m');
    process.exit(1);
  }

  if (!serviceAccountPath) {
    console.error('\x1b[31mError: FIREBASE_SERVICE_ACCOUNT_PATH environment variable is missing in .env\x1b[0m');
    process.exit(1);
  }

  const resolvedPath = path.isAbsolute(serviceAccountPath)
    ? serviceAccountPath
    : path.resolve(process.cwd(), serviceAccountPath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`\x1b[31mError: Service account JSON file not found at: ${resolvedPath}\x1b[0m`);
    process.exit(1);
  }

  try {
    const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: projectId
    });

    console.log(`\x1b[32mSuccessfully connected to Firebase Project: ${projectId}\x1b[0m`);
    return admin.firestore();
  } catch (error) {
    console.error('\x1b[31mFailed to initialize Firebase Admin SDK:\x1b[0m', error);
    process.exit(1);
  }
}
