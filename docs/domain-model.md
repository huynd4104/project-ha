# Domain Model Phase 2

Date: 2026-05-24

Project HA is a parent-support learning app. It is not a medical diagnosis tool, does not replace specialists, and should not present recommendations as clinical assessment.

## Core Concepts

- `children`: child profile used for personalization. Legacy `name`, `age`, `gender`, `note` remain supported. New fields include `primaryDifficulty`, `secondaryDifficulties`, `learningGoals`, `supportLevel`, `dailyDurationMinutes`, `coLearningMode`, `interests`, and `accessibilityPreferences`.
- `developmentCategories`: taxonomy for broad support needs such as `SPEECH_DELAY`, `ATTENTION_DIFFICULTY`, `COGNITIVE_DELAY`, `SOCIAL_COMMUNICATION`, `EMOTION_RECOGNITION`, `DAILY_LIFE_SKILL`, and `OTHER`.
- `learningGoals`: parent-facing goals such as listening, speaking, object recognition, daily communication, matching, counting, following instructions, and parent-child activity.
- `skills`: reporting/content tags. Current default skill keys match learning goal keys.
- `programs`: high-level learning packages with target age, difficulty categories, goals, skill tags, level, access type, and publish status.
- `learningPaths`: ordered path options inside a program. Each path has target profile rules and a level.
- `pathItems`: ordered lesson references inside a path, with unlock metadata.
- `activities`: unified activity configuration for future renderers. Legacy `mathQuestions`, `dialogues`, and `flashcards` are still rendered and can be adapted to `Activity` at runtime.

## Enums

Learning levels: `BEGINNER`, `BASIC`, `INTERMEDIATE`.

Access types: `FREE`, `PREMIUM`. Phase 2 stores the metadata only; payment and entitlement enforcement remain Phase 5.

Publish status: `DRAFT`, `PUBLISHED`, `ARCHIVED`.

Unlock rules: `ALWAYS_OPEN`, `PREVIOUS_COMPLETED`, `MANUAL_UNLOCK`, `PREMIUM_ONLY`.

Activity types: `LISTEN_AND_CHOOSE_IMAGE`, `LOOK_AND_CHOOSE_WORD`, `HEAR_AND_REPEAT`, `VOICE_ANSWER`, `MATCH_OBJECTS`, `EMOTION_RECOGNITION`, `DAILY_LIFE_SCENARIO`, `MULTIPLE_CHOICE`, `FLASHCARD_REVIEW`, `PARENT_MARK_RESULT`.

## Recommendation

The Phase 2 mobile recommendation service is rule-based:

- match child age to program `targetAgeMin` and `targetAgeMax`
- score child primary/secondary difficulty against program `difficultyCategories`
- score child goals against program `learningGoals`
- prefer published/free paths
- return the top recommendation used by the learning map

This recommendation is not diagnostic. It only picks a starting learning path and can be changed later when Phase 3 admin workflow and parent path selection are added.

## Legacy Compatibility

Legacy collections remain supported:

- `lessons`
- `mathQuestions`
- `dialogues`
- `flashcards`
- `progress`
- `qrCodes`
- `userUnlockedNpcs`

If no `programs`, `learningPaths`, or `pathItems` exist, mobile falls back to active legacy `lessons` sorted by `orderIndex`.
