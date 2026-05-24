import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where
} from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { getFirstChildId } from "./progressApi";
import { getLessonActivityType } from "../utils/lessonTypes";
import {
  awardXp,
  updateStreak,
  updateDailyMissionProgress,
  checkAndAwardBadges,
  calculateLevel,
  getTotalXp
} from "../utils/gamification";

type Answer = { questionId?: string; dialogueId?: string; selectedOption: string };

export const lessonApi = {
  async list() {
    const user = auth.currentUser;
    const [lessonsSnap, npcsSnap, progressSnap] = await Promise.all([
      getDocs(query(collection(db, "lessons"), where("isActive", "==", true))),
      getDocs(collection(db, "npcs")),
      user ? getDocs(query(collection(db, "progress"), where("userId", "==", user.uid))) : Promise.resolve(null)
    ]);
    const npcs = new Map(npcsSnap.docs.map((item) => [item.id, { id: item.id, ...item.data() }]));
    const progress = progressSnap ? progressSnap.docs.map((item) => ({ id: item.id, ...item.data() })) : [];
    const lessons = lessonsSnap.docs
      .map((item) => {
        const lesson = { id: item.id, ...item.data() } as any;
        return { ...lesson, npc: lesson.npcId ? npcs.get(lesson.npcId) : null, progress: progress.filter((p: any) => p.lessonId === lesson.id) };
      })
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    return { data: { data: lessons } };
  },
  async detail(id: string) {
    const snap = await getDoc(doc(db, "lessons", id));
    return { data: { data: snap.exists() ? { id: snap.id, ...snap.data() } : null } };
  },
  async questions(id: string) {
    return { data: { data: await listByLesson("mathQuestions", id) } };
  },
  async thinkingQuestions(id: string) {
    return { data: { data: await listByLesson("mathQuestions", id) } };
  },
  async dialogues(id: string) {
    return { data: { data: await listByLesson("dialogues", id) } };
  },
  async spellingActivities(id: string) {
    return { data: { data: await listByLesson("spellingActivities", id) } };
  },
  async rhymeChallenges(id: string) {
    return { data: { data: await listByLesson("rhymeChallenges", id) } };
  },
  async flashcards(id: string) {
    return { data: { data: await listByLesson("flashcards", id) } };
  },
  async submitMath(id: string, data: any) {
    const questions = await listByLesson("mathQuestions", id);
    return { data: { data: await submitLesson(id, questions, data.answers ?? [], "MATH") } };
  },
  async submitThinking(id: string, data: any) {
    const questions = await listByLesson("mathQuestions", id);
    return { data: { data: await submitLesson(id, questions, data.answers ?? [], "THINKING") } };
  },
  async submitDialogue(id: string, data: any) {
    const dialogues = await listByLesson("dialogues", id);
    return { data: { data: await submitLesson(id, dialogues, data.dialogueAnswers ?? [], "DIALOGUE") } };
  },
  async submitSpelling(id: string, data: any) {
    const activities = await listByLesson("spellingActivities", id);
    return { data: { data: await submitWordLesson(id, activities, data.answers ?? [], "SPELLING") } };
  },
  async submitRhyme(id: string, data: any) {
    const challenges = await listByLesson("rhymeChallenges", id);
    return { data: { data: await submitWordLesson(id, challenges, data.answers ?? [], "RHYME") } };
  },
  async markFlashcard(id: string, _data?: unknown) {
    // MVP: flashcard mastery is acknowledged locally. Persisting per-card state can be added in phase 2.
    return { data: { data: { id, learned: true } } };
  },
  async submitFlashcardComplete(lessonId: string) {
    const user = requireUser();
    const childId = await getFirstChildId(user.uid);
    if (!childId) throw new Error("Bố mẹ cần tạo hồ sơ cho bé trước.");

    const progressSnap = await getDocs(query(
      collection(db, "progress"),
      where("userId", "==", user.uid),
      where("childId", "==", childId),
      where("lessonId", "==", `${lessonId}_flashcard`)
    ));
    const isAlreadyCompleted = progressSnap.docs.length > 0;

    const progress = await upsertProgress(user.uid, childId, `${lessonId}_flashcard`, { score: 100, totalQuestions: 1, correctAnswers: 1, activityType: "FLASHCARD" });

    let xpGained = 0;
    if (!isAlreadyCompleted) {
      xpGained = 5; // Flashcard complete is +5 XP
      await awardXp(user.uid, childId, xpGained, `Hoàn thành ôn tập thẻ học`);
    }

    const streakResult = await updateStreak(user.uid, childId);
    await updateDailyMissionProgress(user.uid, childId, "REVIEW_FLASHCARD", 1);
    const newlyEarnedBadges = await checkAndAwardBadges(user.uid, childId);

    const totalXp = await getTotalXp(user.uid, childId);
    const levelStats = calculateLevel(totalXp);

    return {
      data: {
        data: {
          ...progress,
          xpGained,
          streak: streakResult,
          newBadges: newlyEarnedBadges,
          levelStats
        }
      }
    };
  }
};

async function listByLesson(collectionName: string, lessonId: string) {
  const snap = await getDocs(query(collection(db, collectionName), where("lessonId", "==", lessonId)));
  return snap.docs
    .map((item) => ({ id: item.id, ...item.data() } as any))
    .sort((a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
}

async function submitLesson(lessonId: string, items: any[], answers: Answer[], activityType: string) {
  const user = requireUser();
  const childId = await getFirstChildId(user.uid);
  if (!childId) throw new Error("Bố mẹ cần tạo hồ sơ cho bé trước.");

  const answerMap = new Map(answers.map((item) => [item.questionId ?? item.dialogueId, item.selectedOption]));
  const results = items.map((item) => {
    const selectedOption = answerMap.get(item.id);
    return {
      questionId: item.id,
      selectedOption,
      correctOption: item.correctOption,
      explanation: item.explanation,
      isCorrect: selectedOption === item.correctOption
    };
  });
  const totalQuestions = items.length;
  const correctAnswers = results.filter((item) => item.isCorrect).length;
  const score = totalQuestions ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  // Anti-cheating rule check: query if this lesson was already completed by the child
  const progressSnap = await getDocs(query(
    collection(db, "progress"),
    where("userId", "==", user.uid),
    where("childId", "==", childId),
    where("lessonId", "==", lessonId)
  ));
  const isAlreadyCompleted = progressSnap.docs.length > 0;

  // Retrieve lesson doc to get lesson type
  const lessonSnap = await getDoc(doc(db, "lessons", lessonId));
  const lessonData = lessonSnap.exists() ? lessonSnap.data() : null;
  const lessonType = lessonData?.type || "MATH";
  const activity = getLessonActivityType({ lessonId, activityType: lessonType }) === "LESSON" ? activityType : getLessonActivityType({ lessonId, activityType: lessonType });

  const progress = await upsertProgress(user.uid, childId, lessonId, { score, totalQuestions, correctAnswers, activityType: activity });
  
  let xpGained = 0;
  if (!isAlreadyCompleted) {
    xpGained = 20; // Complete lesson (Math or Dialogue) is +20 XP as requested
    await awardXp(user.uid, childId, xpGained, `Hoàn thành bài học: ${lessonData?.title || lessonId}`);
  }

  // Update streak
  const streakResult = await updateStreak(user.uid, childId);

  // Update daily missions progress
  await updateDailyMissionProgress(user.uid, childId, "COMPLETE_LESSON", 1);
  if (lessonType === "MATH") {
    await updateDailyMissionProgress(user.uid, childId, "COMPLETE_MATH", 1);
  } else if (lessonType === "DIALOGUE") {
    await updateDailyMissionProgress(user.uid, childId, "COMPLETE_DIALOGUE", 1);
  }

  // Check and award badges
  const newlyEarnedBadges = await checkAndAwardBadges(user.uid, childId);

  const totalXp = await getTotalXp(user.uid, childId);
  const levelStats = calculateLevel(totalXp);

  return {
    ...progress,
    results,
    score,
    totalQuestions,
    correctAnswers,
    xpGained,
    streak: streakResult,
    newBadges: newlyEarnedBadges,
    levelStats
  };
}

async function submitWordLesson(lessonId: string, items: any[], answers: { itemId: string; answer: string; selectedOption?: string }[], activityType: string) {
  const user = requireUser();
  const childId = await getFirstChildId(user.uid);
  if (!childId) throw new Error("Bố mẹ cần tạo hồ sơ cho bé trước.");

  const answerMap = new Map(answers.map((item) => [item.itemId, item.answer]));
  const optionMap = new Map(answers.map((item) => [item.itemId, item.selectedOption]));
  const results = items.map((item) => {
    const answer = answerMap.get(item.id) || "";
    const selectedOption = (optionMap.get(item.id) || "").toUpperCase();
    const normalized = normalizeWord(answer);

    const correctWord = item.correctOption ? normalizeWord(item[`option${item.correctOption}`] || "") : "";
    const defaultTarget = normalizeWord(item.targetWord || item.correctWord || item.promptWord || "");
    const target = correctWord || defaultTarget;

    const isCorrectByOption = Boolean(item.correctOption) && selectedOption === String(item.correctOption).toUpperCase();
    const isCorrectByWord = normalized === target;

    return {
      itemId: item.id,
      answer,
      selectedOption,
      targetWord: item.correctOption ? (item[`option${item.correctOption}`] || "") : (item.targetWord || item.correctWord || item.promptWord || ""),
      isCorrect: isCorrectByOption || isCorrectByWord
    };
  });

  const totalQuestions = items.length;
  const correctAnswers = results.filter((item) => item.isCorrect).length;
  const score = totalQuestions ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  const progress = await upsertProgress(user.uid, childId, lessonId, { score, totalQuestions, correctAnswers, activityType });
  const streakResult = await updateStreak(user.uid, childId);
  await updateDailyMissionProgress(user.uid, childId, "COMPLETE_LESSON", 1);
  const newlyEarnedBadges = await checkAndAwardBadges(user.uid, childId);
  const totalXp = await getTotalXp(user.uid, childId);
  const levelStats = calculateLevel(totalXp);

  return {
    ...progress,
    results,
    score,
    totalQuestions,
    correctAnswers,
    xpGained: 20,
    streak: streakResult,
    newBadges: newlyEarnedBadges,
    levelStats
  };
}

async function upsertProgress(userId: string, childId: string, lessonId: string, result: any) {
  const snap = await getDocs(query(
    collection(db, "progress"),
    where("userId", "==", userId),
    where("childId", "==", childId),
    where("lessonId", "==", lessonId)
  ));
  const now = serverTimestamp();
  const payload = {
    userId,
    childId,
    lessonId,
    status: "COMPLETED",
    ...result,
    completedAt: now,
    updatedAt: now
  };
  if (snap.docs[0]) {
    await setDoc(doc(db, "progress", snap.docs[0].id), payload, { merge: true });
    return { id: snap.docs[0].id, ...payload };
  }
  const ref = await addDoc(collection(db, "progress"), { ...payload, createdAt: now });
  return { id: ref.id, ...payload };
}

async function upsertStreak(userId: string, childId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const snap = await getDocs(query(collection(db, "streaks"), where("userId", "==", userId), where("childId", "==", childId)));
  const current = snap.docs[0] ? snap.docs[0].data() : null;
  if (current?.lastActiveDate === today) return;

  const currentStreak = current?.lastActiveDate === yesterday ? Number(current.currentStreak ?? 0) + 1 : 1;
  const longestStreak = Math.max(currentStreak, Number(current?.longestStreak ?? 0));
  const payload = { userId, childId, currentStreak, longestStreak, lastActiveDate: today, updatedAt: serverTimestamp() };
  if (snap.docs[0]) await setDoc(doc(db, "streaks", snap.docs[0].id), payload, { merge: true });
  else await addDoc(collection(db, "streaks"), payload);
}

function requireUser() {
  const user = auth.currentUser;
  if (!user) throw new Error("Bạn cần đăng nhập.");
  return user;
}

function normalizeWord(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}
