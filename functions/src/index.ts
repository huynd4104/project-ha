import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { HttpsError, onCall, type CallableRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

admin.initializeApp();

const smtpEmail = defineSecret("SMTP_EMAIL");
const smtpPassword = defineSecret("SMTP_PASSWORD");
const db = admin.firestore();
const region = "asia-southeast1";
const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;
const ENABLE_DEMO_PREMIUM_UPGRADE = true;
const ENABLE_MOCK_VOICE_PROVIDER = true;

type CallableData = Record<string, unknown>;
type CodeSource = "QR" | "NFC" | "MANUAL";

function dataOf(request: CallableRequest<unknown>): CallableData {
  if (!request.data || typeof request.data !== "object" || Array.isArray(request.data)) {
    throw new HttpsError("invalid-argument", "Payload không hợp lệ.");
  }
  return request.data as CallableData;
}

function requireUid(request: CallableRequest<unknown>): string {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Bạn cần đăng nhập.");
  }
  return uid;
}

function readString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpsError("invalid-argument", `Thiếu trường ${field}.`);
  }
  return value.trim();
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function readNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function todayKey(offset = 0): string {
  const vietnamTime = Date.now() + 7 * 60 * 60 * 1000 + offset * 24 * 60 * 60 * 1000;
  return new Date(vietnamTime).toISOString().slice(0, 10);
}

function isExpired(value: unknown): boolean {
  if (!value) return false;
  if (value instanceof admin.firestore.Timestamp) {
    return value.toDate().getTime() < Date.now();
  }
  if (value instanceof Date) return value.getTime() < Date.now();
  return false;
}

function levelStats(totalXp: number) {
  return {
    totalXp,
    level: Math.floor(totalXp / 100) + 1,
    xpInLevel: totalXp % 100,
    xpToNextLevel: 100,
  };
}

async function assertOwnedChild(userId: string, childId: string) {
  const childDoc = await db.collection("children").doc(childId).get();
  if (!childDoc.exists || childDoc.data()?.userId !== userId) {
    throw new HttpsError("permission-denied", "Hồ sơ trẻ không thuộc tài khoản này.");
  }
  return childDoc;
}

async function totalXp(userId: string, childId: string): Promise<number> {
  const snap = await db
    .collection("xpLogs")
    .where("userId", "==", userId)
    .where("childId", "==", childId)
    .get();
  return snap.docs.reduce((sum, doc) => sum + readNumber(doc.data().amount), 0);
}

async function awardXp(
  userId: string,
  childId: string,
  amount: number,
  reason: string,
): Promise<number> {
  if (amount <= 0) return 0;
  await db.collection("xpLogs").add({
    userId,
    childId,
    amount,
    reason,
    createdAt: serverTimestamp(),
  });
  return amount;
}

async function updateStreak(userId: string, childId: string) {
  const today = todayKey();
  const yesterday = todayKey(-1);
  const snap = await db
    .collection("streaks")
    .where("userId", "==", userId)
    .where("childId", "==", childId)
    .limit(1)
    .get();

  if (snap.empty) {
    const payload = {
      userId,
      childId,
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: today,
      updatedAt: serverTimestamp(),
    };
    const ref = await db.collection("streaks").add(payload);
    return { id: ref.id, ...payload };
  }

  const doc = snap.docs[0];
  const current = doc.data();
  if (current.lastActiveDate === today) {
    return { id: doc.id, ...current };
  }

  const currentStreak = current.lastActiveDate === yesterday
    ? readNumber(current.currentStreak) + 1
    : 1;
  const longestStreak = Math.max(currentStreak, readNumber(current.longestStreak));
  await doc.ref.set({
    currentStreak,
    longestStreak,
    lastActiveDate: today,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  return {
    id: doc.id,
    userId,
    childId,
    currentStreak,
    longestStreak,
    lastActiveDate: today,
  };
}

async function updateDailyMissionProgress(
  userId: string,
  childId: string,
  type: string,
  increment = 1,
): Promise<void> {
  const missions = await db
    .collection("dailyMissions")
    .where("isActive", "==", true)
    .where("type", "==", type)
    .get();
  const date = todayKey();

  await Promise.all(missions.docs.map(async (missionDoc) => {
    const mission = missionDoc.data();
    const progressSnap = await db
      .collection("userMissionProgress")
      .where("userId", "==", userId)
      .where("childId", "==", childId)
      .where("missionId", "==", missionDoc.id)
      .where("date", "==", date)
      .limit(1)
      .get();
    const progressRef = progressSnap.empty
      ? db.collection("userMissionProgress").doc(`${userId}_${childId}_${missionDoc.id}_${date}`)
      : progressSnap.docs[0].ref;
    const existing = progressSnap.empty ? undefined : progressSnap.docs[0].data();
    const currentValue = readNumber(existing?.currentValue) + increment;
    const targetValue = readNumber(mission.targetValue);
    const isCompleted = existing?.isCompleted === true || currentValue >= targetValue;
    await progressRef.set({
      userId,
      childId,
      missionId: missionDoc.id,
      date,
      currentValue,
      targetValue,
      isCompleted,
      rewardClaimed: existing?.rewardClaimed === true,
      completedAt: isCompleted && existing?.completedAt == null ? serverTimestamp() : existing?.completedAt ?? null,
      updatedAt: serverTimestamp(),
      createdAt: existing?.createdAt ?? serverTimestamp(),
    }, { merge: true });
  }));
}

async function checkAndAwardBadges(userId: string, childId: string) {
  const [
    badgesSnap,
    earnedSnap,
    progressSnap,
    streakSnap,
    unlockSnap,
    missionSnap,
    xp,
  ] = await Promise.all([
    db.collection("badges").where("isActive", "==", true).get(),
    db.collection("userBadges")
      .where("userId", "==", userId)
      .where("childId", "==", childId)
      .get(),
    db.collection("progress")
      .where("userId", "==", userId)
      .where("childId", "==", childId)
      .where("status", "==", "COMPLETED")
      .get(),
    db.collection("streaks")
      .where("userId", "==", userId)
      .where("childId", "==", childId)
      .limit(1)
      .get(),
    db.collection("userUnlockedNpcs")
      .where("userId", "==", userId)
      .where("childId", "==", childId)
      .get(),
    db.collection("userMissionProgress")
      .where("userId", "==", userId)
      .where("childId", "==", childId)
      .where("isCompleted", "==", true)
      .get(),
    totalXp(userId, childId),
  ]);

  const earnedIds = new Set(earnedSnap.docs.map((doc) => doc.data().badgeId));
  const streak = streakSnap.empty ? 0 : readNumber(streakSnap.docs[0].data().currentStreak);
  const completedLessonCount = new Set(progressSnap.docs.map((doc) => doc.data().lessonId)).size;
  const newBadges: Array<Record<string, unknown>> = [];

  await Promise.all(badgesSnap.docs.map(async (doc) => {
    if (earnedIds.has(doc.id)) return;
    const badge = doc.data();
    const conditionType = `${badge.conditionType ?? ""}`;
    const conditionValue = readNumber(badge.conditionValue);
    const ok = (
      (conditionType === "COMPLETE_LESSONS" && completedLessonCount >= conditionValue) ||
      (conditionType === "STREAK_DAYS" && streak >= conditionValue) ||
      (conditionType === "TOTAL_XP" && xp >= conditionValue) ||
      (conditionType === "UNLOCK_NPCS" && unlockSnap.size >= conditionValue) ||
      (conditionType === "COMPLETE_DAILY_MISSIONS" && missionSnap.size >= conditionValue)
    );
    if (!ok) return;

    await db.collection("userBadges").doc(`${userId}_${childId}_${doc.id}`).set({
      userId,
      childId,
      badgeId: doc.id,
      earnedAt: serverTimestamp(),
    }, { merge: true });
    newBadges.push({ id: doc.id, ...badge, isEarned: true });
  }));

  return newBadges;
}

async function rewardSummary(userId: string, childId: string, xpGained: number) {
  const [streak, newBadges, xp] = await Promise.all([
    updateStreak(userId, childId),
    checkAndAwardBadges(userId, childId),
    totalXp(userId, childId),
  ]);
  return {
    xpGained,
    streak,
    newBadges,
    levelStats: levelStats(xp),
  };
}

export const onOtpCreated = onDocumentWritten(
  {
    document: "otps/{userId}",
    secrets: [smtpEmail, smtpPassword],
    region,
  },
  async (event) => {
    const data = event.data?.after?.data();

    // Document deleted → ignore
    if (!data) return;

    const userId = event.params.userId;
    const code: string = data.code;
    const expiresAt = data.expiresAt?.toDate();

    if (!code) {
      logger.warn(`OTP document for ${userId} has no code, skipping.`);
      return;
    }

    // Already sent email for this code → skip
    if (data.emailSent === true) {
      logger.info(`Email already sent for ${userId}, skipping.`);
      return;
    }

    // Read user email from /users/{userId}
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(userId)
      .get();
    const userData = userDoc.data();
    const userEmail = userData?.email;
    const fullName = userData?.fullName || "Phụ huynh";

    if (!userEmail) {
      logger.error(`No email found for user ${userId}, cannot send OTP.`);
      return;
    }

    // Format expiry time
    const expiryStr = expiresAt
      ? `${expiresAt.getHours().toString().padStart(2, "0")}:${expiresAt.getMinutes().toString().padStart(2, "0")}`
      : "30 phút";

    // Create Gmail SMTP transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: smtpEmail.value(),
        pass: smtpPassword.value(),
      },
    });

    // Build HTML email
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f7fa;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6C63FF,#4ECDC4);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">
                🛡️ Xác thực tài khoản
              </h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">
                Project HA
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <p style="margin:0 0 16px;color:#333;font-size:16px;line-height:1.6;">
                Xin chào <strong>${fullName}</strong>,
              </p>
              <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6;">
                Đây là mã xác thực tài khoản của bạn. Vui lòng nhập mã bên dưới vào ứng dụng để hoàn tất đăng ký:
              </p>

              <!-- OTP Code -->
              <div style="text-align:center;margin:24px 0;">
                <div style="display:inline-block;background:#f0f0ff;border:2px dashed #6C63FF;border-radius:12px;padding:20px 40px;">
                  <span style="font-size:36px;font-weight:800;letter-spacing:10px;color:#6C63FF;">
                    ${code}
                  </span>
                </div>
              </div>

              <p style="margin:24px 0 8px;color:#888;font-size:13px;text-align:center;">
                ⏰ Mã có hiệu lực đến <strong>${expiryStr}</strong>
              </p>
              <p style="margin:0 0 24px;color:#888;font-size:13px;text-align:center;">
                Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.
              </p>

              <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">

              <p style="margin:0;color:#aaa;font-size:12px;text-align:center;line-height:1.5;">
                Email này được gửi tự động từ Project HA.<br>
                Vui lòng không trả lời email này.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Send email
    const mailOptions = {
      from: `"Project HA" <${smtpEmail.value()}>`,
      to: userEmail,
      subject: `[${code}] Mã xác thực tài khoản Project HA`,
      html: htmlContent,
    };

    try {
      await transporter.sendMail(mailOptions);
      logger.info(`✅ OTP email sent to ${userEmail} for user ${userId}`);

      // Mark as sent to avoid duplicate emails
      await event.data!.after!.ref.update({ emailSent: true });
    } catch (err) {
      logger.error(`❌ Failed to send OTP email to ${userEmail}:`, err);
      throw err;
    }
  }
);

export const sendOtpVerificationCode = onCall({ region }, async (request) => {
  const userId = requireUid(request);
  const authEmail = request.auth?.token.email;
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() + 30 * 60 * 1000),
  );

  const userRef = db.collection("users").doc(userId);
  const userDoc = await userRef.get();
  if (!userDoc.exists) {
    await userRef.set({
      uid: userId,
      email: authEmail ?? "",
      fullName: request.auth?.token.name ?? authEmail ?? "Phụ huynh",
      role: "PARENT",
      isActive: true,
      emailVerified: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }

  await db.collection("otps").doc(userId).set({
    code,
    expiresAt,
    emailSent: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });

  return { ok: true, expiresAt: expiresAt.toMillis() };
});

export const verifyOtpCode = onCall({ region }, async (request) => {
  const userId = requireUid(request);
  const data = dataOf(request);
  const enteredCode = readString(data.code, "code");
  const otpRef = db.collection("otps").doc(userId);
  const otpDoc = await otpRef.get();

  if (!otpDoc.exists) {
    throw new HttpsError("not-found", "Không tìm thấy mã xác thực. Vui lòng gửi lại mã mới.");
  }

  const otp = otpDoc.data();
  if (!otp?.code || !(otp.expiresAt instanceof admin.firestore.Timestamp)) {
    throw new HttpsError("failed-precondition", "Mã xác thực không hợp lệ. Vui lòng gửi lại mã mới.");
  }
  if (otp.expiresAt.toDate().getTime() < Date.now()) {
    throw new HttpsError("deadline-exceeded", "Mã xác thực đã hết hạn. Vui lòng gửi lại mã mới.");
  }
  if (`${otp.code}` !== enteredCode) {
    throw new HttpsError("invalid-argument", "Mã xác thực 6 số chưa chính xác. Vui lòng kiểm tra lại.");
  }

  await db.collection("users").doc(userId).set({
    emailVerified: true,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  await otpRef.delete();

  return { ok: true };
});

async function findActivationCode(code: string) {
  const candidates = Array.from(new Set([code, code.toUpperCase(), code.toLowerCase()]));
  for (const collection of ["activationCodes", "qrCodes"]) {
    for (const candidate of candidates) {
      const snap = await db.collection(collection).where("code", "==", candidate).limit(1).get();
      if (!snap.empty) {
        return {
          collection,
          doc: snap.docs[0],
        };
      }
    }
  }
  return null;
}

export const redeemActivationCode = onCall({ region }, async (request) => {
  const userId = requireUid(request);
  const data = dataOf(request);
  const code = readString(data.code, "code");
  const childId = readString(data.childId, "childId");
  const source = (optionalString(data.source)?.toUpperCase() ?? "MANUAL") as CodeSource;
  if (!["QR", "NFC", "MANUAL"].includes(source)) {
    throw new HttpsError("invalid-argument", "Nguồn kích hoạt không hợp lệ.");
  }
  await assertOwnedChild(userId, childId);

  const codeMatch = await findActivationCode(code);
  if (!codeMatch) {
    throw new HttpsError("not-found", "Mã kích hoạt không tồn tại. Vui lòng kiểm tra lại mã.");
  }

  const result = await db.runTransaction(async (transaction) => {
    const freshCode = await transaction.get(codeMatch.doc.ref);
    const codeData = freshCode.data();
    if (!freshCode.exists || !codeData) {
      throw new HttpsError("not-found", "Mã kích hoạt không tồn tại.");
    }
    const isActive = codeData.active !== false && codeData.isActive !== false;
    if (!isActive) {
      throw new HttpsError("failed-precondition", "Mã kích hoạt này hiện đang tạm dừng hoạt động.");
    }
    if (isExpired(codeData.expiresAt)) {
      throw new HttpsError("failed-precondition", "Mã kích hoạt này đã hết hạn.");
    }
    const maxUses = codeData.maxUses == null ? undefined : readNumber(codeData.maxUses);
    const usedCount = readNumber(codeData.usedCount);
    if (maxUses !== undefined && usedCount >= maxUses) {
      throw new HttpsError("resource-exhausted", "Mã kích hoạt này đã đạt giới hạn lượt sử dụng tối đa.");
    }

    const targetType = `${codeData.activationType ?? "NPC"}`.toUpperCase();
    const targetId = optionalString(codeData.targetId) ?? optionalString(codeData.npcId);
    if (!targetId) {
      throw new HttpsError("failed-precondition", "Mã kích hoạt chưa được liên kết nội dung.");
    }
    if (targetType !== "NPC") {
      throw new HttpsError("failed-precondition", "Phase 1 chỉ hỗ trợ kích hoạt Mascot/NPC.");
    }

    const npcRef = db.collection("npcs").doc(targetId);
    const npcDoc = await transaction.get(npcRef);
    if (!npcDoc.exists) {
      throw new HttpsError("not-found", "Nhân vật Mascot liên kết với mã này không tồn tại.");
    }
    const npcData = npcDoc.data() ?? {};
    if (npcData.isActive === false) {
      throw new HttpsError("failed-precondition", "Nhân vật Mascot liên kết với mã này hiện đã bị khóa.");
    }

    const targetRedemptionRef = db
      .collection("activationRedemptions")
      .doc(`${userId}_${childId}_${targetType}_${targetId}`);
    const unlockRef = db
      .collection("userUnlockedNpcs")
      .doc(`${userId}_${childId}_${targetId}`);
    const [existingRedemption, existingUnlock] = await Promise.all([
      transaction.get(targetRedemptionRef),
      transaction.get(unlockRef),
    ]);

    if (existingRedemption.exists || existingUnlock.exists) {
      return {
        status: "existing",
        npc: { id: npcDoc.id, ...npcData },
      };
    }

    transaction.set(targetRedemptionRef, {
      codeId: freshCode.id,
      codeCollection: codeMatch.collection,
      userId,
      childId,
      targetType,
      targetId,
      source,
      redeemedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
    transaction.set(unlockRef, {
      userId,
      childId,
      npcId: targetId,
      qrCodeId: codeMatch.collection === "qrCodes" ? freshCode.id : null,
      activationCodeId: codeMatch.collection === "activationCodes" ? freshCode.id : null,
      unlockedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
    transaction.update(freshCode.ref, {
      usedCount: admin.firestore.FieldValue.increment(1),
      updatedAt: serverTimestamp(),
    });

    return {
      status: "created",
      npc: { id: npcDoc.id, ...npcData },
    };
  });

  if (result.status === "existing") {
    return {
      npc: result.npc,
      message: "Mascot này đã có sẵn trong bộ sưu tập của bé!",
      xpGained: 0,
      levelStats: levelStats(await totalXp(userId, childId)),
      newBadges: [],
      streak: null,
    };
  }

  const redeemedNpc = result.npc as Record<string, unknown>;
  const xpGained = await awardXp(userId, childId, 10, `Mở khóa Mascot: ${redeemedNpc.name ?? ""}`);
  await updateDailyMissionProgress(userId, childId, "SCAN_QR");
  return {
    npc: result.npc,
    message: "Mở khóa Mascot thành công!",
    ...await rewardSummary(userId, childId, xpGained),
  };
});

function answersFrom(data: CallableData): Record<string, string> {
  if (!data.answers || typeof data.answers !== "object" || Array.isArray(data.answers)) {
    return {};
  }
  const entries = Object.entries(data.answers as Record<string, unknown>);
  return Object.fromEntries(entries.map(([key, value]) => [key, `${value ?? ""}`]));
}

export const submitLessonCompletion = onCall({ region }, async (request) => {
  const userId = requireUid(request);
  const data = dataOf(request);
  const childId = readString(data.childId, "childId");
  const lessonId = readString(data.lessonId, "lessonId");
  await assertOwnedChild(userId, childId);

  const lessonDoc = await db.collection("lessons").doc(lessonId).get();
  if (!lessonDoc.exists) {
    throw new HttpsError("not-found", "Bài học không tồn tại.");
  }
  const lesson = lessonDoc.data() ?? {};
  const lessonType = `${lesson.type ?? lesson.lessonType ?? data.completionType ?? "MATH"}`.toUpperCase();
  const isFlashcard = lessonType === "FLASHCARD" || data.completionType === "FLASHCARD";

  // Check activities collection first (Phase 2/3 lessons)
  const activitiesSnap = await db
    .collection("activities")
    .where("lessonId", "==", lessonId)
    .where("isActive", "==", true)
    .get();

  const isNewFlow = !activitiesSnap.empty;
  let itemsSnap: any = null;
  let itemCollection = "";

  if (!isNewFlow) {
    itemCollection = isFlashcard ? "flashcards" : lessonType === "DIALOGUE" ? "dialogues" : "mathQuestions";
    itemsSnap = await db
      .collection(itemCollection)
      .where("lessonId", "==", lessonId)
      .get();
    if (itemsSnap.empty) {
      throw new HttpsError("failed-precondition", "Bài học chưa có nội dung để hoàn thành.");
    }
  }

  const answers = answersFrom(data);
  const totalQuestions = isNewFlow ? activitiesSnap.size : itemsSnap.size;
  let correctAnswers = 0;

  if (isNewFlow) {
    const reqCorrect = data.correctAnswers != null ? readNumber(data.correctAnswers) : -1;
    if (reqCorrect >= 0) {
      correctAnswers = reqCorrect;
    } else {
      correctAnswers = Object.values(answers).filter((v) => 
        v === "correct" || v === "done" || v === "CORRECT" || v === "DONE"
      ).length;
    }
  } else {
    correctAnswers = isFlashcard
      ? totalQuestions
      : itemsSnap.docs.filter((doc: any) => `${doc.data().correctOption ?? "A"}` === answers[doc.id]).length;
  }

  const score = data.score != null ? readNumber(data.score) : (totalQuestions === 0 ? 0 : Math.round((correctAnswers / totalQuestions) * 100));
  const activityType = isNewFlow ? "ACTIVITY" : (isFlashcard ? "FLASHCARD" : lessonType);
  const legacyProgressLessonId = isFlashcard ? `${lessonId}_flashcard` : lessonId;
  const skillTags = Array.isArray(lesson.skillTags)
    ? lesson.skillTags.map((item) => `${item}`).filter((item) => item.length > 0)
    : [];

  const completion = await db.runTransaction(async (transaction) => {
    const lessonProgressRef = db.collection("lessonProgress").doc(`${userId}_${childId}_${lessonId}`);
    const lessonProgressDoc = await transaction.get(lessonProgressRef);
    const legacyProgressQuery = db
      .collection("progress")
      .where("userId", "==", userId)
      .where("childId", "==", childId)
      .where("lessonId", "==", legacyProgressLessonId)
      .limit(1);
    const legacyProgressSnap = await transaction.get(legacyProgressQuery);
    const alreadyCompleted =
      lessonProgressDoc.data()?.status === "COMPLETED" || !legacyProgressSnap.empty;

    const progressPayload = {
      userId,
      childId,
      lessonId: legacyProgressLessonId,
      activityType,
      status: "COMPLETED",
      score,
      totalQuestions,
      correctAnswers,
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const progressRef = legacyProgressSnap.empty
      ? db.collection("progress").doc(`${userId}_${childId}_${legacyProgressLessonId}`)
      : legacyProgressSnap.docs[0].ref;
    transaction.set(progressRef, {
      ...progressPayload,
      createdAt: legacyProgressSnap.empty ? serverTimestamp() : legacyProgressSnap.docs[0].data().createdAt ?? serverTimestamp(),
    }, { merge: true });

    const existingLessonProgress = lessonProgressDoc.data();
    transaction.set(lessonProgressRef, {
      userId,
      childId,
      lessonId,
      status: "COMPLETED",
      bestScore: Math.max(readNumber(existingLessonProgress?.bestScore), score),
      attemptsCount: admin.firestore.FieldValue.increment(1),
      completedAt: existingLessonProgress?.completedAt ?? serverTimestamp(),
      lastAttemptAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdAt: existingLessonProgress?.createdAt ?? serverTimestamp(),
    }, { merge: true });

    if (!isNewFlow) {
      for (const itemDoc of itemsSnap.docs) {
        const item = itemDoc.data();
        const answer = isFlashcard ? "REVIEWED" : answers[itemDoc.id] ?? "";
        const correct = isFlashcard || `${item.correctOption ?? "A"}` === answer;
        const attemptRef = db.collection("activityAttempts").doc();
        transaction.set(attemptRef, {
          userId,
          childId,
          lessonId,
          activityId: itemDoc.id,
          sourceCollection: itemCollection,
          activityType,
          answerPayload: isFlashcard ? { reviewed: true } : { selectedOption: answer },
          result: correct ? "CORRECT" : "WRONG",
          score: correct ? 1 : 0,
          skillTags,
          createdAt: serverTimestamp(),
        });
      }
    }

    return { alreadyCompleted };
  });

  let xpGained = 0;
  if (!completion.alreadyCompleted) {
    xpGained = await awardXp(
      userId,
      childId,
      isFlashcard ? 5 : 20,
      isFlashcard ? "Hoàn thành ôn tập thẻ học" : `Hoàn thành bài học: ${lesson.title ?? ""}`,
    );
  }
  if (isFlashcard) {
    await updateDailyMissionProgress(userId, childId, "REVIEW_FLASHCARD");
  } else {
    await updateDailyMissionProgress(userId, childId, "COMPLETE_LESSON");
    if (lessonType === "MATH") await updateDailyMissionProgress(userId, childId, "COMPLETE_MATH");
    if (lessonType === "DIALOGUE") await updateDailyMissionProgress(userId, childId, "COMPLETE_DIALOGUE");
  }

  return {
    score,
    totalQuestions,
    correctAnswers,
    ...await rewardSummary(userId, childId, xpGained),
  };
});

export const submitActivityAttempt = onCall({ region }, async (request) => {
  const userId = requireUid(request);
  const data = dataOf(request);
  const childId = readString(data.childId, "childId");
  const lessonId = readString(data.lessonId, "lessonId");
  await assertOwnedChild(userId, childId);

  const attemptRef = await db.collection("activityAttempts").add({
    userId,
    childId,
    lessonId,
    activityId: optionalString(data.activityId) ?? null,
    activityType: optionalString(data.activityType) ?? "LEGACY",
    answerPayload: data.answerPayload ?? null,
    result: optionalString(data.result) ?? "RECORDED",
    score: readNumber(data.score),
    durationSec: readNumber(data.durationSec),
    skillTags: Array.isArray(data.skillTags) ? data.skillTags.map((t: any) => String(t)) : [],
    createdAt: serverTimestamp(),
  });

  return { ok: true, attemptId: attemptRef.id };
});

export const claimDailyMissionReward = onCall({ region }, async (request) => {
  const userId = requireUid(request);
  const data = dataOf(request);
  const childId = readString(data.childId, "childId");
  const missionId = readString(data.missionId, "missionId");
  await assertOwnedChild(userId, childId);

  const missionDoc = await db.collection("dailyMissions").doc(missionId).get();
  if (!missionDoc.exists) {
    throw new HttpsError("not-found", "Nhiệm vụ không tồn tại.");
  }
  const progressSnap = await db
    .collection("userMissionProgress")
    .where("userId", "==", userId)
    .where("childId", "==", childId)
    .where("missionId", "==", missionId)
    .where("date", "==", todayKey())
    .limit(1)
    .get();
  if (progressSnap.empty) {
    throw new HttpsError("failed-precondition", "Nhiệm vụ chưa hoàn thành.");
  }
  const progressRef = progressSnap.docs[0].ref;

  await db.runTransaction(async (transaction) => {
    const fresh = await transaction.get(progressRef);
    const progress = fresh.data();
    if (!fresh.exists || progress?.isCompleted !== true) {
      throw new HttpsError("failed-precondition", "Nhiệm vụ chưa hoàn thành.");
    }
    if (progress.rewardClaimed === true) {
      throw new HttpsError("failed-precondition", "Phần thưởng đã được nhận.");
    }
    transaction.set(progressRef, {
      rewardClaimed: true,
      rewardClaimedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });

  const mission = missionDoc.data() ?? {};
  const xpGained = await awardXp(
    userId,
    childId,
    readNumber(mission.rewardXp),
    `Nhận thưởng nhiệm vụ hàng ngày: "${mission.title ?? ""}"`,
  );
  return {
    xpGained,
    levelStats: levelStats(await totalXp(userId, childId)),
  };
});

async function assertAdmin(userId: string) {
  const userDoc = await db.collection("users").doc(userId).get();
  if (!userDoc.exists || userDoc.data()?.role !== "ADMIN" || userDoc.data()?.isActive !== true) {
    throw new HttpsError("permission-denied", "Bạn không có quyền quản trị viên.");
  }
}

export const adminGrantPremium = onCall({ region }, async (request) => {
  const callerId = requireUid(request);
  await assertAdmin(callerId);

  const data = dataOf(request);
  const userId = readString(data.userId, "userId");
  const plan = readString(data.plan, "plan");
  
  if (plan !== "PREMIUM" && plan !== "TRIAL") {
    throw new HttpsError("invalid-argument", "Gói subscription không hợp lệ.");
  }

  let expiresAt: admin.firestore.Timestamp | null = null;
  if (data.expiresAt) {
    const expiresMillis = Number(data.expiresAt);
    if (Number.isFinite(expiresMillis)) {
      expiresAt = admin.firestore.Timestamp.fromMillis(expiresMillis);
    }
  }

  if (plan === "TRIAL" && !expiresAt) {
    throw new HttpsError("invalid-argument", "Gói TRIAL bắt buộc phải cấu hình ngày hết hạn.");
  }

  if (expiresAt && expiresAt.toDate().getTime() < Date.now()) {
    throw new HttpsError("invalid-argument", "Ngày hết hạn phải ở tương lai.");
  }

  const entitlementFlags = {
    premiumContent: true,
    voiceQuiz: true,
    advancedReports: true,
    premiumNpcs: true,
    ...(data.entitlements as Record<string, boolean> ?? {})
  };

  const batch = db.batch();

  // 1. Update user subscriptionSummary
  const userRef = db.collection("users").doc(userId);
  batch.set(userRef, {
    subscriptionSummary: {
      plan,
      status: "ACTIVE",
      expiresAt,
      entitlements: entitlementFlags,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }
  }, { merge: true });

  // 2. Create subscription record
  const subRef = db.collection("subscriptions").doc();
  batch.set(subRef, {
    userId,
    plan,
    status: "ACTIVE",
    provider: "MANUAL",
    startedAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt,
    entitlementFlags,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 3. Create mock transaction record
  const transRef = db.collection("transactions").doc();
  batch.set(transRef, {
    userId,
    provider: "MANUAL",
    productId: plan === "PREMIUM" ? "premium_manual_grant" : "trial_manual_grant",
    amount: 0,
    currency: "VND",
    status: "SUCCESS",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return { ok: true, subscriptionId: subRef.id };
});

export const adminRevokePremium = onCall({ region }, async (request) => {
  const callerId = requireUid(request);
  await assertAdmin(callerId);

  const data = dataOf(request);
  const userId = readString(data.userId, "userId");

  const batch = db.batch();

  // 1. Update user summary
  const userRef = db.collection("users").doc(userId);
  batch.set(userRef, {
    subscriptionSummary: {
      plan: "FREE",
      status: "CANCELED",
      expiresAt: null,
      entitlements: {
        premiumContent: false,
        voiceQuiz: false,
        advancedReports: false,
        premiumNpcs: false,
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }
  }, { merge: true });

  // 2. Update active subscription doc if any
  const subQuery = await db.collection("subscriptions")
    .where("userId", "==", userId)
    .where("status", "==", "ACTIVE")
    .get();

  for (const doc of subQuery.docs) {
    batch.update(doc.ref, {
      status: "CANCELED",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();

  return { ok: true };
});

export const demoUpgradePremium = onCall({ region }, async (request) => {
  const userId = requireUid(request);

  if (!ENABLE_DEMO_PREMIUM_UPGRADE) {
    throw new HttpsError("failed-precondition", "Chức năng demo tự kích hoạt premium hiện đang tắt.");
  }

  const expiresAt = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  );

  const entitlementFlags = {
    premiumContent: true,
    voiceQuiz: true,
    advancedReports: true,
    premiumNpcs: true,
  };

  const batch = db.batch();

  // 1. Update user summary
  const userRef = db.collection("users").doc(userId);
  batch.set(userRef, {
    subscriptionSummary: {
      plan: "PREMIUM",
      status: "ACTIVE",
      expiresAt,
      entitlements: entitlementFlags,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }
  }, { merge: true });

  // 2. Create subscription
  const subRef = db.collection("subscriptions").doc();
  batch.set(subRef, {
    userId,
    plan: "PREMIUM",
    status: "ACTIVE",
    provider: "MOCK",
    startedAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt,
    entitlementFlags,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 3. Create mock transaction
  const transRef = db.collection("transactions").doc();
  batch.set(transRef, {
    userId,
    provider: "MOCK",
    productId: "premium_demo_upgrade",
    amount: 0,
    currency: "VND",
    status: "SUCCESS",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return { ok: true, expiresAt: expiresAt.toMillis() };
});

function getLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function getSimilarity(a: string, b: string): number {
  const distance = getLevenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1.0;
  return 1.0 - distance / maxLength;
}

export const submitVoiceAnswer = onCall({ region }, async (request) => {
  const userId = requireUid(request);
  const data = dataOf(request);
  const childId = readString(data.childId, "childId");
  const lessonId = readString(data.lessonId, "lessonId");
  const activityId = readString(data.activityId, "activityId");
  const audioBase64 = data.audioBase64 as string | undefined;
  const durationSec = readNumber(data.durationSec, 3);
  const mockTranscriptInput = data.mockTranscript as string | undefined;
  const locale = (data.locale as string | undefined) ?? "vi-VN";
  logger.info(`submitVoiceAnswer called with childId: ${childId}, locale: ${locale}`);

  await assertOwnedChild(userId, childId);

  // Load activity
  const activityDoc = await db.collection("activities").doc(activityId).get();
  if (!activityDoc.exists) {
    throw new HttpsError("not-found", "Hoạt động không tồn tại.");
  }
  const activity = activityDoc.data();
  if (!activity) {
    throw new HttpsError("not-found", "Hoạt động rỗng.");
  }

  if (activity.activityType !== "VOICE_ANSWER") {
    throw new HttpsError("failed-precondition", "Hoạt động này không phải trả lời bằng giọng nói.");
  }

  // Check entitlement (unconditional premium voice quiz check)
  const userDoc = await db.collection("users").doc(userId).get();
  if (!userDoc.exists) {
    throw new HttpsError("not-found", "Không tìm thấy người dùng.");
  }
  const summary = userDoc.data()?.subscriptionSummary;
  const now = Date.now();
  let isSubscriptionActive = false;
  if (summary && (summary.plan === "PREMIUM" || summary.plan === "TRIAL") && summary.status === "ACTIVE") {
    let expTime = 0;
    if (summary.expiresAt) {
      if (typeof summary.expiresAt.toMillis === "function") {
        expTime = summary.expiresAt.toMillis();
      } else if (summary.expiresAt._seconds) {
        expTime = summary.expiresAt._seconds * 1000;
      } else {
        expTime = new Date(summary.expiresAt).getTime();
      }
    }
    if (!summary.expiresAt || expTime > now) {
      isSubscriptionActive = true;
    }
  }

  if (!isSubscriptionActive || !summary?.entitlements?.voiceQuiz) {
    throw new HttpsError("permission-denied", "Tính năng này yêu cầu gói Premium.");
  }

  // Check payload size and duration limits
  if (audioBase64 && audioBase64.length > 1.5 * 1024 * 1024) {
    throw new HttpsError("invalid-argument", "Kích thước tệp âm thanh vượt quá giới hạn.");
  }
  if (durationSec > 6) {
    throw new HttpsError("invalid-argument", "Thời lượng ghi âm tối đa là 5 giây.");
  }

  // Normalization helpers
  const removeAccents = (str: string): string => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
  };

  const normalizeText = (str: string): string => {
    return str
      .toLowerCase()
      .trim()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
      .replace(/\s+/g, " ");
  };

  // Resolve transcript from Mock or Real provider
  let transcript = "";
  let providerUsed = "mock";
  const confidence = 1.0;

  const VOICE_PROVIDER = process.env.VOICE_PROVIDER || "mock";
  const mockEnabled = ENABLE_MOCK_VOICE_PROVIDER;

  if (VOICE_PROVIDER === "mock") {
    if (mockEnabled && mockTranscriptInput) {
      transcript = mockTranscriptInput;
      providerUsed = "mock";
    } else {
      // Default mock fallback based on first accepted answer or default
      const acceptedAnswersList = (activity.acceptedAnswers as string[]) || [];
      if (acceptedAnswersList.length > 0) {
        transcript = acceptedAnswersList[0];
      } else {
        transcript = "xin chào";
      }
      providerUsed = "mock_default";
    }
  } else {
    // Skeletons for Real providers
    if (VOICE_PROVIDER === "openai" && process.env.OPENAI_API_KEY) {
      // openai transcription code placeholder
      providerUsed = "openai";
      transcript = "OpenAI STT placeholder";
    } else if (VOICE_PROVIDER === "google") {
      providerUsed = "google";
      transcript = "Google STT placeholder";
    } else if (VOICE_PROVIDER === "azure") {
      providerUsed = "azure";
      transcript = "Azure STT placeholder";
    } else {
      // Fallback
      transcript = "Không cấu hình provider STT";
      providerUsed = "error_fallback";
    }
  }

  const normTranscript = normalizeText(transcript);
  const cleanTranscriptNoAccent = removeAccents(normTranscript);

  if (!normTranscript || normTranscript === "") {
    // Empty transcription or no speech detected
    const result = "NO_SPEECH_DETECTED";
    const feedbackText = "Mimi chưa nghe rõ con nói gì, con hãy nói to hơn một chút nhé!";
    
    await db.collection("voiceUsageLogs").add({
      userId,
      childId,
      lessonId,
      activityId,
      provider: providerUsed,
      type: "STT",
      durationSec,
      transcriptLength: 0,
      result,
      status: "SUCCESS",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      transcript,
      result,
      feedbackText,
      confidence: 0.0,
      provider: providerUsed,
    };
  }

  const acceptedList = (activity.acceptedAnswers as string[] || []).map(normalizeText);
  const almostList = (activity.almostAnswers as string[] || []).map(normalizeText);

  const acceptedListNoAccent = acceptedList.map(removeAccents);
  const almostListNoAccent = almostList.map(removeAccents);

  // Normalization for numbers and prefixes
  const normalizeNumberText = (text: string): string => {
    let clean = removeAccents(text).toLowerCase().trim();
    if (clean.startsWith("bang ")) {
      clean = clean.substring(5).trim();
    }
    const wordToDigit: Record<string, string> = {
      "khong": "0", "mot": "1", "hai": "2", "ba": "3", "bon": "4",
      "nam": "5", "sau": "6", "bay": "7", "tam": "8", "chin": "9", "muoi": "10"
    };
    if (wordToDigit[clean] !== undefined) {
      return wordToDigit[clean];
    }
    return clean;
  };

  const normTranscriptNum = normalizeNumberText(normTranscript);
  const acceptedListNum = acceptedList.map(normalizeNumberText);
  const almostListNum = almostList.map(normalizeNumberText);

  let result: "CORRECT" | "ALMOST" | "WRONG" = "WRONG";

  // Match accepted
  const isCorrect = 
    acceptedList.includes(normTranscript) || 
    acceptedListNoAccent.includes(cleanTranscriptNoAccent) ||
    acceptedListNum.includes(normTranscriptNum);

  if (isCorrect) {
    result = "CORRECT";
  } else {
    // Match almost
    const isAlmost = 
      almostList.includes(normTranscript) || 
      almostListNoAccent.includes(cleanTranscriptNoAccent) ||
      almostListNum.includes(normTranscriptNum);
    if (isAlmost) {
      result = "ALMOST";
    } else {
      // Fuzzy match similarity check with accepted
      let highestSimilarity = 0;
      for (const accepted of acceptedList) {
        const sim = getSimilarity(normTranscript, accepted);
        if (sim > highestSimilarity) {
          highestSimilarity = sim;
        }
      }
      for (const acceptedNoAccent of acceptedListNoAccent) {
        const sim = getSimilarity(cleanTranscriptNoAccent, acceptedNoAccent);
        if (sim > highestSimilarity) {
          highestSimilarity = sim;
        }
      }

      if (highestSimilarity >= 0.8) {
        result = "ALMOST";
      }
    }
  }

  // Get matching feedback text
  let feedbackText = "";
  if (result === "CORRECT") {
    feedbackText = activity.feedback?.correct || "Đúng rồi! Bé giỏi quá!";
  } else if (result === "ALMOST") {
    feedbackText = activity.feedback?.almost || "Gần đúng rồi, con nói lại rõ hơn chút nhé!";
  } else {
    feedbackText = activity.feedback?.wrong || "Chưa chính xác rồi. Bé thử lại nhé!";
  }

  // Write usage logs
  await db.collection("voiceUsageLogs").add({
    userId,
    childId,
    lessonId,
    activityId,
    provider: providerUsed,
    type: "STT",
    durationSec,
    transcriptLength: transcript.length,
    result,
    status: "SUCCESS",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    transcript,
    result,
    feedbackText,
    confidence,
    provider: providerUsed,
  };
});
