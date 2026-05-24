import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  runTransaction,
  serverTimestamp,
  where
} from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { getFirstChildId } from "./progressApi";
import {
  awardXp,
  updateStreak,
  updateDailyMissionProgress,
  checkAndAwardBadges,
  calculateLevel,
  getTotalXp
} from "../utils/gamification";

export const qrApi = {
  async unlock(code: string, childId?: string) {
    const user = requireUser();
    const activeChildId = childId || await getFirstChildId(user.uid);
    if (!activeChildId) throw new Error("Bố mẹ cần tạo hồ sơ cho bé trước khi quét mã QR.");

    // Query QR Code document
    const qrSnap = await getDocs(query(collection(db, "qrCodes"), where("code", "==", code)));
    const qrDoc = qrSnap.docs[0];
    if (!qrDoc) {
      throw new Error("Mã QR không tồn tại. Vui lòng kiểm tra lại mã in trên sản phẩm.");
    }

    const transactionResult = await runTransaction(db, async (transaction) => {
      const freshQr = await transaction.get(qrDoc.ref);
      const qr = freshQr.data();
      if (!qr) throw new Error("Mã QR không hợp lệ.");
      
      // QR state validation checks
      if (qr.isActive === false) {
        throw new Error("Mã QR này hiện đang tạm dừng hoạt động.");
      }
      
      if (qr.maxUses !== null && qr.maxUses !== undefined && Number(qr.usedCount ?? 0) >= Number(qr.maxUses)) {
        throw new Error("Mã QR này đã đạt giới hạn lượt sử dụng tối đa.");
      }

      // Check if the Mascot is deleted or inactive before setting unlocked.
      const npcRef = doc(db, "npcs", qr.npcId);
      const freshNpc = await transaction.get(npcRef);
      if (!freshNpc.exists()) {
        throw new Error("Nhân vật Mascot liên kết với mã này không tồn tại hoặc đã bị xóa.");
      }
      if (freshNpc.data()?.isActive === false) {
        throw new Error("Nhân vật Mascot liên kết với mã này hiện đã bị khóa.");
      }

      const unlockedRef = doc(db, "userUnlockedNpcs", `${user.uid}_${activeChildId}_${qr.npcId}`);
      const existingUnlock = await transaction.get(unlockedRef);
      if (existingUnlock.exists()) return "existing";

      transaction.set(unlockedRef, {
        userId: user.uid,
        childId: activeChildId,
        npcId: qr.npcId,
        qrCodeId: qrDoc.id,
        unlockedAt: serverTimestamp()
      });
      
      transaction.update(qrDoc.ref, { usedCount: increment(1), updatedAt: serverTimestamp() });
      return "created";
    });

    const npcSnap = await getDoc(doc(db, "npcs", qrDoc.data().npcId));

    let xpGained = 0;
    let streakResult: any = null;
    let newlyEarnedBadges: any[] = [];
    let levelStats: any = null;

    if (transactionResult === "created") {
      xpGained = 10; // Mascot unlock is +10 XP
      await awardXp(user.uid, activeChildId, xpGained, `Mở khóa Mascot: ${npcSnap.data()?.name || qrDoc.data().npcId}`);
      
      streakResult = await updateStreak(user.uid, activeChildId);
      await updateDailyMissionProgress(user.uid, activeChildId, "SCAN_QR", 1);
      newlyEarnedBadges = await checkAndAwardBadges(user.uid, activeChildId);
      
      const totalXp = await getTotalXp(user.uid, activeChildId);
      levelStats = calculateLevel(totalXp);
    }
    
    return {
      data: {
        message: transactionResult === "existing" ? "Mascot này đã có sẵn trong bộ sưu tập của bé!" : "Mở khóa Mascot thành công! 🎉",
        data: {
          npc: { id: npcSnap.id, ...npcSnap.data() } as any,
          xpGained,
          streak: streakResult,
          newBadges: newlyEarnedBadges,
          levelStats
        }
      }
    };
  }
};

function requireUser() {
  const user = auth.currentUser;
  if (!user) throw new Error("Bạn cần đăng nhập tài khoản phụ huynh.");
  return user;
}
