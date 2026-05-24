# Security Rules

Date: 2026-05-24  
Scope: Phase 1 security/stability.

## Summary

Firestore rules now treat learning state, rewards, activation redemptions, subscriptions, and transactions as server-owned data. Mobile and web clients submit intent through callable Cloud Functions instead of writing derived state directly.

## User Profile Rules

Parents can read their own `users/{uid}` document. They can update only:

- `fullName`
- `displayName`
- `avatarUrl`
- `updatedAt`

Parents cannot self-update:

- `role`
- `isActive`
- `emailVerified`
- `subscriptionSummary`
- `plan`
- premium or entitlement fields

OTP verification now updates `emailVerified` through `verifyOtpCode`.

## Server-Owned Collections

Only admins or Firebase Admin SDK/Cloud Functions should write:

- `progress`
- `lessonProgress`
- `activityAttempts`
- `xpLogs`
- `streaks`
- `userBadges`
- `userMissionProgress`
- `userUnlockedNpcs`
- `activationRedemptions`
- `subscriptions`
- `transactions`

Owners can read their own documents in these collections where `userId` matches their Firebase Auth UID.

## Activation/QR Rules

- `qrCodes` and `activationCodes` are readable by signed-in users for backward compatibility.
- Clients cannot update `qrCodes.usedCount`.
- Clients cannot create `userUnlockedNpcs`.
- `redeemActivationCode` validates the child owner, code status, max uses, target, duplicate redemption, and then writes unlock/redemption/used-count server-side.

## Lesson Completion Rules

Mobile clients no longer write completion records directly. They call:

- `submitLessonCompletion`
- `submitActivityAttempt`

The server writes attempts, `lessonProgress`, legacy `progress`, XP logs, streaks, badges, and mission progress.

## Compatibility Notes

- Legacy `progress` remains readable and is still written by `submitLessonCompletion`.
- Legacy `qrCodes` remains supported by `redeemActivationCode`.
- Existing admin-managed collections such as `lessons`, `mathQuestions`, `dialogues`, `flashcards`, `npcs`, `badges`, and `dailyMissions` remain admin-writable.

## Test Checklist

- Parent can update `fullName`.
- Parent cannot update `role`, `isActive`, `emailVerified`, `subscriptionSummary`, `plan`, or premium fields.
- Parent cannot create/update `progress`, `xpLogs`, `streaks`, `userBadges`, `userMissionProgress`, or `userUnlockedNpcs`.
- Parent cannot increment `qrCodes.usedCount`.
- Valid QR/manual code works through `redeemActivationCode`.
- Invalid, inactive, expired, max-use, wrong-child, and duplicate activations are handled.
- Lesson completion works through `submitLessonCompletion`.
- Daily mission claim works through `claimDailyMissionReward`.

