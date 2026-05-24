# Parent & Child Application Flow

This document details the step-by-step user flow within the parent mobile application, highlighting routing checkpoints, profile requirements, and study mechanics.

---

## Step 1: Parent Registration & Verification
1. **Welcome**: The parent enters the app and is greeted by the mascot introduction and the product disclaimer.
2. **Registration/Login**: The parent fills in credentials. If registering, they are prompted to check the disclaimer:
   > *"Tôi hiểu ứng dụng chỉ hỗ trợ phụ huynh đồng hành cùng trẻ tại nhà, không chẩn đoán, không điều trị và không thay thế chuyên gia."*
3. **Email Verification**:
   - If `REQUIRE_EMAIL_VERIFICATION` is enabled, the app locks and routes to `VerifyEmailScreen` until the verification link is clicked.
   - If disabled (for testing/demo), the parent goes to the home page but a **warning banner** is permanently displayed at the top until verified.

---

## Step 2: Child Profile Creation (Enforced Guard)
1. If the parent does not have at least one child profile in Firestore, the application blocks access to all sections and redirects the user directly to **Hồ sơ con** (Child Profile screen).
2. The parent input:
   - Child Name (min 2 characters).
   - Age (validated from 1 to 10; ages outside 2-6 prompt a warning recommendation dialog).
   - Gender.
   - Notes.
3. Upon saving, the navigation guard unlocks, allowing access to the main dashboard.

---

## Step 3: Home Dashboard
The parent/child sees:
- Active child profile badge (name, age).
- Study summary: current XP points, streak logs, and unlocked Mascot count.
- Mascot interaction section: Displays the active Mascot from their collection and its welcome speech bubble dialogue.
- Redirection buttons: Study Path, QR Scanner, Mascot Collection, Progress Charts, Parent Dashboard, Settings.

---

## Step 4: Mascot QR Unlocking
1. The parent clicks **Quét mã QR mở khóa** and scans the QR code printed on the physical toys or flashcards (or inputs the code manually).
2. The scanner validates the active child profile, then calls `qrApi.unlock`.
3. If successful, it displays a congratulatory modal showing the Mascot card, its name, and speech dialogue, with a shortcut to view the Mascot Collection.
4. Handles invalid code, inactive code, exhausted uses, and deleted mascot conditions gracefully.

---

## Step 5: Progressive Learning Path
1. The parent clicks **Lộ trình học**.
2. Shows lessons ordered by `orderIndex`.
3. Progressive lock logic is applied: Lesson N is locked until Lesson N-1 status is `"COMPLETED"`.
4. The child completes Math questions or Dialogues:
   - Selects options.
   - Presses **Kiểm tra** (Check). Options are locked. Shows visual correction highlights (Green/Red) and explanations.
   - Presses **Tiếp tục** (Continue) to advance or submit score.
5. On completion:
   - Triggers XP logging (+10 XP per correct answer) and updates streak records.
   - **Anti-Cheating Safeguard**: If the lesson was already completed by the child, it is logged as a review session, yielding a flat `2 XP` instead of duplicating full rewards.
6. The child can then flip cards on the linked **Thẻ học (Flashcards)** page to study vocabulary.
