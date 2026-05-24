import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

export const npcApi = {
  async all() {
    const snap = await getDocs(query(collection(db, "npcs"), where("isActive", "==", true)));
    return { data: { data: snap.docs.map((item) => ({ id: item.id, ...item.data() })) } };
  },
  async collection() {
    const user = requireUser();
    const unlockedSnap = await getDocs(query(collection(db, "userUnlockedNpcs"), where("userId", "==", user.uid)));
    const items = await Promise.all(unlockedSnap.docs.map(async (item) => {
      const unlocked = { id: item.id, ...item.data() } as any;
      const npcSnap = await getDoc(doc(db, "npcs", unlocked.npcId));
      return { ...unlocked, npc: npcSnap.exists() ? { id: npcSnap.id, ...npcSnap.data() } : null };
    }));
    return { data: { data: items.filter((item) => item.npc) } };
  }
};

function requireUser() {
  const user = auth.currentUser;
  if (!user) throw new Error("Bạn cần đăng nhập.");
  return user;
}
