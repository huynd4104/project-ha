import { collection, addDoc, getDocs, query, where, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";

export type BadgeType = "LESSON" | "STREAK" | "XP" | "NPC" | "MISSION";
export type BadgeConditionType = "COMPLETE_LESSONS" | "STREAK_DAYS" | "TOTAL_XP" | "UNLOCK_NPCS" | "COMPLETE_DAILY_MISSIONS";

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  type: BadgeType;
  conditionType: BadgeConditionType;
  conditionValue: number;
  isActive: boolean;
}

export interface UserBadge {
  id: string;
  userId: string;
  childId: string;
  badgeId: string;
  earnedAt: any;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  type: "COMPLETE_LESSON" | "REVIEW_FLASHCARD" | "SCAN_QR" | "COMPLETE_DIALOGUE" | "COMPLETE_MATH";
  targetValue: number;
  rewardXp: number;
  isActive: boolean;
}

export interface UserMissionProgress {
  id: string;
  userId: string;
  childId: string;
  missionId: string;
  date: string; // YYYY-MM-DD
  currentValue: number;
  targetValue: number;
  isCompleted: boolean;
  rewardClaimed: boolean;
  completedAt: any;
  updatedAt: any;
}

export function getTodayKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateLevel(totalXp: number) {
  const level = Math.floor(totalXp / 100) + 1;
  const xpInCurrentLevel = totalXp % 100;
  const xpToNextLevel = 100;
  return { level, xpInCurrentLevel, xpToNextLevel };
}

export async function getTotalXp(userId: string, childId: string): Promise<number> {
  const xpSnap = await getDocs(query(collection(db, "xpLogs"), where("userId", "==", userId), where("childId", "==", childId)));
  return xpSnap.docs.reduce((sum, item) => sum + Number(item.data().amount ?? 0), 0);
}

export async function awardXp(userId: string, childId: string, amount: number, reason: string): Promise<number> {
  if (amount <= 0) return 0;
  await addDoc(collection(db, "xpLogs"), {
    userId,
    childId,
    amount,
    reason,
    createdAt: serverTimestamp()
  });
  return amount;
}

export async function updateStreak(userId: string, childId: string) {
  const today = getTodayKey();
  const yesterday = getYesterdayKey();
  
  const streaksRef = collection(db, "streaks");
  const snap = await getDocs(query(streaksRef, where("userId", "==", userId), where("childId", "==", childId)));
  
  if (snap.empty) {
    const payload = {
      userId,
      childId,
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: today,
      updatedAt: serverTimestamp()
    };
    await addDoc(streaksRef, payload);
    return { currentStreak: 1, longestStreak: 1, isNew: true };
  } else {
    const docId = snap.docs[0].id;
    const current = snap.docs[0].data();
    
    if (current.lastActiveDate === today) {
      return { currentStreak: current.currentStreak, longestStreak: current.longestStreak, isNew: false };
    }
    
    let currentStreak = 1;
    if (current.lastActiveDate === yesterday) {
      currentStreak = Number(current.currentStreak ?? 0) + 1;
    }
    
    const longestStreak = Math.max(currentStreak, Number(current.longestStreak ?? 0));
    const payload = {
      currentStreak,
      longestStreak,
      lastActiveDate: today,
      updatedAt: serverTimestamp()
    };
    await setDoc(doc(db, "streaks", docId), payload, { merge: true });
    return { currentStreak, longestStreak, isNew: true };
  }
}

export async function checkAndAwardBadges(userId: string, childId: string): Promise<Badge[]> {
  const badgesSnap = await getDocs(query(collection(db, "badges"), where("isActive", "==", true)));
  const allBadges = badgesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Badge[];
  
  if (allBadges.length === 0) return [];

  const earnedSnap = await getDocs(query(collection(db, "userBadges"), where("userId", "==", userId), where("childId", "==", childId)));
  const earnedBadgeIds = new Set(earnedSnap.docs.map(doc => doc.data().badgeId));

  const progressSnap = await getDocs(query(collection(db, "progress"), where("userId", "==", userId), where("childId", "==", childId), where("status", "==", "COMPLETED")));
  const completedLessonsCount = new Set(progressSnap.docs.map(doc => doc.data().lessonId)).size;

  const streakSnap = await getDocs(query(collection(db, "streaks"), where("userId", "==", userId), where("childId", "==", childId)));
  const currentStreak = streakSnap.empty ? 0 : (streakSnap.docs[0].data().currentStreak ?? 0);

  const totalXp = await getTotalXp(userId, childId);

  const npcUnlockSnap = await getDocs(query(collection(db, "userUnlockedNpcs"), where("userId", "==", userId), where("childId", "==", childId)));
  const unlockedNpcCount = npcUnlockSnap.size;

  const completedMissionsSnap = await getDocs(query(collection(db, "userMissionProgress"), where("userId", "==", userId), where("childId", "==", childId), where("isCompleted", "==", true)));
  const completedMissionsCount = completedMissionsSnap.size;

  const newlyEarnedBadges: Badge[] = [];

  for (const badge of allBadges) {
    if (earnedBadgeIds.has(badge.id)) continue;

    let conditionMet = false;
    switch (badge.conditionType) {
      case "COMPLETE_LESSONS":
        conditionMet = completedLessonsCount >= badge.conditionValue;
        break;
      case "STREAK_DAYS":
        conditionMet = currentStreak >= badge.conditionValue;
        break;
      case "TOTAL_XP":
        conditionMet = totalXp >= badge.conditionValue;
        break;
      case "UNLOCK_NPCS":
        conditionMet = unlockedNpcCount >= badge.conditionValue;
        break;
      case "COMPLETE_DAILY_MISSIONS":
        conditionMet = completedMissionsCount >= badge.conditionValue;
        break;
    }

    if (conditionMet) {
      const earnedRef = doc(collection(db, "userBadges"));
      await setDoc(earnedRef, {
        userId,
        childId,
        badgeId: badge.id,
        earnedAt: serverTimestamp()
      });
      newlyEarnedBadges.push(badge);
    }
  }

  return newlyEarnedBadges;
}

export async function updateDailyMissionProgress(userId: string, childId: string, type: string, incrementVal = 1) {
  const today = getTodayKey();
  
  const missionsSnap = await getDocs(query(collection(db, "dailyMissions"), where("isActive", "==", true)));
  const activeMissions = missionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DailyMission[];
  
  if (activeMissions.length === 0) return;

  const targetMissions = activeMissions.filter(m => m.type === type);
  if (targetMissions.length === 0) return;

  for (const mission of targetMissions) {
    const progressQuery = query(
      collection(db, "userMissionProgress"),
      where("userId", "==", userId),
      where("childId", "==", childId),
      where("missionId", "==", mission.id),
      where("date", "==", today)
    );
    const progressSnap = await getDocs(progressQuery);
    
    let currentValue = 0;
    let isCompleted = false;
    let rewardClaimed = false;
    let docId = "";

    if (!progressSnap.empty) {
      const data = progressSnap.docs[0].data();
      docId = progressSnap.docs[0].id;
      currentValue = Number(data.currentValue ?? 0) + incrementVal;
      isCompleted = data.isCompleted || currentValue >= mission.targetValue;
      rewardClaimed = !!data.rewardClaimed;
    } else {
      currentValue = incrementVal;
      isCompleted = currentValue >= mission.targetValue;
    }

    const payload = {
      userId,
      childId,
      missionId: mission.id,
      date: today,
      currentValue,
      targetValue: mission.targetValue,
      isCompleted,
      rewardClaimed,
      completedAt: isCompleted ? (progressSnap.empty ? serverTimestamp() : progressSnap.docs[0].data().completedAt || serverTimestamp()) : null,
      updatedAt: serverTimestamp()
    };

    if (docId) {
      await setDoc(doc(db, "userMissionProgress", docId), payload, { merge: true });
    } else {
      await addDoc(collection(db, "userMissionProgress"), payload);
    }
  }
}

export async function claimDailyMissionReward(userId: string, childId: string, progressId: string): Promise<number> {
  const progressRef = doc(db, "userMissionProgress", progressId);
  const progressSnap = await getDoc(progressRef);
  
  if (!progressSnap.exists()) throw new Error("Không tìm thấy tiến trình nhiệm vụ.");
  const progress = progressSnap.data();
  if (!progress.isCompleted) throw new Error("Nhiệm vụ chưa hoàn thành.");
  if (progress.rewardClaimed) throw new Error("Phần thưởng đã được nhận trước đó.");

  const missionRef = doc(db, "dailyMissions", progress.missionId);
  const missionSnap = await getDoc(missionRef);
  if (!missionSnap.exists()) throw new Error("Không tìm thấy nhiệm vụ.");
  const mission = missionSnap.data() as DailyMission;

  await setDoc(progressRef, { rewardClaimed: true, updatedAt: serverTimestamp() }, { merge: true });

  const xpAmount = Number(mission.rewardXp ?? 0);
  await awardXp(userId, childId, xpAmount, `Nhận thưởng nhiệm vụ hàng ngày: "${mission.title}"`);

  return xpAmount;
}
