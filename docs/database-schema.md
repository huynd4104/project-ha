# Database Schema

The schema is managed by Flyway in `backend/src/main/resources/db/migration/V1__initial_schema.sql`.

Core tables:

- Identity: `users`, `roles`, `user_roles`, `refresh_tokens`, `email_verification_tokens`, `password_reset_tokens`.
- Children and content: `children`, `programs`, `learning_paths`, `path_items`, `lessons`, `activities`, `math_questions`, `dialogues`, `flashcards`.
- Engagement: `npcs`, `user_unlocked_npcs`, `progress`, `lesson_progress`, `activity_attempts`, `xp_logs`, `streaks`, `daily_missions`, `user_mission_progress`, `badges`, `user_badges`.
- Media and ops: `media_files`, `subscriptions`, `transactions`, `audit_logs`, `activation_codes`, `qr_codes`, `activation_redemptions`, `voice_usage_logs`.

Conventions:

- UUID primary keys use `gen_random_uuid()`.
- `created_at` and `updated_at` are present on mutable content tables.
- Content tables use `status` and/or `is_active`.
- Media binary data is not stored in PostgreSQL; only R2 object metadata is stored in `media_files`.
