# Firestore Schema V2

Date: 2026-05-24

This schema extends the Phase 1 Firebase-first MVP. It does not delete or migrate away legacy content collections.

## New / Expanded Collections

### `children`

Owner-managed safe profile fields:

- `userId`
- `displayName` or `name`
- `age`
- `gender`
- `note`
- `primaryDifficulty`
- `secondaryDifficulties[]`
- `learningGoals[]`
- `supportLevel`
- `dailyDurationMinutes`
- `coLearningMode`
- `interests[]`
- `accessibilityPreferences`
- `createdAt`, `updatedAt`

Missing Phase 2 fields default safely in Flutter.

### `developmentCategories`

Admin-managed, signed-in readable taxonomy:

- `key`
- `label`
- `parentDescription`
- `isActive`
- `orderIndex`
- `createdAt`, `updatedAt`

### `learningGoals`

Admin-managed, signed-in readable taxonomy:

- `key`
- `label`
- `parentDescription`
- `isActive`
- `orderIndex`
- `createdAt`, `updatedAt`

### `skills`

Admin-managed, signed-in readable skill catalog:

- `key`
- `label`
- `domain`
- `parentDescription`
- `isActive`
- `orderIndex`
- `createdAt`, `updatedAt`

### `programs`

Admin-managed. Mobile reads only `status == "PUBLISHED"`:

- `title`
- `description`
- `targetAgeMin`
- `targetAgeMax`
- `difficultyCategories[]`
- `learningGoals[]`
- `skillTags[]`
- `level`
- `accessType`
- `status`
- `createdAt`, `updatedAt`

### `learningPaths`

Admin-managed. Mobile reads only `status == "PUBLISHED"`:

- `programId`
- `title`
- `description`
- `targetProfileRules`
- `level`
- `orderIndex`
- `accessType`
- `status`
- `createdAt`, `updatedAt`

### `pathItems`

Admin-managed. Mobile reads items for published paths:

- `pathId`
- `lessonId`
- `sequence`
- `unlockRule`
- `prerequisiteLessonIds[]`
- `requiredCompletion`
- `createdAt`, `updatedAt`

### `activities`

Admin-managed. Mobile can read active activities for active lessons:

- `lessonId`
- `activityType`
- `orderIndex`
- `prompt`
- `instruction`
- `mediaRefs[]`
- `options[]`
- `correctAnswers[]`
- `acceptedAnswers[]`
- `almostAnswers[]`
- `feedback`
- `retryLimit`
- `skillTags[]`
- `parentInstruction`
- `accessType`
- `isActive`
- `createdAt`, `updatedAt`

### Server-Owned Collections

These remain server-owned/admin-write only:

- `activityAttempts`
- `lessonProgress`
- `activationRedemptions`
- `voiceUsageLogs`
- `subscriptions`
- `transactions`

`SubscriptionSummary` and `VoiceUsageLog` models are placeholders only. Phase 2 does not implement payment or AI voice logic.

## Legacy Collections Kept

- `lessons`
- `mathQuestions`
- `dialogues`
- `flashcards`
- `progress`
- `qrCodes`
- `userUnlockedNpcs`

The mobile app still renders existing math, dialogue, and flashcard screens. Runtime adapters can expose legacy records as unified `Activity` objects for future renderer work.
