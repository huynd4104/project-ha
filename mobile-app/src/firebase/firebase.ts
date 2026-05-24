import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { Auth, getAuth, initializeAuth, Persistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

export const firebaseApp = initializeApp(firebaseConfig);
let firebaseAuth: Auth;

try {
  firebaseAuth = initializeAuth(firebaseApp, {
    persistence: getAsyncStoragePersistence()
  });
} catch {
  firebaseAuth = getAuth(firebaseApp);
}

export const auth = firebaseAuth;
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);

function getAsyncStoragePersistence(): Persistence {
  const persistence = class {
    static type = "LOCAL";
    readonly type = "LOCAL";

    async _isAvailable() {
      try {
        const testKey = "firebase:authStorageAvailable";
        await AsyncStorage.setItem(testKey, "1");
        await AsyncStorage.removeItem(testKey);
        return true;
      } catch {
        return false;
      }
    }

    _set(key: string, value: unknown) {
      return AsyncStorage.setItem(key, JSON.stringify(value));
    }

    async _get(key: string) {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    }

    _remove(key: string) {
      return AsyncStorage.removeItem(key);
    }

    _addListener() {}

    _removeListener() {}
  };

  return persistence as unknown as Persistence;
}
