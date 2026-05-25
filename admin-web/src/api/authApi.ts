import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

export const authApi = {
  async login(email: string, password: string) {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const userSnap = await getDoc(doc(db, "users", credential.user.uid));
    const user = userSnap.exists() ? ({ id: userSnap.id, ...userSnap.data() } as any) : null;

    if (!user || user.role !== "ADMIN") {
      await signOut(auth);
      throw new Error("Tài khoản này không có quyền quản trị.");
    }
    if (user.isActive === false) {
      await signOut(auth);
      throw new Error("Tài khoản quản trị đã bị khóa.");
    }

    return { data: { data: { token: await credential.user.getIdToken(), user } } };
  },
  async me() {
    if (!auth.currentUser) return { data: { data: null } };
    const userSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
    return { data: { data: userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : null } };
  },
  logout: () => signOut(auth)
};
