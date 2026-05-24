# Phase 2 Migration Notes

Date: 2026-05-24

## Scope

Phase 2 adds the core product domain model:

- child difficulty categories
- learning goals
- skills
- programs
- learning paths
- path items
- learning levels
- activity types
- unified activity scaffolding
- runtime adapters for legacy questions/dialogues/flashcards
- basic rule-based path recommendation

Phase 2 does not implement premium payment, AI voice quiz, a redesigned admin authoring workflow, or a redesigned mobile UX.

## Backward Compatibility

Existing child documents with only `name`, `age`, `gender`, and `note` still load. Flutter supplies safe defaults:

- `primaryDifficulty = OTHER`
- `learningGoals = []`
- `supportLevel = MEDIUM`
- `dailyDurationMinutes = 5`
- `coLearningMode = PARENT_CHILD_TOGETHER`

Existing lessons still load. Missing lesson fields default to:

- `level = BEGINNER`
- `accessType = FREE`
- `publishStatus = PUBLISHED` when `isActive == true`
- `estimatedMinutes = 3`
- empty `skillTags`, `difficultyCategories`, and `learningGoals`

If no published paths with path items exist, mobile uses the legacy active lesson list sorted by `orderIndex`.

## Mobile Path Selection

Mobile queries published programs and published learning paths, scores paths against the active child profile, then loads lessons through `pathItems`. If no usable path item is available, it falls back to legacy lessons.

The recommendation is rule-based and non-clinical. It is only a content starting point for home practice.

## Admin State

Admin now has read/list pages for:

- development categories
- learning goals
- skills
- programs
- learning paths

Legacy Lessons, Math, Dialogue, and Flashcard pages remain available and are labeled as legacy. Full program/path/activity authoring remains Phase 3.

## Security Rules

Rules now cover the new domain collections:

- taxonomy is signed-in readable and admin-write
- programs/paths are readable only when published, except admins
- path items are readable only for published paths
- activities are readable only for active lessons
- attempts/progress/redemptions/subscriptions/voice logs remain server-owned

Owner updates to child profiles are restricted to safe profile fields.

## Known Limitations

- No real premium entitlement enforcement yet.
- No AI voice provider, STT/TTS proxy, or voice quota logic yet.
- ActivityRenderer registry is scaffolding only; old lesson screens still render the current experience.
- Parent dashboard only shows skill progress when attempts contain real `skillTags`; otherwise it shows an insufficient-data message.
- Local Flutter `analyze` may still fail if the machine SDK is missing `analysis_server.dart.snapshot`; do not repair global SDK as part of this repo migration.
