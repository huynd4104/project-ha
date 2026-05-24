import { addDoc, collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

export const childApi = {
  async list() {
    const user = requireUser();
    const snap = await getDocs(query(collection(db, "children"), where("userId", "==", user.uid)));
    return { data: { data: snap.docs.map((item) => ({ id: item.id, ...item.data() } as any)) } };
  },
  async create(data: any) {
    const user = requireUser();
    const now = serverTimestamp();
    const payload = { ...data, userId: user.uid, age: Number(data.age), createdAt: now, updatedAt: now };
    const ref = await addDoc(collection(db, "children"), payload);
    return { data: { data: { id: ref.id, ...payload } as any } };
  },
  async update(id: string, data: any) {
    const payload = { ...data, age: Number(data.age), updatedAt: serverTimestamp() };
    await updateDoc(doc(db, "children", id), payload);
    return { data: { data: { id, ...payload } as any } };
  }
};

function requireUser() {
  const user = auth.currentUser;
  if (!user) throw new Error("Bạn cần đăng nhập.");
  return user;
}
