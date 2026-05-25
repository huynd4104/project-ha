import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "../firebase/firebase";

const BATCH_LIMIT = 400;

export async function batchImport(collectionName: string, rows: any[]) {
  for (let i = 0; i < rows.length; i += BATCH_LIMIT) {
    const chunk = rows.slice(i, i + BATCH_LIMIT);
    const batch = writeBatch(db);
    chunk.forEach((row) => {
      const ref = doc(collection(db, collectionName));
      batch.set(ref, {
        ...row,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
    await batch.commit();
  }
}
