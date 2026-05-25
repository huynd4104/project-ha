# Migration From Firebase

Firebase code and config were removed from the repository. Data migration should be done from an exported dataset into PostgreSQL.

Mapping:

| Firebase collection | PostgreSQL table |
| --- | --- |
| `users` | `users` |
| `children` | `children` |
| `programs` | `programs` |
| `learningPaths` | `learning_paths` |
| `pathItems` | `path_items` |
| `lessons` | `lessons` |
| `activities` | `activities` |
| `mathQuestions` | `math_questions` |
| `dialogues` | `dialogues` |
| `flashcards` | `flashcards` |
| `npcs` | `npcs` |
| `progress` | `progress` |
| `xpLogs` | `xp_logs` |
| `streaks` | `streaks` |
| `dailyMissions` | `daily_missions` |
| `userMissionProgress` | `user_mission_progress` |
| `userUnlockedNpcs` | `user_unlocked_npcs` |

CSV templates are kept in `docs/data-template/`.

Import rules:

- Convert document IDs to UUIDs or keep an external-id mapping during import.
- Convert Firestore timestamps to ISO timestamps.
- Convert nested arrays/objects to relational rows where a first-class table exists; use JSONB only for metadata/options-style fields.
- Do not import passwords from old auth providers; force reset or create backend password hashes through a controlled script.
