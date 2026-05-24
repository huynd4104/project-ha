# Implementation Plan From Audit

Date: 2026-05-24  
Original scope: Phase 0 and Phase 1.  
Current update: Phase 2 Core Product Domain Model has now been implemented. Phase 3-7 remain intentionally deferred.

## Audit Findings To Address Now

- Firestore currently lets normal clients write derived or sensitive learning state, including `progress`, `xpLogs`, `streaks`, `userBadges`, `userMissionProgress`, and `userUnlockedNpcs`.
- Firestore currently lets users update too many fields on their own `users/{uid}` document.
- QR unlock is client-authoritative and can directly create unlocked NPC documents or increment QR usage.
- Lesson completion and gamification writes happen from the mobile client, which makes XP, streaks, badges, missions, and progress forgeable.
- Dialogue and flashcard audio fields exist, but tapping the audio button does not play remote audio URLs.
- A `firebase-service-account.json` file exists in the workspace. It is ignored by Git, but it should not live inside the project directory.

## Audit Findings Not Addressed In This Pass

- Phase 3 admin workflow rebuild for program/path/activity authoring.
- Phase 4 advanced mobile personalization and complete typed activity renderers.
- Phase 5 premium demo/paywall and manual premium management.
- Phase 6 AI voice quiz provider architecture, mock provider, quotas, and voice renderer.
- Phase 7 UI/UX polish, parent gate, and accessibility-wide application.
- Real payment integration and real AI provider calls.
- Clinical assessment, diagnosis, speech pronunciation scoring, or medical claims.

## Implementation Order

1. Create this plan from the audit before large code changes.
2. Verify required project folders exist: `mobile-flutter`, `admin-web`, `firebase`, `functions`, and `scripts`.
3. Run baseline checks:
   - `cd admin-web && npm install && npm run build`
   - `cd mobile-flutter && flutter pub get && flutter analyze`
4. Tighten Firestore rules:
   - Restrict owner user updates to safe profile fields only.
   - Make derived learning/gamification state server-owned.
   - Block client writes to subscription, transaction, and premium-related fields.
   - Block client updates to QR `usedCount`.
5. Add callable Cloud Functions:
   - `redeemActivationCode`
   - `submitLessonCompletion`
   - `submitActivityAttempt`
6. Update mobile code so QR unlock and lesson completion call server functions instead of directly writing derived collections.
7. Fix remote audio playback for dialogue and flashcard audio URLs with safe fallback.
8. Create/update docs for security rules and secret/deployment safety.
9. Re-run build/analyze checks and document any toolchain issues without repairing SDKs outside the project.

## Migration Risks

- Existing mobile clients that still write `progress`, `xpLogs`, `streaks`, `userBadges`, `userMissionProgress`, or `userUnlockedNpcs` directly will fail after the rules change. This pass updates the current mobile code, but old installed clients must be updated.
- Existing `progress` documents are retained. New server functions will continue writing legacy `progress` for backward compatibility while also writing newer `lessonProgress` and `activityAttempts` records where possible.
- Existing `qrCodes` remain supported. The new activation function will read current `qrCodes` and optionally support future `activationCodes` shape, but this pass does not migrate all QR data to Phase 2 schema.
- If Cloud Functions are not deployed before the tightened rules, mobile completion and QR unlock flows will fail. Deploy functions and rules together.
- Any admin/manual scripts that write derived collections need Firebase Admin credentials or equivalent server privileges after rules are tightened.

## Collections Added In Phase 1

- `activationRedemptions`: server-written redemption log for QR/NFC/manual unlocks.
- `activityAttempts`: server-written attempt logs for lesson/activity submissions.
- `lessonProgress`: server-written lesson-level progress rollup.

These are Phase 1 support collections only. Full Phase 2 schema is deferred.

## Legacy Collections Kept For Backward Compatibility

- `users`
- `children`
- `npcs`
- `qrCodes`
- `userUnlockedNpcs`
- `lessons`
- `mathQuestions`
- `dialogues`
- `flashcards`
- `progress`
- `xpLogs`
- `streaks`
- `badges`
- `userBadges`
- `dailyMissions`
- `userMissionProgress`
- `mediaAssets`
- `otps`
- `spellingActivities`
- `rhymeChallenges`

No legacy collection will be deleted in this pass.

## Test Plan After Changes

- Admin build: run `npm install` and `npm run build` in `admin-web`.
- Functions build: run `npm run build` in `functions`.
- Flutter dependency and static analysis: run `flutter pub get` and `flutter analyze` in `mobile-flutter`.
- Firestore rules manual checks:
  - Client cannot write `progress`, `xpLogs`, `streaks`, `userBadges`, `userMissionProgress`, `userUnlockedNpcs`, `subscriptions`, or `transactions`.
  - Client cannot update `qrCodes.usedCount`.
  - Owner can update only safe profile fields on `users/{uid}`.
  - Non-admin cannot write admin-managed collections.
- QR/manual activation:
  - Valid code unlocks the target once for a child owned by the user.
  - Invalid, inactive, expired, overused, wrong-child, and duplicate redemption cases fail or return idempotent success as designed.
- Lesson completion:
  - Completing math/dialogue/flashcard lesson calls a server function.
  - Server writes `activityAttempts`, `lessonProgress`, legacy `progress`, XP log, streak, badge, and mission updates as applicable.
  - Repeating a completed lesson does not duplicate first-completion XP.
- Audio:
  - A valid `audioUrl` plays remote audio.
  - Missing or failing audio URL falls back safely and does not crash.
- Secrets:
  - Confirm `firebase-service-account.json` is ignored.
  - Confirm docs warn to move the service account file outside the workspace and rotate if exposed.

## Phase 0 Baseline Check Results

- Project structure check passed: `mobile-flutter`, `admin-web`, `firebase`, `functions`, and `scripts` exist.
- `admin-web`: `npm install` completed. It reported one high severity npm audit item. `npm run build` passed with Vite chunk-size warnings.
- `mobile-flutter`: initial `flutter pub get` failed in sandbox because Flutter needed to write to `/Users/huy/flutter/bin/cache/engine.stamp`. After escalation for the required toolchain cache access, `flutter pub get` passed.
- `mobile-flutter`: `flutter analyze` failed even after escalation because the installed Flutter SDK is missing `analysis_server.dart.snapshot`. A crash report was written to `mobile-flutter/flutter_02.log`. Per instruction, no SDK repair was attempted outside the project.

## Phase 1 Implementation Notes

- Firestore rules were tightened so client apps no longer write derived learning/gamification/activation/subscription data.
- Callable Functions were added for OTP verification, activation redemption, lesson completion, activity attempts, and mission reward claims.
- Mobile QR unlock, lesson completion, OTP verification, and mission reward claim flows now call callable Functions.
- Dialogue and flashcard audio now attempt remote URL playback and show a safe fallback message when audio is missing or fails.
- Full Phase 2 domain model migration remains deferred.

## Final Phase 1 Check Results

- `functions`: `npm run build` passed.
- `admin-web`: `npm run build` passed with the same Vite dynamic-import and chunk-size warnings seen in baseline.
- `mobile-flutter`: `flutter pub get` passed after adding `cloud_functions`.
- `mobile-flutter`: `flutter analyze` still crashes because `/Users/huy/flutter/bin/cache/dart-sdk/bin/snapshots/analysis_server.dart.snapshot` is missing. The latest crash report is `mobile-flutter/flutter_03.log`. No Flutter SDK repair was attempted.
- `mobile-flutter`: `flutter build web --no-pub` passed, so the changed Flutter code compiles for web despite the local analyze tool crash.

## Phase 2 Implementation Notes

- Child profile now supports difficulty category, learning goals, support level, daily duration, co-learning mode, interests, and accessibility preferences while still loading old `name/age/gender/note` documents.
- Flutter domain models were added for taxonomy, programs, learning paths, path items, activities, attempts, lesson progress, activation codes/redemptions, subscription summary placeholder, and voice usage placeholder.
- Lesson model now supports optional `programId`, `pathId`, `lessonType`, `level`, `skillTags`, `difficultyCategories`, `learningGoals`, `estimatedMinutes`, `accessType`, and `publishStatus`.
- Mobile learning repository now loads lessons through recommended published paths and `pathItems` when present, and falls back to active legacy lessons when no path data exists.
- Basic path recommendation is rule-based using age, difficulty category, learning goals, and free/published path preference. It is not diagnostic.
- Legacy `mathQuestions`, `dialogues`, and `flashcards` still render through existing screens. Runtime adapters can expose them as unified `Activity` objects for future renderer work.
- Parent dashboard no longer shows fabricated skill bars. It shows skill scores only when `activityAttempts.skillTags` exists; otherwise it displays the insufficient-data message.
- Admin now has read/list pages for development categories, learning goals, skills, programs, and learning paths. Legacy content pages remain and are labeled as legacy.
- Seed scripts now include default taxonomy, skills, 3 sample programs, learning paths, path items, and safe lesson metadata.
- Firestore rules now cover Phase 2 collections without loosening Phase 1 server-owned progress/security constraints.

## Phase 2 Docs Added

- `docs/domain-model.md`
- `docs/firestore-schema-v2.md`
- `docs/phase-2-migration-notes.md`
- `docs/seed-domain-data.md`

## Phase 3 Remaining Work

- Build full admin workflow for creating/editing programs, paths, lessons, and activities together.
- Add richer activity builder and mobile renderers for all activity types.
- Add parent path selection/change flow.
- Add report-grade skill aggregation and weekly insights.
- Premium/payment, AI voice quiz, and UX polish remain later phases.

## Final Phase 2 Check Results

- `functions`: `npm run build` passed.
- `admin-web`: `npm run build` passed with existing Vite dynamic-import and chunk-size warnings.
- `scripts`: `./node_modules/.bin/tsc --noEmit --target es2020 --module commonjs --moduleResolution node --esModuleInterop --skipLibCheck scripts/seed-domain-data.ts scripts/seed-domain-helpers.ts` passed.
- `mobile-flutter`: `flutter pub get` passed.
- `mobile-flutter`: `flutter build web --no-pub` passed.
- `mobile-flutter`: `flutter analyze` still crashes because `/Users/huy/flutter/bin/cache/dart-sdk/bin/snapshots/analysis_server.dart.snapshot` is missing. Crash report: `mobile-flutter/flutter_04.log`. No global Flutter SDK repair was attempted.
