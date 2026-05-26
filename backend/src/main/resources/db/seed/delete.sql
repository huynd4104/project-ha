BEGIN;

CREATE TEMP TABLE _keep_admin_users AS
SELECT u.id
FROM users u
WHERE upper(coalesce(u.role, '')) = 'ADMIN'
   OR EXISTS (
     SELECT 1
     FROM user_roles ur
     JOIN roles r ON r.id = ur.role_id
     WHERE ur.user_id = u.id
       AND upper(r.name) = 'ADMIN'
   );

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM _keep_admin_users) THEN
    RAISE EXCEPTION 'Không tìm thấy tài khoản admin để giữ lại. Dừng xoá dữ liệu.';
  END IF;
END $$;

TRUNCATE TABLE
  activation_redemptions,
  voice_usage_logs,
  user_unlocked_npcs,
  activity_attempts,
  lesson_progress,
  progress,
  xp_logs,
  streaks,
  user_mission_progress,
  user_badges,
  ai_conversation_turns,
  ai_conversation_sessions,
  ai_conversation_progress_daily,
  ai_conversation_topic_progress,
  ai_conversation_questions,
  ai_conversation_topics,
  children,
  path_items,
  activities,
  math_questions,
  flashcards,
  lessons,
  learning_paths,
  programs,
  npcs,
  daily_missions,
  badges,
  media_files,
  media_assets,
  subscriptions,
  transactions,
  audit_logs,
  activation_codes,
  qr_codes,
  refresh_tokens,
  email_verification_tokens,
  password_reset_tokens,
  development_categories,
  learning_goals,
  skills
RESTART IDENTITY CASCADE;

DELETE FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM _keep_admin_users k WHERE k.id = u.id
);

DELETE FROM user_roles ur
WHERE NOT EXISTS (
  SELECT 1 FROM _keep_admin_users k WHERE k.id = ur.user_id
);

COMMIT;
