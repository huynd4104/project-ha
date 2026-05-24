import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { getTodayKey, claimDailyMissionReward } from "../utils/gamification";
import type { UserBadge } from "../utils/gamification";
import { getLessonActivityType, isFlashcardProgress } from "../utils/lessonTypes";

export const progressApi = {
  async my() {
    const user = requireUser();
    const snap = await getDocs(query(collection(db, "progress"), where("userId", "==", user.uid)));
    return { data: { data: snap.docs.map((item) => ({ id: item.id, ...item.data() })) } };
  },
  async summary(childId?: string) {
    const user = requireUser();
    const activeChildId = childId || await getFirstChildId(user.uid);
    if (!activeChildId) return { data: { data: emptySummary() } };

    const [progressSnap, xpSnap, streakSnap, unlockedSnap, lessonsSnap] = await Promise.all([
      getDocs(query(collection(db, "progress"), where("userId", "==", user.uid), where("childId", "==", activeChildId))),
      getDocs(query(collection(db, "xpLogs"), where("userId", "==", user.uid), where("childId", "==", activeChildId))),
      getDocs(query(collection(db, "streaks"), where("userId", "==", user.uid), where("childId", "==", activeChildId))),
      getDocs(query(collection(db, "userUnlockedNpcs"), where("userId", "==", user.uid), where("childId", "==", activeChildId))),
      getDocs(collection(db, "lessons"))
    ]);

    const lessons = new Map(lessonsSnap.docs.map((item) => [item.id, { id: item.id, ...item.data() }]));
    const history = progressSnap.docs.map((item) => {
      const progress = { id: item.id, ...item.data() } as any;
      return { ...progress, lesson: lessons.get(progress.lessonId) };
    });
    const xp = xpSnap.docs.reduce((sum, item) => sum + Number(item.data().amount ?? 0), 0);
    const streak = streakSnap.docs[0] ? { id: streakSnap.docs[0].id, ...streakSnap.docs[0].data() } : null;

    return {
      data: {
        data: {
          xp,
          streak,
          unlockedNpcs: unlockedSnap.size,
          completedLessons: history.filter((item: any) => item.status === "COMPLETED" && !isFlashcardProgress(item)).length,
          history
        }
      }
    };
  },
  async child(childId: string) {
    return progressApi.summary(childId);
  },
  async dailyMissions(childId: string) {
    const user = requireUser();
    const today = getTodayKey();

    // Get active daily missions
    const missionsSnap = await getDocs(query(collection(db, "dailyMissions"), where("isActive", "==", true)));
    const activeMissions = missionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

    // Get user mission progress for today
    const progressSnap = await getDocs(query(
      collection(db, "userMissionProgress"),
      where("userId", "==", user.uid),
      where("childId", "==", childId),
      where("date", "==", today)
    ));
    const progressMap = new Map(progressSnap.docs.map(doc => [doc.data().missionId, { id: doc.id, ...doc.data() }]));

    const data = activeMissions.map(m => {
      const p = progressMap.get(m.id);
      return {
        mission: m,
        progress: p || {
          currentValue: 0,
          targetValue: m.targetValue,
          isCompleted: false,
          rewardClaimed: false
        }
      };
    });

    return { data: { data } };
  },
  async claimMissionReward(progressId: string, childId: string) {
    const user = requireUser();
    const xpAmount = await claimDailyMissionReward(user.uid, childId, progressId);
    return { data: { data: { xpAmount } } };
  },
  async badges(childId: string) {
    const user = requireUser();
    
    // Get all active badges
    const badgesSnap = await getDocs(query(collection(db, "badges"), where("isActive", "==", true)));
    const allBadges = badgesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

    // Get earned badges
    const earnedSnap = await getDocs(query(
      collection(db, "userBadges"),
      where("userId", "==", user.uid),
      where("childId", "==", childId)
    ));
    const earnedMap = new Map<string, UserBadge>(
      earnedSnap.docs.map(doc => [doc.data().badgeId, { id: doc.id, ...doc.data() } as UserBadge])
    );

    const data = allBadges.map(b => {
      const earned = earnedMap.get(b.id);
      return {
        ...b,
        isEarned: !!earned,
        earnedAt: earned ? earned.earnedAt : null
      };
    });

    return { data: { data } };
  },
  async recentActivities(childId: string) {
    const user = requireUser();
    
    const [progressSnap, unlockSnap, badgeSnap, xpSnap, lessonsSnap, npcsSnap, badgesSnap] = await Promise.all([
      getDocs(query(collection(db, "progress"), where("userId", "==", user.uid), where("childId", "==", childId), where("status", "==", "COMPLETED"))),
      getDocs(query(collection(db, "userUnlockedNpcs"), where("userId", "==", user.uid), where("childId", "==", childId))),
      getDocs(query(collection(db, "userBadges"), where("userId", "==", user.uid), where("childId", "==", childId))),
      getDocs(query(collection(db, "xpLogs"), where("userId", "==", user.uid), where("childId", "==", childId))),
      getDocs(collection(db, "lessons")),
      getDocs(collection(db, "npcs")),
      getDocs(collection(db, "badges"))
    ]);

    const lessons = new Map(lessonsSnap.docs.map(d => [d.id, d.data()]));
    const npcs = new Map(npcsSnap.docs.map(d => [d.id, d.data()]));
    const badges = new Map(badgesSnap.docs.map(d => [d.id, d.data()]));

    const activities: any[] = [];

    // 1. Completed lessons
    progressSnap.docs.forEach(doc => {
      const data = doc.data();
      const activityType = getLessonActivityType(data as any);
      if (activityType === "FLASHCARD") {
        const baseLessonId = String(data.lessonId || "").replace("_flashcard", "");
        const lesson = lessons.get(baseLessonId);
        activities.push({
          id: doc.id,
          type: "FLASHCARD",
          title: `Ôn tập thẻ học`,
          detail: lesson ? lesson.title : `Thẻ học bài ${baseLessonId}`,
          timestamp: data.completedAt,
          icon: "🎓"
        });
      } else {
        const lesson = lessons.get(data.lessonId);
        activities.push({
          id: doc.id,
          type: activityType || "LESSON",
          title: `Hoàn thành bài học`,
          detail: lesson ? lesson.title : `Bài học ${data.lessonId}`,
          timestamp: data.completedAt,
          icon: "📚"
        });
      }
    });

    // 2. Unlocked Mascots
    unlockSnap.docs.forEach(doc => {
      const data = doc.data();
      const npc = npcs.get(data.npcId);
      activities.push({
        id: doc.id,
        type: "NPC",
        title: `Mở khóa Mascot`,
        detail: npc ? npc.name : `Mascot ${data.npcId}`,
        timestamp: data.unlockedAt,
        icon: "👾"
      });
    });

    // 3. Earned Badges
    badgeSnap.docs.forEach(doc => {
      const data = doc.data();
      const badge = badges.get(data.badgeId);
      activities.push({
        id: doc.id,
        type: "BADGE",
        title: `Nhận huy hiệu`,
        detail: badge ? badge.name : `Huy hiệu ${data.badgeId}`,
        timestamp: data.earnedAt,
        icon: "🏅"
      });
    });

    // 4. Mission Claims / XP Logs that aren't lessons
    xpSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.reason && data.reason.includes("nhiệm vụ")) {
        activities.push({
          id: doc.id,
          type: "XP_MISSION",
          title: `Nhận thưởng nhiệm vụ`,
          detail: data.reason,
          timestamp: data.createdAt,
          icon: "✨"
        });
      }
    });

    // Sort by timestamp descending
    const sorted = activities.sort((a, b) => {
      const timeA = a.timestamp ? (a.timestamp.toMillis ? a.timestamp.toMillis() : Date.parse(a.timestamp)) : 0;
      const timeB = b.timestamp ? (b.timestamp.toMillis ? b.timestamp.toMillis() : Date.parse(b.timestamp)) : 0;
      return timeB - timeA;
    });

    return { data: { data: sorted.slice(0, 5) } };
  }
};

export async function getFirstChildId(userId: string) {
  const snap = await getDocs(query(collection(db, "children"), where("userId", "==", userId)));
  return snap.docs[0]?.id;
}

function emptySummary() {
  return { xp: 0, streak: null, unlockedNpcs: 0, completedLessons: 0, history: [] };
}

function requireUser() {
  const user = auth.currentUser;
  if (!user) throw new Error("Bạn cần đăng nhập.");
  return user;
}
