# Business Logic Audit Report

Audit date: 2026-05-24  
Workspace: `/Users/huy/Documents/project_ha`  
Mode: read-only audit, no schema/code refactor. Only this report file was created intentionally.

## 1. Executive Summary

Current state: **prototype / early MVP**, not near production.

The project has a working Firebase-first skeleton: mobile Flutter app, React admin web, Firestore rules, Firebase Storage rules, OTP email Cloud Function, CSV/Excel import, QR unlock, NPC collection, simple lessons, progress, XP/streak/badges/missions, and a parent dashboard.

However, the product logic is still much closer to a **generic quiz + reward app** than a structured home-support product for children with developmental difficulties. The biggest gap is that the domain model does not encode child difficulty categories, learning goals, programs, paths, levels, skills, activity types, premium access, voice quiz, or report-grade progress.

Top 5 severe issues:

1. **Personalization is mostly absent**: child profile only stores `name`, `age`, `gender`, `note`; learning content is not filtered by difficulty category, goal, skill, level, or child needs.
2. **No true program/path model**: mobile shows active lessons sorted by `orderIndex`; the map section labels are hard-coded and do not represent actual programs or learning paths.
3. **Security rules allow client-side tampering of learning state**: parents can directly write progress, XP logs, streaks, badges, mission progress, and unlocked NPC docs. A malicious client can fake rewards/progress/premium-like outcomes.
4. **Premium/payment/subscription is not implemented**: there are no subscriptions, transactions, entitlements, paywall, restore purchase, or premium access fields.
5. **AI voice quiz is not implemented**: no STT/TTS provider, no accepted answers, no backend proxy, no voice usage/cost control. `MicrophoneButton` exists but is unused.

Product logic checklist:

| Question | Status | Evidence / related files |
|---|---|---|
| App phục vụ nhóm trẻ nào? | Có nhưng chưa đủ | README says children 2-6 and at-home support; model does not encode difficulty categories. `README.md`, `docs/user-flow.md`, `mobile-flutter/lib/models/child_profile.dart` |
| Trẻ được phân loại theo tiêu chí gì? | Thiếu | Only age/gender/note. `mobile-flutter/lib/models/child_profile.dart:3` |
| Phụ huynh nhập gì để đề xuất lộ trình? | Có nhưng sai logic | UI says personalization, but asks only name/age/gender/note. `mobile-flutter/lib/features/child/screens/child_profile_screen.dart:91` |
| Có chia loại khó khăn/chậm phát triển không? | Thiếu | No enum/field for speech delay, attention, cognition, social communication, etc. |
| Có chia mục tiêu học tập không? | Thiếu | No learning goal field in child/profile/content. |
| Có gói học/lộ trình học không? | Thiếu | No `programs` or `learningPaths`; lesson list only. |
| Mỗi lộ trình gồm loại bài nào? | Có nhưng chưa hợp lý | Lesson types exist, but not inside path/program. `mobile-flutter/lib/models/lesson.dart:4` |
| Bài học chia level thế nào? | Thiếu | XP level exists, learning level does not. |
| Học xong mở bài tiếp theo ra sao? | Có nhưng demo bypass | Sequential lock exists only by lesson order; default `ALLOW_ALL_LESSONS_FOR_DEMO=true`. `mobile-flutter/lib/features/learning_path/widgets/learning_map.dart:60`, `mobile-flutter/lib/core/config/app_config.dart:6` |
| App biết trẻ tiến bộ bằng cách nào? | Có nhưng yếu | Tracks score/correct count per lesson, not skill/goal/attempt quality. `mobile-flutter/lib/models/progress.dart` |
| Parent dashboard có ý nghĩa không? | Có nhưng nhiều mock | Progress count real; skill bars are hard-coded from completed count. `mobile-flutter/lib/features/parent_dashboard/screens/parent_dashboard_screen.dart:165` |
| Admin tạo nội dung theo nghiệp vụ? | Có nhưng CRUD rời rạc | Admin can CRUD media/NPC/QR/lesson/question/dialogue/flashcard/badge/mission, but no program/path/goal workflow. `admin-web/src/pages/LessonsPage.tsx:296` |
| NPC có vai trò thật không? | Có nhưng yếu | NPC has image/name/description/default dialogue; no skill/path/context dialogue. `mobile-flutter/lib/models/npc.dart` |
| Premium/payment khóa/mở gì? | Thiếu | No subscription/payment/accessType found. |
| AI voice hoạt động thế nào? | Thiếu | No STT/TTS/voice answer model; dialogue audio button only plays tap sound. `mobile-flutter/lib/features/lessons/screens/dialogue_lesson_screen.dart:119` |
| QR/NFC mở gì? | Có nhưng hẹp | QR only unlocks NPC; no NFC package or activation type. `mobile-flutter/lib/features/qr_unlock/data/activation_repository.dart:37` |
| Dữ liệu progress đủ báo cáo không? | Có nhưng chưa đủ | No skill result, attempt log, duration, parent mark, recommendation basis. |
| Logic phù hợp trẻ cần hỗ trợ phát triển không? | Có nhưng chưa đạt | Content is mostly simple quiz/flashcard; no category/goal/support-level adaptation. |

## 2. Current System Map

Mobile app modules:

- Auth/register/login/OTP/profile: `mobile-flutter/lib/features/auth`, `mobile-flutter/lib/features/profile`.
- Child profile: `mobile-flutter/lib/features/child`, `mobile-flutter/lib/models/child_profile.dart`.
- Home/dashboard shell: `mobile-flutter/lib/features/home`, `mobile-flutter/lib/core/routes/app_router.dart`.
- Learning map and lesson detail: `mobile-flutter/lib/features/learning_path`.
- Lesson renderers: math, dialogue, flashcard screens under `mobile-flutter/lib/features/lessons/screens`.
- QR unlock: `mobile-flutter/lib/features/qr_unlock`.
- NPC collection/detail: `mobile-flutter/lib/features/npcs`.
- Gamification: `mobile-flutter/lib/features/gamification`.
- Parent dashboard: `mobile-flutter/lib/features/parent_dashboard`.
- Accessibility toggles: `mobile-flutter/lib/core/services/app_state.dart`, `mobile-flutter/lib/features/profile/screens/profile_screen.dart`.

Admin web modules:

- Admin auth guard and layout: `admin-web/src/context/AuthContext.tsx`, `admin-web/src/components/ProtectedRoute.tsx`, `admin-web/src/App.tsx`.
- Dashboard: `admin-web/src/pages/DashboardPage.tsx`.
- Read-only users/children/progress: `UsersPage.tsx`, `ChildrenPage.tsx`, `ProgressPage.tsx`, `CrudPage.tsx`.
- Media library: `admin-web/src/pages/MediaPage.tsx`, `admin-web/src/services/mediaService.ts`.
- NPCs: `admin-web/src/pages/NPCsPage.tsx`.
- QR codes: `admin-web/src/pages/QRCodesPage.tsx`.
- Lessons and content: `LessonsPage.tsx`, `MathQuestionsPage.tsx`, `DialoguesPage.tsx`, `FlashcardsPage.tsx`.
- Gamification config: `BadgesPage.tsx`, `DailyMissionsPage.tsx`.
- Import: `admin-web/src/components/import`, `admin-web/src/services/batchImportService.ts`.

Firebase/database modules:

- Firestore rules: `firebase/firestore.rules`.
- Storage rules: `firebase/storage.rules`.
- Indexes: `firebase/firestore.indexes.json`.
- Cloud Function for OTP email: `functions/src/index.ts`.
- Root scripts use Firebase Admin: `scripts/*.ts`.

Backend/scripts:

- `backend/` is explicitly legacy/deprecated in `backend/DEPRECATED.md`.
- `backend/prisma/schema.prisma` mirrors the old quiz/NPC schema and lacks new product concepts.
- `scripts/seed-learning-content.ts` seeds NPCs, QR codes, badges, missions, lessons, math questions, dialogues, flashcards, plus unused `spellingActivities` and `rhymeChallenges`.

Unable to inspect:

- Live Firestore documents and production Firebase project state were not queried. This audit inspected repository files, templates, seed scripts, and build/analyze output.
- GitNexus graph index was unavailable for `project_ha`; only an unrelated repo was indexed, so source files were inspected directly.

## 3. Major Business Logic Problems

| ID | Module | Problem | Why it is wrong | Impact | Severity | Suggested Fix | Related files/screens |
|---|---|---|---|---|---|---|---|
| BL-01 | Child profile | Child profile is too thin | Development-support product needs difficulty category, learning goals, support level, daily duration, co-learning mode, interests, accessibility. | Cannot personalize paths or reports. | Critical | Add child profile fields and onboarding flow; use them in content matching. | `mobile-flutter/lib/models/child_profile.dart:3`, `ChildProfileScreen.dart:91` |
| BL-02 | Learning path | No `programs` / `learningPaths` / real levels | Sorted lessons are not a lộ trình. Hard-coded map sections do not map to data. | Admin cannot build structured programs; parent cannot choose path. | Critical | Introduce programs, paths, pathItems, learning levels, skill tags. | `LessonRepository.listLessons`, `LearningMap` |
| BL-03 | Lesson model | Lesson type is not activity type | Current `lessons` point to separate `mathQuestions`, `dialogues`, `flashcards`. Activities are not unified. | Hard to support voice, matching, daily-life, parent-marked tasks. | High | Move to `lessons` + `activities` model while maintaining adapters for old content. | `lesson.dart`, `math_question.dart`, `dialogue.dart`, `flashcard.dart` |
| BL-04 | Content taxonomy | Missing difficulty categories, goals, skills | Lessons cannot target SPEECH_DELAY, ATTENTION_DIFFICULTY, etc. | Product does not serve promised audience. | Critical | Add enums/config collections and tag all content. | Admin `LessonsPage.tsx`, import templates |
| BL-05 | Progress/reporting | Progress records are too coarse | Only score/total/correct/status; no attempt, skill result, duration, assist mode, parent mark. | Parent dashboard cannot explain progress meaningfully. | High | Add `activityAttempts`, skill rollups, weekly report snapshots. | `progress.dart`, `ParentDashboardScreen.dart` |
| BL-06 | Parent dashboard | Skill progress is hard-coded | Values become `.72`, `.48`, `.36` when completed > 0. | Misleading parent insight. | High | Compute by skill tags and activity results; show "insufficient data" when needed. | `ParentDashboardScreen.dart:165` |
| BL-07 | NPC | Mascot is mostly decorative | NPC has static dialogue and image only. No path/skill/personality/context role. | QR/NPC feature has weak product value. | Medium | Add NPC role, skillTags, dialogueTemplates, unlock benefits. | `npc.dart`, `NPCsPage.tsx`, `MascotMessageBubble` |
| BL-08 | QR/NFC | QR only unlocks NPC and has no activation type | No LESSON/PATH/REWARD activation and no NFC. | Physical product unlock cannot scale. | High | Replace/extend `qrCodes` with `activationCodes` and redemption log. | `qr_code.dart`, `ActivationRepository` |
| BL-09 | AI voice | Voice quiz absent | No data model/provider/backend/usage log; microphone widget unused. | Cannot deliver AI voice quiz claim. | Critical | Add voice activity model and Cloud Function proxy before UI. | `microphone_button.dart`, search results |
| BL-10 | Premium/payment | Premium absent | No plan/status/accessType/subscription/transaction. | Monetization and content gating cannot work. | Critical | Add entitlements and backend-verified subscription/payment flow. | No matching code found |
| BL-11 | Firestore rules | User can forge learning state | Owners can create/update progress, xpLogs, streaks, userBadges, userMissionProgress. | Cheating, fake reports, broken paid entitlements later. | Critical | Move authoritative writes to Cloud Functions; tighten rules to read-only for derived state. | `firebase/firestore.rules:97` |
| BL-12 | Firestore rules | User can bypass QR unlock | `userUnlockedNpcs` create only checks `userId`, not valid activation transaction. | Any signed-in user can create unlocked NPC docs directly. | Critical | Allow unlock creation only through Cloud Function/Admin; validate child ownership and target. | `firebase/firestore.rules:87` |
| BL-13 | QR rules | Any signed-in user can increment QR `usedCount` | Rule allows usedCount +1 without maxUses/active/target validation. | Denial of service by exhausting QR uses. | High | Use server transaction only; disallow client QR updates. | `firebase/firestore.rules:58` |
| BL-14 | User rules | Owner can update sensitive user fields | Owner update only preserves role; can set `emailVerified`, `isActive`, other fields. | Email verification and account state can be tampered. | High | Limit owner updates to allowed profile fields only. | `firebase/firestore.rules:28` |
| BL-15 | Dialogue audio | Dialogue screen does not play remote audio | `AudioButton` with `audioUrl` calls `SoundService.play('tap')`, not network audio. | Listening lessons are not actually listening. | High | Add network audio playback for dialogue/flashcard audio. | `DialogueLessonScreen.dart:119`, `SoundService.dart:23` |
| BL-16 | Spelling/rhyme | Seed creates collections mobile does not render | `spellingActivities` / `rhymeChallenges` are seeded but mobile routes spelling/rhyme to math renderer. | Inconsistent data and feature claims. | Medium | Either migrate into unified activities or remove unused collections. | `scripts/seed-learning-content.ts`, `LessonDetailScreen.dart` |
| BL-17 | QA readiness | Flutter toolchain fails analyze/test | Analyze crashes; test cannot find `flutter_tester`. | Mobile quality cannot be verified in current environment. | High | Repair Flutter SDK/artifacts before dev handoff. | QA output, `mobile-flutter/flutter_01.log` |
| BL-18 | Secrets | Service account private key exists in workspace | `firebase-service-account.json` is ignored and not tracked, but present locally with private key. | Critical if workspace is shared or zipped. | Critical | Move outside repo/workspace, rotate key if exposure is possible. | `.gitignore`, `firebase-service-account.json` |

## 4. Missing Core Product Concepts

| Concept | Exists? | Current status | Problem | Recommendation |
|---|---:|---|---|---|
| child difficulty category | No | Not in child/content/admin. | No way to support speech delay, attention, cognitive, emotion, etc. | Add enum/multi-select fields to children and content tags. |
| learning goals | No | Not in profile or lessons. | Cannot match LISTENING/SPEAKING/OBJECT_RECOGNITION/etc. | Add goal tags to child profile, program/path, lesson/activity. |
| program/path | No | UI calls lesson list "Lộ trình". | No parent/admin workflow for structured learning. | Add `programs`, `learningPaths`, `pathItems`. |
| level | Partial | XP level exists; learning level absent. | Gamification level is confused with educational level. | Add lesson/path level enum: BEGINNER, BASIC, INTERMEDIATE. |
| skill | No | Parent dashboard labels skills but data lacks skill tags. | Skill reports are not evidence-based. | Add `skillTags` on activities and aggregate skill progress. |
| activity type | Partial | `progress.activityType` is string; no activity model. | Renderer cannot scale beyond A/B/C/D. | Add `activities` with typed config. |
| premium access | No | No accessType, plan, entitlement. | No free/premium gating. | Add `accessType` to programs/paths/lessons/NPC/voice; add subscription summary. |
| voice quiz config | No | No STT/TTS fields. | Voice feature cannot work. | Add `voiceConfig` under activities plus backend provider. |
| NPC role | Partial | Static default dialogue and image. | Mascot is not pedagogical. | Add `role`, `personality`, `dialogueTemplates`, `skillTags`, `pathIds`. |
| parent report | Partial | Dashboard exists but limited. | Some metrics are mock. | Add weekly report and recommendation model based on child profile/progress. |
| activation code type | No | `qrCodes` unlock only `npcId`. | Cannot unlock lesson/path/reward/NFC. | Rename/extend to `activationCodes` with `activationType`. |

## 5. Admin Panel Audit

What admin can do now:

- View dashboard counts and popular lessons: `admin-web/src/pages/DashboardPage.tsx`.
- View users and child profiles read-only: `UsersPage.tsx`, `ChildrenPage.tsx`.
- CRUD media assets with URL-based media library: `MediaPage.tsx`, `mediaService.ts`.
- CRUD NPCs with image/default dialogue and preview: `NPCsPage.tsx`.
- CRUD QR codes linked to NPCs, print/download QR: `QRCodesPage.tsx`.
- CRUD lessons with type, order, NPC, active status: `LessonsPage.tsx`.
- CRUD quiz-style questions for MATH/THINKING/SPELLING/RHYME in one `mathQuestions` collection: `MathQuestionsPage.tsx`.
- CRUD dialogues and flashcards: `DialoguesPage.tsx`, `FlashcardsPage.tsx`.
- CRUD badges and daily missions: `BadgesPage.tsx`, `DailyMissionsPage.tsx`.
- Import CSV/XLSX for main content collections: `CSVImportModal.tsx`, `importConfigs.ts`.

What admin cannot do yet:

- Create program/path/level/skill taxonomy.
- Attach content to child difficulty category or learning goal.
- Configure activity types such as LISTEN_AND_CHOOSE_IMAGE, HEAR_AND_REPEAT, VOICE_ANSWER, MATCH_OBJECTS, DAILY_LIFE_SCENARIO, PARENT_MARK_RESULT.
- Configure acceptedAnswers/almostAnswers/retryLimit for voice.
- Configure premium/free access.
- Configure activation code type beyond NPC.
- Preview full lesson flow with multiple activities.
- Manage weekly parent report recommendations.
- Manage subscription entitlements or manual premium grants.

Admin form issues:

- Lesson form only has title/description/type/NPC/order/isActive. It lacks path/program/level/skill/category/goal/accessType.
- Question forms force four text options A-D. This blocks image-choice, matching, voice, parent-child tasks, and open-ended parent-marked activities.
- Flashcards can be attached to any lesson, not only FLASHCARD lessons. `FlashcardsPage.tsx` loads all lessons.
- Dialogue import validates lesson type DIALOGUE, but the UI list filter for `DialoguesPage` displays all `items` in search mode and uses `allLessons` for import. It is acceptable for MVP but weak for content governance.
- Import relation mapping by lesson title/NPC name is practical, but duplicate names only create warnings and "first record wins". This is risky once content grows.

Suggested admin workflow:

1. Media library.
2. Taxonomy setup: difficulty categories, learning goals, skills.
3. NPC setup with role/personality/dialogue templates.
4. Program setup.
5. Learning path setup with levels and target child profile.
6. Lesson setup inside path.
7. Activity builder inside lesson.
8. Attach media and feedback.
9. Configure accessType and premium gating.
10. Configure activation codes.
11. Validate/preview lesson as mobile screen.
12. Publish status and import validation.
13. Review progress/report metrics.

## 6. Mobile App Audit

Onboarding:

- Registration has disclaimer checkbox and OTP flow.
- Child profile is enforced before main app.
- The profile screen claims personalization but asks only name, age, gender, note.
- No difficulty category, primary goal, support level, daily learning duration, parent-assisted mode, interests, or accessibility preference in profile model.

Child profile:

- Data model: `id`, `userId`, `name`, `age`, `gender`, `note`.
- Age validation only checks numeric input; docs mention 1-10 and 2-6 warning, but inspected screen only checks integer.
- Active child is always first child; no child selector for multiple profiles.

Home:

- Shows active child, active NPC, XP, streak, mission preview and quick links.
- Works as an MVP dashboard but not personalized by profile/category/goals.

Learning path:

- Lessons are fetched from `lessons where isActive == true`, sorted by `orderIndex`.
- No path/program filtering.
- Locking is based on previous lesson completion, but default `ALLOW_ALL_LESSONS_FOR_DEMO=true` makes later lessons available.
- Section titles are hard-coded: "Làm quen", "Luyện nghe", "Luyện nói", "Giao tiếp hằng ngày".

Lesson flow:

- MATH/THINKING/SPELLING/RHYME route to `MathLessonScreen`.
- DIALOGUE route to `DialogueLessonScreen`.
- FLASHCARD route to `FlashcardScreen`.
- Current lesson renderer supports mostly A/B/C/D and flashcard flip.
- No renderer for image choice as first-class options, matching, daily-life scenario, parent-child activity, or voice answer.

QR/NFC:

- QR scanning and manual input exist.
- Unlock validates code client-side through Firestore transaction and opens NPC.
- No NFC plugin/flow found.
- No generic activation code type.

NPC:

- Locked/unlocked collection exists.
- NPC appears in home, lesson detail, lesson mascot bubble, collection/detail.
- NPC guidance is static and generic; no per-activity or skill/context dialogue.

Voice:

- No voice quiz flow.
- `MicrophoneButton` exists but is unused.
- Dialogue audio URL is stored, but mobile currently plays local tap sound when pressing audio button.

Gamification:

- XP, level, streak, badges, daily missions exist.
- XP for lesson/flashcard/QR has first-time guards in repositories.
- Mission progress increments even if lesson was already completed; this allows repeated lessons to progress missions even without XP.
- Badge awarding checks existing earned docs before adding, but this is not transaction-protected and can race.
- Client-side writes are trusted by rules, so all gamification can be forged.

Parent dashboard:

- Uses real `progress` and lesson title lookup.
- Shows completed count, level, XP, streak, recent activity.
- Skill bars are mock values based on completed count.
- Recommendation and disclaimer are static.
- No weekly time-series data, goal progress, weak/strong skill analysis, or personalized home practice.

Premium/paywall:

- Not found.
- No payment prompt appears in child mode, because payment is absent.

Settings/accessibility:

- Toggles exist for large text, high contrast, reduced animation, audio instructions, repeat instructions, haptic feedback.
- Several toggles are stored but not consistently applied across UI/lesson flow.

## 7. Database / Firestore Schema Audit

Current collections from docs/code/rules:

| Collection | Important fields found | Notes |
|---|---|---|
| `users` | uid, email, fullName, role, isActive, emailVerified | No plan/status. Owner update rules too broad. |
| `children` | userId, name, age, gender, note | Missing developmental profile fields. |
| `npcs` | name, description, imageUrl, animationUrl, defaultDialogue, isActive | Missing role, skill/path association, accessType. |
| `qrCodes` | code, npcId, label, isActive, maxUses, usedCount | NPC-only activation. |
| `userUnlockedNpcs` | userId, childId, npcId, qrCodeId, unlockedAt | No secure redemption validation in rules. |
| `lessons` | title, description, type, orderIndex, npcId, isActive | Missing program/path/level/skill/category/goal/accessType. |
| `mathQuestions` | lessonId, questionText, imageUrl, optionA-D, correctOption, explanation, orderIndex | Used for MATH/THINKING/SPELLING/RHYME. |
| `dialogues` | lessonId, title, sceneText, audioUrl, questionText, optionA-D, correctOption, orderIndex | Audio not actually played in mobile. |
| `flashcards` | lessonId, frontText, backText, imageUrl, audioUrl, orderIndex | No lesson type enforcement. |
| `progress` | userId, childId, lessonId, activityType, status, score, totalQuestions, correctAnswers, completedAt | Not enough for reports. |
| `xpLogs` | userId, childId, amount, reason, createdAt | Derived state but client writable. |
| `streaks` | userId, childId, currentStreak, longestStreak, lastActiveDate | Derived state but client writable. |
| `badges` | name, description, iconUrl, type, conditionType, conditionValue, isActive | OK for simple MVP. |
| `userBadges` | userId, childId, badgeId, earnedAt | Client can create. |
| `dailyMissions` | title, description, type, targetValue, rewardXp, isActive | Types are limited to current actions. |
| `userMissionProgress` | userId, childId, missionId, date, currentValue, targetValue, isCompleted, rewardClaimed | Client can update/claim. |
| `mediaAssets` | name, type, category, url, thumbnailUrl | URL-only; no storage metadata governance. |
| `otps` | code, expiresAt, emailSent | Client can read/write own OTP doc. |
| `spellingActivities` | seeded in script | No mobile/admin/rules support found. |
| `rhymeChallenges` | seeded in script | No mobile/admin/rules support found. |

Missing suggested collections/fields:

- `developmentCategories`: key, label, description, active.
- `learningGoals`: key, label, skillTags, active.
- `skills`: key, label, domain, parentDescription.
- `programs`: title, description, goals, difficultyCategories, ageMin/ageMax, level, accessType, status.
- `learningPaths`: programId, title, targetProfileRules, level, status.
- `pathItems`: pathId, lessonId, sequence, unlockRule, requiredCompletion.
- `lessons` additions: programId/pathId, level, skillTags, difficultyCategories, learningGoals, estimatedMinutes, accessType, prerequisiteLessonIds, publishStatus.
- `activities`: lessonId, activityType, prompt, media, options, correctAnswer, acceptedAnswers, feedback, retryLimit, orderIndex, skillTags.
- `activityAttempts`: userId, childId, lessonId, activityId, answer, result, durationSec, supportMode, createdAt.
- `lessonProgress`: userId, childId, lessonId, status, bestScore, attemptsCount, completedAt, lastAttemptAt.
- `skillProgress`: userId, childId, skillKey, score, attempts, lastUpdated.
- `weeklyReports`: userId, childId, weekStart, metrics, recommendations, disclaimerShown.
- `activationCodes`: codeHash, activationType, targetId, active, maxUses, perUserLimit, expiresAt, usedCount.
- `activationRedemptions`: codeId, userId, childId, targetType, targetId, redeemedAt, source.
- `subscriptions`: userId, plan, status, provider, currentPeriodEnd, entitlementFlags.
- `transactions`: userId, provider, productId, status, verifiedAt, receiptRef.
- `voiceUsageLogs`: userId, childId, activityId, provider, status, durationSec, costUnits, createdAt.

Migration risk:

- Medium/high. Existing MVP data can be migrated by treating current `lessons` as one default program/path and converting `mathQuestions`, `dialogues`, `flashcards` into `activities`.
- Do not delete legacy collections immediately. Add adapters/read fallbacks during migration.

## 8. Payment / Subscription Audit

Current state:

- No `subscriptions` collection.
- No `transactions` collection.
- No `plan`, `subscriptionStatus`, `entitlements`, or `accessType`.
- No paywall screen.
- No in-app purchase, Stripe, webhook, restore purchase, receipt verification, or admin manual premium setter.

Risk:

- Product cannot enforce premium access.
- If payment is added client-side without server verification, it will be unsafe because current rules already trust client writes for derived state.

Before real deployment:

1. Decide monetization scope: demo manual premium vs real IAP/payment.
2. Add `accessType` to content.
3. Add `subscriptions` and server-owned entitlement writes.
4. Add parent-facing paywall only outside child lesson flow.
5. Add provider verification through Cloud Functions.
6. Add restore purchase and expiry/cancel/refund state if using mobile IAP.

## 9. AI Voice Audit

Current state: **not implemented**.

Evidence:

- Search found no STT/TTS provider, no OpenAI/Google speech usage, no accepted answer fields, no voice usage logs.
- `MicrophoneButton` exists but has no references outside its own file.
- Dialogue `audioUrl` exists but mobile only plays a tap sound when pressing audio.

Missing fields:

- `enableVoiceAnswer`
- `targetAnswer`
- `acceptedAnswers`
- `almostAnswers`
- `correctFeedback`
- `almostFeedback`
- `wrongFeedback`
- `retryLimit`
- `ttsVoice`
- `voicePremiumRequired`
- `voiceUsageLimit`

Recommended architecture:

- Keep API keys out of mobile/admin clients.
- Add Cloud Function endpoint for STT/TTS or voice scoring.
- Use signed upload or HTTPS callable function for audio.
- Store activity config in Firestore, but store provider secrets in Firebase Secret Manager.
- For MVP, grade by normalized text against accepted/almost answers; do not claim pronunciation diagnosis.
- Add usage/cost limits per user/plan and `voiceUsageLogs`.

## 10. Security Audit

| Issue | Severity | Finding | Suggested fix |
|---|---|---|---|
| Client can write progress | Critical | `progress` create/update allowed for owner. | Only Cloud Functions/Admin should write completion; client submits attempts. |
| Client can write XP | Critical | `xpLogs` create allowed for owner. | Server-authoritative XP only. |
| Client can update streak | High | `streaks` update allowed for owner. | Server-authoritative streak. |
| Client can award badges | Critical | `userBadges` create allowed for owner. | Server-only badge awards, unique doc IDs. |
| Client can update mission progress | High | `userMissionProgress` create/update allowed for owner. | Server-only mission progress and claims. |
| Client can bypass QR unlock | Critical | `userUnlockedNpcs` create allowed if `userId` matches auth uid. | Only activation Cloud Function creates unlocks. |
| QR `usedCount` can be incremented by any signed-in user | High | Rule allows +1 without validating active/maxUses/unlock. | Disallow client QR updates. |
| Owner user update too broad | High | Owner can preserve role but alter other fields such as `emailVerified`/`isActive`. | Allow only `fullName` or safe fields. |
| OTP docs client writable/readable | Medium | Own OTP doc can be read/written by client. | Server-only OTP generation; client submits code to function. |
| Storage public read | Medium | `allow read: if true`. | OK only for public media; restrict private assets. |
| Service account in workspace | Critical | `firebase-service-account.json` exists locally with private key. It is ignored and not tracked, but should not live in repo workspace. | Move outside workspace and rotate if shared. |
| API key exposure | Low/Medium | Firebase API keys are committed in native config. Firebase API keys are not secret alone, but must be paired with strict rules/App Check. | Enable App Check and tighten rules. |
| Admin route guard | Medium | Admin web has client-side guard and Firestore rules. | Keep rules as source of truth; add custom claims if possible. |

## 11. UX Audit

Child mode:

- Mobile uses large cards, playful colors, simple feedback, and positive wording.
- Child and parent areas are not fully separated; bottom navigation exposes parent dashboard, rewards, scan, learning together.
- Payment does not appear, because payment is absent.
- Lesson flows are simple but still text-heavy for some children.

Parent mode:

- Parent dashboard has disclaimer and static recommendation.
- No clear parent-only gate before dashboard/settings/payment because there is no parent PIN/role split inside mobile.
- Report language is mostly safe and non-diagnostic.

Admin UX:

- Admin forms are more polished than basic CRUD and include previews for NPC/question/flashcard/QR.
- However, workflow is still collection-by-collection, not a content authoring pipeline.
- Relation dropdowns exist for NPC/lesson, but not for program/path/skill/goal.

Accessibility:

- Settings exist for large text/high contrast/reduced animation/audio/repeat/haptics.
- These toggles are not consistently wired into renderers and content.

Feedback safety:

- Lesson feedback uses supportive copy such as "Mình thử lại nhé".
- Gamification should avoid pressure; current streak/XP/mission emphasis is acceptable for demo but should be tuned for parent-led support.

Empty/loading/error:

- Basic loading/error/empty states exist.
- Some FutureBuilders only check `!snap.hasData`; errors may show as endless loading in some screens.
- Missing media/audio fallbacks are partial. `AppImage` should be reviewed for all network failures.

## 12. Recommended Target Business Model

Child profile:

- Required: displayName, age/birthMonth, gender optional.
- Support profile: primaryDifficulty, secondaryDifficulties, learningGoals, supportLevel, dailyDurationMinutes, coLearningMode, interests, accessibilityPreferences.
- Safety copy: parent confirms app is educational support, not diagnosis/treatment.

Learning goal:

- LISTENING, SPEAKING, OBJECT_RECOGNITION, EMOTION_RECOGNITION, DAILY_COMMUNICATION, MATCHING, COUNTING, FOLLOW_INSTRUCTION, PARENT_CHILD_ACTIVITY.

Program/path:

- Program: high-level curriculum such as "Luyện nghe cơ bản", "Giao tiếp hằng ngày", "Nhận biết cảm xúc".
- LearningPath: ordered lessons for age range, difficulty category, learning goal and level.
- PathItems: sequence, unlock rule, optional prerequisite.

Lesson/activity:

- Lesson is a container with metadata and one or more activities.
- Activity has type-specific config:
  - LISTEN_AND_CHOOSE_IMAGE
  - LOOK_AND_CHOOSE_WORD
  - HEAR_AND_REPEAT
  - VOICE_ANSWER
  - MATCH_OBJECTS
  - EMOTION_RECOGNITION
  - DAILY_LIFE_SCENARIO
  - MULTIPLE_CHOICE
  - FLASHCARD_REVIEW
  - PARENT_MARK_RESULT

NPC role:

- NPC acts as guide/companion for program/path/skill.
- NPC has personality, contextual dialogue templates, and optional unlock benefit.
- NPC can be free/premium or physical-toy-unlocked.

QR/NFC activation:

- `activationCodes` supports target types NPC, LESSON, PATH, REWARD, PHYSICAL_TOY.
- QR and NFC use same activation service.
- Redemptions are logged and de-duplicated by user/child/target.

Gamification:

- XP is server-derived from validated completion events.
- Badge awards are unique and server-owned.
- Daily missions are parent-safe and not pressure-heavy.
- Rewards should celebrate effort, not diagnose or rank children.

Premium unlock:

- Content has `accessType`.
- User has entitlement summary.
- Payment verification is server-side.
- Child flow should not show transaction prompts.

Voice quiz:

- MVP voice checks answer text, not pronunciation.
- TTS reads prompt and feedback.
- STT converts child answer to text through backend proxy.
- Usage is logged and limited by plan.

Parent report:

- Shows today, week, completed lessons, skill trends, weak/strong areas, recent activity, recommendations, and disclaimer.
- Recommendations use rule-based mapping from child profile + progress before any AI.

## 13. Prioritized Fix Roadmap

### Phase 1: Critical fixes

- Tighten Firestore rules for owner updates, progress, XP, streaks, badges, mission progress and unlocks.
- Move authoritative learning/gamification/activation writes to Cloud Functions.
- Move service account key out of workspace; rotate if it may have been shared.
- Fix dialogue/flashcard remote audio playback or hide audio claim.
- Repair Flutter SDK/cache so `flutter analyze` and `flutter test` can run.
- Turn `ALLOW_ALL_LESSONS_FOR_DEMO` off in production builds.
- Remove or clearly label mock/hard-coded parent dashboard skill metrics.

### Phase 2: Core product structure

- Add child difficulty category and learning goals to profile/onboarding.
- Add skills, programs, learning paths, path items and learning levels.
- Convert existing questions/dialogues/flashcards into unified activities.
- Add admin authoring workflow for program -> path -> lesson -> activity.
- Add content tagging by difficulty/goal/skill/age/access.
- Add mobile path recommendation based on child profile and progress.

### Phase 3: Monetization/premium

- Add `accessType` to program/path/lesson/NPC/voice/report.
- Add subscription/entitlement schema.
- Add parent-facing paywall outside child mode.
- Add admin manual premium for demo.
- For real payment, add provider verification, transaction records, webhook/restore purchase.

### Phase 4: AI voice

- Add voice activity config and accepted/almost answers.
- Add Cloud Function proxy for STT/TTS.
- Add voice usage logs and quota by plan.
- Add voice lesson renderer with retry limit and safe feedback.
- Do not claim clinical speech/pronunciation assessment in MVP.

### Phase 5: UI/UX polish

- Separate child mode and parent mode more clearly.
- Add parent gate for dashboard/settings/payment.
- Reduce text density in child lesson cards.
- Add missing media/audio fallbacks.
- Add better empty/error states in FutureBuilder screens.
- Expand tests for onboarding, path unlock, lesson completion, QR unlock and dashboard.

## 14. Final Recommendation

Continue from this project only if the team accepts a **schema and workflow restructure**. The current codebase is useful as a prototype foundation for Firebase auth, admin CRUD, media, QR, NPC, simple lessons and gamification, but it should not be treated as production-ready product logic.

Do not rollback everything. Keep the Firebase-first direction for MVP because it fits the current scale, but move sensitive writes to Cloud Functions before adding premium/payment/voice. A separate backend is not required immediately unless payment/AI/reporting becomes complex; Cloud Functions are enough for the next phase.

Do not add more features on the current schema. First add domain concepts: child profile categories, learning goals, programs, paths, levels, skills, activities and activation codes. Then migrate existing content into the new model.

Before hiring devs or preparing a demo:

- Decide MVP scope: no medical claims, no real payment unless verified, no voice unless backend proxy exists.
- Freeze current schema as legacy MVP schema.
- Write target schema and migration plan.
- Fix security rules.
- Repair Flutter toolchain.
- Prepare demo seed data mapped to real difficulty/goal/path concepts.

## 15. Product Restructure Plan

### 15.1 Modules to Keep

- `mobile-flutter` app shell, auth, routing, base theme, loading/error widgets.
- Child profile screen as the starting point, but extend fields.
- QR scanner UI and unlock success UX, but replace backend logic with activation service.
- NPC collection/detail UI, but enrich NPC schema.
- Basic lesson screens as adapters for old content during migration.
- Gamification UI components, but make data server-authoritative.
- Parent dashboard shell, but replace mock skill metrics.
- `admin-web` auth guard, layout, media library, import modal, previews and content tables.
- Firebase Auth, Firestore, Storage, Hosting and Cloud Functions.

### 15.2 Modules to Remove or Deprecate

- Keep `backend/` as deprecated reference only; do not add MVP features there unless the architecture intentionally moves away from Firebase.
- Deprecate `spellingActivities` and `rhymeChallenges` as standalone collections unless a renderer is built; migrate them into `activities`.
- Remove hard-coded parent dashboard skill values.
- Remove hard-coded learning map section semantics once real paths exist.
- Remove any UI claim of personalization until child profile fields are actually used.

### 15.3 Modules to Modify

- `children`: extend schema and onboarding.
- `lessons`: add program/path/level/skill/category/goal/access fields.
- `mathQuestions`, `dialogues`, `flashcards`: migrate into `activities`.
- `qrCodes`: extend/rename to `activationCodes`.
- `progress`: split into attempt-level and lesson-level progress.
- `xpLogs`, `streaks`, `userBadges`, `userMissionProgress`: make server-owned.
- `admin-web`: replace isolated CRUD with guided content workflow.
- `mobile-flutter`: add recommended path, activity renderer registry and parent/child mode separation.
- `functions`: add activation, progress submission, gamification, subscription verification and voice proxy functions.
- `firebase/firestore.rules`: restrict derived writes and sensitive fields.

### 15.4 Proposed New Schema

```ts
users/{uid}: {
  uid, email, fullName, role, isActive, emailVerified,
  subscriptionSummary: { plan, status, expiresAt, entitlements },
  createdAt, updatedAt
}

children/{childId}: {
  userId, displayName, age, gender, note,
  primaryDifficulty, secondaryDifficulties[],
  learningGoals[], supportLevel,
  dailyDurationMinutes, coLearningMode,
  interests[], accessibilityPreferences,
  createdAt, updatedAt
}

programs/{programId}: {
  title, description, targetAgeMin, targetAgeMax,
  difficultyCategories[], learningGoals[], skillTags[],
  level, accessType, status, createdAt, updatedAt
}

learningPaths/{pathId}: {
  programId, title, description, targetProfileRules,
  level, orderIndex, accessType, status
}

pathItems/{itemId}: {
  pathId, lessonId, sequence, unlockRule,
  prerequisiteLessonIds[], requiredCompletion
}

lessons/{lessonId}: {
  programId, pathId, title, description,
  lessonType, level, skillTags[], difficultyCategories[],
  learningGoals[], estimatedMinutes, npcId,
  accessType, publishStatus, orderIndex
}

activities/{activityId}: {
  lessonId, activityType, orderIndex, prompt,
  mediaRefs[], options[], correctAnswers[],
  acceptedAnswers[], almostAnswers[],
  feedback, retryLimit, skillTags[], parentInstruction
}

lessonProgress/{progressId}: {
  userId, childId, lessonId, status,
  bestScore, attemptsCount, completedAt, lastAttemptAt
}

activityAttempts/{attemptId}: {
  userId, childId, lessonId, activityId,
  answerPayload, result, score, durationSec,
  supportMode, createdAt
}

activationCodes/{codeId}: {
  codeHash, activationType, targetId,
  active, maxUses, usedCount, perUserLimit, expiresAt
}

activationRedemptions/{redemptionId}: {
  codeId, userId, childId, targetType, targetId, redeemedAt, source
}

subscriptions/{subscriptionId}: {
  userId, provider, plan, status, currentPeriodEnd, entitlementFlags
}

transactions/{transactionId}: {
  userId, provider, productId, status, receiptRef, verifiedAt, rawStatus
}

voiceUsageLogs/{logId}: {
  userId, childId, lessonId, activityId,
  provider, status, durationSec, costUnits, createdAt
}
```

### 15.5 Proposed New User Flow

1. Parent registers and accepts non-medical disclaimer.
2. Parent creates child profile with difficulty category, learning goals, support level and daily duration.
3. App recommends 1-3 learning paths using rule-based matching.
4. Parent chooses path or accepts default recommendation.
5. Child mode shows today's short activity, guided by active/unlocked NPC.
6. Lesson renders typed activities in order.
7. Child/parent receives supportive feedback.
8. Completion submits attempt to Cloud Function.
9. Server updates progress, XP, streak, badges, missions.
10. Parent dashboard shows skill trends, weekly summary and at-home suggestions.
11. Premium content and voice features are gated only in parent-facing flows.
12. QR/NFC activation can unlock NPC, path, lesson or reward through server validation.

### 15.6 Phase Order for Restructure

Phase A - Stabilize and secure:

- Rules, server-owned writes, secrets cleanup, Flutter QA repair.

Phase B - Domain model:

- Child profile categories/goals, skills, programs, paths, activities.

Phase C - Admin workflow:

- Guided authoring, relation validation, preview/publish, import v2.

Phase D - Mobile learning:

- Path recommendation, activity renderer registry, real progress attempts.

Phase E - Parent reporting:

- Skill rollups, weekly reports, personalized recommendations.

Phase F - Monetization:

- AccessType, subscriptions, manual premium, paywall, provider verification.

Phase G - Voice:

- Voice activity, STT/TTS backend proxy, usage quota, safe feedback.

