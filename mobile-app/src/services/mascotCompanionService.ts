import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

const COMPANION_KEY = "project_ha_mascot_companion_v1";
const COMPANION_MIGRATION_KEY = "project_ha_mascot_companion_migrated_v1";
const COMPANION_COLLECTION = "userMascotCompanions";

export type MascotCompanionProfile = {
  bondXp: number;
  favorite: boolean;
  lastGiftDate?: string;
};

const STICKER_CATALOG = ["✨", "💖", "🌈", "🍀", "🎉", "🦄"];
const STICKER_MILESTONES = [0, 18, 40, 70, 105, 145];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function clampBondXp(xp: number) {
  return Math.max(0, Math.min(200, Math.floor(xp)));
}

function requireUser() {
  const user = auth.currentUser;
  if (!user) throw new Error("Bạn cần đăng nhập.");
  return user;
}

function companionDocId(userId: string, npcId: string) {
  return `${userId}_${npcId}`;
}

type CompanionDoc = MascotCompanionProfile & {
  userId: string;
  npcId: string;
  createdAt?: any;
  updatedAt?: any;
};

async function loadProfiles() {
  try {
    const raw = await AsyncStorage.getItem(COMPANION_KEY);
    if (!raw) return {} as Record<string, MascotCompanionProfile>;
    const parsed = JSON.parse(raw) as Record<string, MascotCompanionProfile>;
    return parsed || {};
  } catch {
    return {} as Record<string, MascotCompanionProfile>;
  }
}

async function saveProfiles(map: Record<string, MascotCompanionProfile>) {
  await AsyncStorage.setItem(COMPANION_KEY, JSON.stringify(map));
}

async function hasMigratedLocalData() {
  return (await AsyncStorage.getItem(COMPANION_MIGRATION_KEY)) === "1";
}

async function markMigratedLocalData() {
  await AsyncStorage.setItem(COMPANION_MIGRATION_KEY, "1");
}

function toProfileMapFromDocs(docs: CompanionDoc[]) {
  return docs.reduce((acc, item) => {
    acc[item.npcId] = {
      bondXp: clampBondXp(item.bondXp ?? 0),
      favorite: !!item.favorite,
      lastGiftDate: item.lastGiftDate,
    };
    return acc;
  }, {} as Record<string, MascotCompanionProfile>);
}

async function getAllProfilesFromFirestore(userId: string) {
  const snap = await getDocs(query(collection(db, COMPANION_COLLECTION), where("userId", "==", userId)));
  const docs = snap.docs.map((item) => item.data() as CompanionDoc);
  return toProfileMapFromDocs(docs);
}

async function ensureCloudProfiles(userId: string) {
  const existing = await getAllProfilesFromFirestore(userId);
  if (Object.keys(existing).length > 0) return existing;

  if (await hasMigratedLocalData()) return existing;

  const local = await loadProfiles();
  const localKeys = Object.keys(local);
  if (!localKeys.length) {
    await markMigratedLocalData();
    return existing;
  }

  const batch = writeBatch(db);
  localKeys.forEach((npcId) => {
    const profile = local[npcId] || { bondXp: 0, favorite: false };
    const ref = doc(db, COMPANION_COLLECTION, companionDocId(userId, npcId));
    batch.set(ref, {
      userId,
      npcId,
      bondXp: clampBondXp(profile.bondXp),
      favorite: !!profile.favorite,
      lastGiftDate: profile.lastGiftDate || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
  await markMigratedLocalData();
  return getAllProfilesFromFirestore(userId);
}

async function ensureProfileDoc(userId: string, npcId: string) {
  const ref = doc(db, COMPANION_COLLECTION, companionDocId(userId, npcId));
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await runTransaction(db, async (tx) => {
      const latest = await tx.get(ref);
      if (!latest.exists()) {
        tx.set(ref, {
          userId,
          npcId,
          bondXp: 0,
          favorite: false,
          lastGiftDate: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    });
  }
  return ref;
}

function ensureProfile(map: Record<string, MascotCompanionProfile>, npcId: string) {
  if (!map[npcId]) {
    map[npcId] = { bondXp: 0, favorite: false };
  }
  return map[npcId];
}

function bondLevelFromXp(bondXp: number) {
  if (bondXp >= 145) return { name: "Bạn thân", nextAt: null as number | null };
  if (bondXp >= 105) return { name: "Siêu thân", nextAt: 145 };
  if (bondXp >= 70) return { name: "Thân thiết", nextAt: 105 };
  if (bondXp >= 40) return { name: "Quen mặt", nextAt: 70 };
  if (bondXp >= 18) return { name: "Làm quen", nextAt: 40 };
  return { name: "Mới gặp", nextAt: 18 };
}

function stickersFromXp(bondXp: number) {
  return STICKER_CATALOG.filter((_, index) => bondXp >= STICKER_MILESTONES[index]);
}

export const mascotCompanionService = {
  getStickerCatalog: () => STICKER_CATALOG,
  getUnlockedStickers: (bondXp: number) => stickersFromXp(bondXp),
  getBondLevel: (bondXp: number) => bondLevelFromXp(bondXp),

  async getProfiles() {
    const user = requireUser();
    return ensureCloudProfiles(user.uid);
  },

  async getProfile(npcId: string) {
    const user = requireUser();
    await ensureCloudProfiles(user.uid);
    const ref = await ensureProfileDoc(user.uid, npcId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return { bondXp: 0, favorite: false };
    const data = snap.data() as CompanionDoc;
    return {
      bondXp: clampBondXp(data.bondXp ?? 0),
      favorite: !!data.favorite,
      lastGiftDate: data.lastGiftDate || undefined,
    };
  },

  async getFavoriteNpcId() {
    const user = requireUser();
    const snap = await getDocs(query(collection(db, COMPANION_COLLECTION), where("userId", "==", user.uid)));
    const favorite = snap.docs
      .map((item) => item.data() as CompanionDoc)
      .find((item) => item.favorite);
    return favorite?.npcId || null;
  },

  async toggleFavorite(npcId: string) {
    const user = requireUser();
    await ensureCloudProfiles(user.uid);
    const targetRef = await ensureProfileDoc(user.uid, npcId);

    const [targetSnap, allSnap] = await Promise.all([
      getDoc(targetRef),
      getDocs(query(collection(db, COMPANION_COLLECTION), where("userId", "==", user.uid))),
    ]);

    const currentFavorite = !!targetSnap.data()?.favorite;
    const nextFavorite = !currentFavorite;

    const batch = writeBatch(db);
    allSnap.docs.forEach((item) => {
      if (item.id !== targetRef.id) {
        batch.set(item.ref, { favorite: false, updatedAt: serverTimestamp() }, { merge: true });
      }
    });
    batch.set(
      targetRef,
      {
        userId: user.uid,
        npcId,
        favorite: nextFavorite,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    await batch.commit();

    const base = targetSnap.exists()
      ? (targetSnap.data() as CompanionDoc)
      : ({ bondXp: 0, lastGiftDate: undefined } as CompanionDoc);
    return {
      bondXp: clampBondXp(base.bondXp ?? 0),
      favorite: nextFavorite,
      lastGiftDate: base.lastGiftDate || undefined,
    };
  },

  async petMascot(npcId: string) {
    const user = requireUser();
    await ensureCloudProfiles(user.uid);
    const ref = await ensureProfileDoc(user.uid, npcId);

    return runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const current = snap.exists() ? (snap.data() as CompanionDoc) : ({ bondXp: 0, favorite: false } as CompanionDoc);
      const next: MascotCompanionProfile = {
        bondXp: clampBondXp((current.bondXp ?? 0) + 4),
        favorite: !!current.favorite,
        lastGiftDate: current.lastGiftDate || undefined,
      };
      tx.set(
        ref,
        {
          userId: user.uid,
          npcId,
          bondXp: next.bondXp,
          favorite: next.favorite,
          lastGiftDate: next.lastGiftDate || null,
          updatedAt: serverTimestamp(),
          createdAt: snap.exists() ? current.createdAt || serverTimestamp() : serverTimestamp(),
        },
        { merge: true }
      );
      return next;
    });
  },

  async claimDailyGift(npcId: string) {
    const user = requireUser();
    await ensureCloudProfiles(user.uid);
    const ref = await ensureProfileDoc(user.uid, npcId);
    const today = todayKey();

    return runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      const current = snap.exists() ? (snap.data() as CompanionDoc) : ({ bondXp: 0, favorite: false } as CompanionDoc);
      const profile: MascotCompanionProfile = {
        bondXp: clampBondXp(current.bondXp ?? 0),
        favorite: !!current.favorite,
        lastGiftDate: current.lastGiftDate || undefined,
      };

      if (profile.lastGiftDate === today) {
        return { claimed: false, profile };
      }

      const nextProfile: MascotCompanionProfile = {
        ...profile,
        bondXp: clampBondXp(profile.bondXp + 18),
        lastGiftDate: today,
      };

      tx.set(
        ref,
        {
          userId: user.uid,
          npcId,
          bondXp: nextProfile.bondXp,
          favorite: nextProfile.favorite,
          lastGiftDate: today,
          updatedAt: serverTimestamp(),
          createdAt: snap.exists() ? current.createdAt || serverTimestamp() : serverTimestamp(),
        },
        { merge: true }
      );

      return { claimed: true, profile: nextProfile };
    });
  },
};
