import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "../firebase/firebase";

const pathToCollection: Record<string, string> = {
  "/users": "users",
  "/children": "children",
  "/npcs": "npcs",
  "/qr-codes": "qrCodes",
  "/development-categories": "developmentCategories",
  "/learning-goals": "learningGoals",
  "/skills": "skills",
  "/programs": "programs",
  "/learning-paths": "learningPaths",
  "/path-items": "pathItems",
  "/activities": "activities",
  "/activation-codes": "activationCodes",
  "/lessons": "lessons",
  "/math-questions": "mathQuestions",
  "/dialogues": "dialogues",
  "/flashcards": "flashcards",
  "/spelling-activities": "spellingActivities",
  "/rhyme-challenges": "rhymeChallenges",
  "/admin/progress": "progress",
  "/progress": "progress",
  "/badges": "badges",
  "/daily-missions": "dailyMissions"
};

export const adminApi = {
  async dashboard() {
    const today = new Date().toISOString().slice(0, 10);
    const [
      users,
      children,
      npcs,
      qrCodes,
      lessons,
      completedProgress,
      badges,
      dailyMissions,
      earnedBadges,
      missionProgressToday
    ] = await Promise.all([
      listCollection("users"),
      listCollection("children"),
      listCollection("npcs"),
      listCollection("qrCodes"),
      listCollection("lessons"),
      getDocs(query(collection(db, "progress"), where("status", "==", "COMPLETED"))),
      listCollection("badges"),
      getDocs(query(collection(db, "dailyMissions"), where("isActive", "==", true))),
      getDocs(collection(db, "userBadges")),
      getDocs(query(collection(db, "userMissionProgress"), where("date", "==", today), where("isCompleted", "==", true)))
    ]);

    const lessonCounts = new Map<string, number>();
    completedProgress.docs.forEach((item) => {
      const lessonId = item.data().lessonId;
      if (lessonId) lessonCounts.set(lessonId, (lessonCounts.get(lessonId) ?? 0) + 1);
    });
    const popularLessons = lessons
      .map((lesson) => ({ ...lesson, completedCount: lessonCounts.get(lesson.id) ?? 0 }))
      .sort((a, b) => b.completedCount - a.completedCount)
      .slice(0, 5);

    return {
      data: {
        data: {
          totalUsers: users.length,
          totalChildren: children.length,
          totalNPCs: npcs.length,
          totalQRCodes: qrCodes.length,
          totalLessons: lessons.length,
          totalCompletedLessons: completedProgress.size,
          recentUsers: users.slice(0, 5),
          popularLessons,
          totalBadges: badges.length,
          totalActiveMissions: dailyMissions.size,
          badgesEarnedCount: earnedBadges.size,
          missionCompletionsToday: missionProgressToday.size
        }
      }
    };
  },
  async list(path: string) {
    return { data: { data: await listCollection(resolveCollection(path)) } };
  },
  async create(path: string, data: any) {
    const collectionName = resolveCollection(path);
    const now = serverTimestamp();
    const payload = {
      ...data,
      ...(collectionName === "qrCodes" ? { usedCount: Number(data.usedCount ?? 0) } : {}),
      createdAt: now,
      updatedAt: now
    };
    const ref = await addDoc(collection(db, collectionName), payload);
    return { data: { data: { id: ref.id, ...payload } } };
  },
  async update(path: string, id: string, data: any) {
    const collectionName = resolveCollection(path);
    const payload = { ...data, updatedAt: serverTimestamp() };
    await updateDoc(doc(db, collectionName, id), payload);
    return { data: { data: { id, ...payload } } };
  },
  async remove(path: string, id: string) {
    await deleteDoc(doc(db, resolveCollection(path), id));
    return { data: { data: true } };
  }
};

function resolveCollection(path: string) {
  return pathToCollection[path] ?? path.replace(/^\//, "");
}

async function listCollection(collectionName: string) {
  const snap = await getDocs(collection(db, collectionName));
  const rows = snap.docs.map((item) => ({ id: item.id, ...item.data() } as any));
  if (collectionName === "lessons") return rows.sort((a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  return rows.sort((a: any, b: any) => toMillis(b.createdAt) - toMillis(a.createdAt));
}

function toMillis(value: any) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value === "number") return value;
  return Date.parse(value) || 0;
}
