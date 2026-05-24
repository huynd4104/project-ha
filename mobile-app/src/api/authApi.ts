import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

export const authApi = {
  async login(email: string, password: string) {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const user = await readUser(credential.user.uid);
    if (user?.role !== "PARENT" || user?.isActive === false) {
      await signOut(auth);
      throw new Error("Tài khoản phụ huynh không hợp lệ.");
    }
    return { data: { data: { token: await credential.user.getIdToken(), user } } };
  },
  async register(fullName: string, email: string, password: string) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const now = serverTimestamp();
    const user = {
      uid: credential.user.uid,
      email,
      fullName,
      role: "PARENT",
      isActive: true,
      createdAt: now,
      updatedAt: now
    };
    await setDoc(doc(db, "users", credential.user.uid), user);
    return { data: { data: { token: await credential.user.getIdToken(), user: { id: credential.user.uid, ...user } } } };
  },
  async me() {
    if (!auth.currentUser) return { data: { data: null } };
    return { data: { data: await readUser(auth.currentUser.uid) } };
  },
  logout: () => signOut(auth)
};

async function readUser(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as any) : null;
}
