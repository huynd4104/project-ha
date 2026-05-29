CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Authentication and Authorization
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'PARENT',
  is_active BOOLEAN NOT NULL DEFAULT true,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  subscription_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Children Profiles and Development
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  name TEXT NOT NULL,
  age INT NOT NULL DEFAULT 0,
  gender TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  primary_difficulty TEXT NOT NULL DEFAULT 'OTHER',
  secondary_difficulties JSONB NOT NULL DEFAULT '[]'::jsonb,
  learning_goals JSONB NOT NULL DEFAULT '[]'::jsonb,
  support_level TEXT NOT NULL DEFAULT 'MEDIUM',
  daily_duration_minutes INT NOT NULL DEFAULT 5,
  co_learning_mode TEXT NOT NULL DEFAULT 'PARENT_CHILD_TOGETHER',
  interests JSONB NOT NULL DEFAULT '[]'::jsonb,
  accessibility_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  current_program_id UUID,
  current_path_id UUID,
  selected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  avatar_url TEXT,
  avatar_object_key TEXT
);

CREATE TABLE child_development_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID UNIQUE NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    nickname TEXT,
    primary_language TEXT,
    communication_level VARCHAR(50),
    comprehension_level VARCHAR(50),
    attention_span_level VARCHAR(50),
    gross_motor_level VARCHAR(50),
    fine_motor_level VARCHAR(50),
    self_care_level VARCHAR(50),
    need_expression_style TEXT,
    common_triggers TEXT,
    calming_strategies TEXT,
    eye_contact_level VARCHAR(50),
    social_interaction_level VARCHAR(50),
    favorite_toys TEXT,
    favorite_colors TEXT,
    favorite_animals TEXT,
    favorite_songs TEXT,
    favorite_characters TEXT,
    favorite_foods TEXT,
    favorite_activities TEXT,
    preferred_rewards TEXT,
    preferred_praise TEXT,
    strengths TEXT,
    fears_or_sensitivities TEXT,
    primary_caregiver TEXT,
    family_members TEXT,
    sibling_names TEXT,
    home_rules TEXT,
    home_notes TEXT,
    hearing_vision_notes TEXT,
    health_notes TEXT,
    medication_notes TEXT,
    safety_notes TEXT,
    consent_to_use_for_ai BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Core Educational Model (Programs, Learning Paths, Lessons, Activities)
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'DRAFT',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  age_range_min INT,
  age_range_max INT,
  target_age_min INT NOT NULL DEFAULT 2,
  target_age_max INT NOT NULL DEFAULT 6,
  difficulty_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  learning_goals JSONB NOT NULL DEFAULT '[]'::jsonb,
  skill_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  level TEXT NOT NULL DEFAULT 'BEGINNER',
  access_type TEXT NOT NULL DEFAULT 'FREE'
);

CREATE TABLE learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'DRAFT',
  is_active BOOLEAN NOT NULL DEFAULT true,
  target_age_min INT,
  target_age_max INT,
  difficulty TEXT,
  skill_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  order_index INT,
  target_profile_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  level TEXT NOT NULL DEFAULT 'BEGINNER',
  access_type TEXT NOT NULL DEFAULT 'FREE'
);

CREATE TABLE npcs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  image_url TEXT,
  default_dialogue TEXT,
  dialogue_templates JSONB NOT NULL DEFAULT '{}'::jsonb,
  rarity TEXT NOT NULL DEFAULT 'COMMON',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unlocked_by_default BOOLEAN NOT NULL DEFAULT false,
  cost_coins INT NOT NULL DEFAULT 0,
  animation_url TEXT,
  role TEXT,
  personality TEXT,
  skill_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  program_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  path_ids JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'MATH',
  lesson_type TEXT,
  npc_id UUID REFERENCES npcs(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'PUBLISHED',
  is_active BOOLEAN NOT NULL DEFAULT true,
  access_type TEXT NOT NULL DEFAULT 'FREE',
  estimated_minutes INT NOT NULL DEFAULT 5,
  skill_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  media JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  order_index INT,
  level TEXT NOT NULL DEFAULT 'BEGINNER',
  difficulty_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  learning_goals JSONB NOT NULL DEFAULT '[]'::jsonb,
  publish_status TEXT NOT NULL DEFAULT 'DRAFT'
);

CREATE TABLE path_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  sequence INT NOT NULL DEFAULT 0,
  unlock_rule TEXT DEFAULT 'ALWAYS_OPEN',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  prerequisite_lesson_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_completion BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  prompt TEXT NOT NULL DEFAULT '',
  instruction TEXT NOT NULL DEFAULT '',
  order_index INT NOT NULL DEFAULT 0,
  access_type TEXT NOT NULL DEFAULT 'FREE',
  image_url TEXT,
  audio_url TEXT,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  accepted_answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  almost_answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  feedback JSONB NOT NULL DEFAULT '{}'::jsonb,
  skill_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'PUBLISHED',
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  tts_prompt_text TEXT,
  media_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  retry_limit INT NOT NULL DEFAULT 3,
  voice_premium_required BOOLEAN NOT NULL DEFAULT false,
  parent_instruction TEXT,
  source_library TEXT,
  source_collection TEXT,
  source_id TEXT,
  source_lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  source_snapshot JSONB
);

CREATE TABLE math_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  image_url TEXT,
  audio_url TEXT,
  correct_option TEXT NOT NULL DEFAULT 'A',
  explanation TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expected_answer TEXT,
  category TEXT,
  option_a TEXT,
  option_b TEXT,
  option_c TEXT,
  option_d TEXT
);

CREATE TABLE flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  front_text TEXT NOT NULL,
  back_text TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  audio_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Taxonomy & Media Assets
CREATE TABLE development_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  parent_description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE learning_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  parent_description TEXT,
  skill_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  parent_description TEXT,
  domain TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. NPCs and Activation
CREATE TABLE user_unlocked_npcs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  npc_id UUID NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
  qr_code_id UUID,
  activation_code_id UUID,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, child_id, npc_id)
);

CREATE TABLE activation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  activation_type TEXT NOT NULL DEFAULT 'NPC',
  target_id UUID,
  active BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_uses INT,
  used_count INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  label TEXT,
  per_user_limit INT
);

CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  activation_type TEXT NOT NULL DEFAULT 'NPC',
  target_id UUID,
  active BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_uses INT,
  used_count INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE activation_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID NOT NULL,
  code_collection TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, child_id, target_type, target_id)
);

-- 6. Progress and Logs
CREATE TABLE progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  activity_type TEXT NOT NULL DEFAULT 'MATH',
  status TEXT NOT NULL DEFAULT 'COMPLETED',
  score INT NOT NULL DEFAULT 0,
  total_questions INT NOT NULL DEFAULT 0,
  correct_answers INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, child_id, lesson_id)
);

CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'STARTED',
  best_score INT NOT NULL DEFAULT 0,
  attempts_count INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, child_id, lesson_id)
);

CREATE TABLE activity_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  activity_id UUID,
  activity_type TEXT NOT NULL DEFAULT 'LEGACY',
  answer_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result TEXT NOT NULL DEFAULT 'RECORDED',
  score NUMERIC(8,2) NOT NULL DEFAULT 0,
  duration_sec INT NOT NULL DEFAULT 0,
  skill_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE xp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  current_streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  last_active_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, child_id)
);

CREATE TABLE daily_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL,
  target_value INT NOT NULL DEFAULT 1,
  reward_xp INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_mission_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES daily_missions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  current_value INT NOT NULL DEFAULT 0,
  target_value INT NOT NULL DEFAULT 1,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  reward_claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, child_id, mission_id, date)
);

CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon_url TEXT,
  condition_type TEXT NOT NULL,
  condition_value INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  type TEXT NOT NULL DEFAULT 'LESSON'
);

CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, child_id, badge_id)
);

CREATE TABLE media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  object_key TEXT NOT NULL UNIQUE,
  bucket TEXT NOT NULL,
  file_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes BIGINT,
  public_url TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'MOCK',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  entitlement_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  product_id TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'VND',
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE voice_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  lesson_id UUID,
  activity_id UUID,
  provider TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'STT',
  duration_sec INT NOT NULL DEFAULT 0,
  transcript_length INT NOT NULL DEFAULT 0,
  result TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'SUCCESS',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. NFC Tags & Modules
CREATE TABLE nfc_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_uid TEXT UNIQUE,
  display_name TEXT NOT NULL,
  tag_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  payload_value TEXT,
  spoken_text TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE number_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number_value INT NOT NULL UNIQUE CHECK (number_value >= 0),
  title TEXT NOT NULL,
  image_url TEXT NULL,
  nfc_tag_id UUID NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE number_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number_item_id UUID NOT NULL REFERENCES number_items(id) ON DELETE CASCADE,
  example_text TEXT NOT NULL,
  image_url TEXT NULL,
  nfc_tag_id UUID NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE number_counting_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  image_url TEXT NULL,
  correct_number INT NOT NULL CHECK (correct_number >= 0),
  explanation_text TEXT NULL,
  success_feedback TEXT NULL,
  failure_feedback TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE shape_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shape_name TEXT NOT NULL,
  image_url TEXT NULL,
  nfc_tag_id UUID NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE shape_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shape_item_id UUID NOT NULL REFERENCES shape_items(id) ON DELETE CASCADE,
  example_text TEXT NOT NULL,
  image_url TEXT NULL,
  nfc_tag_id UUID NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE shape_recognition_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  image_url TEXT NULL,
  correct_shape_code TEXT NOT NULL,
  explanation_text TEXT NULL,
  success_feedback TEXT NULL,
  failure_feedback TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pecs_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('EMOTION', 'DAILY_ACTIVITY', 'NON_TOPIC')),
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  spoken_text TEXT NOT NULL CHECK (length(trim(spoken_text)) > 0),
  image_url TEXT NULL,
  nfc_tag_id UUID NULL REFERENCES nfc_tags(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. AI Provider Configuration
CREATE TABLE ai_provider_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL UNIQUE,
    evaluation_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    semantic_model VARCHAR(100) NOT NULL DEFAULT 'gemini-3.1-flash-lite',
    api_key_encrypted TEXT,
    timeout_ms INTEGER NOT NULL DEFAULT 8000,
    last_tested_at TIMESTAMPTZ,
    last_test_status VARCHAR(30),
    last_test_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. AI Conversation
CREATE TABLE ai_conversation_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  age_range_min INT,
  age_range_max INT,
  difficulty_level TEXT NOT NULL DEFAULT 'BEGINNER',
  icon_name TEXT NOT NULL DEFAULT 'chat_bubble',
  mascot_reaction TEXT NOT NULL DEFAULT 'welcome',
  estimated_duration_seconds INT NOT NULL DEFAULT 180,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ai_conversation_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES ai_conversation_topics(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_audio_text TEXT NOT NULL DEFAULT '',
  expected_answer TEXT NOT NULL DEFAULT '',
  accepted_keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
  alternative_answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  evaluation_type TEXT NOT NULL DEFAULT 'KEYWORD'
    CHECK (evaluation_type IN ('EXACT', 'KEYWORD', 'SEMANTIC', 'OPEN_ENDED')),
  advance_policy VARCHAR(50) NOT NULL DEFAULT 'ON_CORRECT_ONLY'
    CHECK (advance_policy IN ('ON_CORRECT_ONLY', 'AFTER_MAX_ATTEMPTS', 'MANUAL_SKIP_ONLY')),
  allow_skip BOOLEAN NOT NULL DEFAULT TRUE,
  skip_after_attempts INTEGER DEFAULT NULL,
  retry_prompt_text TEXT DEFAULT NULL,
  correct_feedback TEXT DEFAULT NULL,
  hint_text TEXT NOT NULL DEFAULT '',
  positive_feedback TEXT NOT NULL DEFAULT '',
  retry_feedback TEXT DEFAULT NULL,
  max_attempts INT NOT NULL DEFAULT 2,
  difficulty_level TEXT NOT NULL DEFAULT 'BEGINNER',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ai_conversation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES ai_conversation_topics(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'CREATED'
    CHECK (status IN ('CREATED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INT NOT NULL DEFAULT 0,
  total_questions INT NOT NULL DEFAULT 0,
  answered_questions INT NOT NULL DEFAULT 0,
  correct_answers INT NOT NULL DEFAULT 0,
  partially_correct_answers INT NOT NULL DEFAULT 0,
  incorrect_answers INT NOT NULL DEFAULT 0,
  needs_practice_count INT NOT NULL DEFAULT 0,
  average_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  ai_model TEXT NOT NULL DEFAULT '',
  live_session_id TEXT,
  summary_feedback TEXT NOT NULL DEFAULT '',
  parent_recommendation TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ai_conversation_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES ai_conversation_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES ai_conversation_questions(id) ON DELETE SET NULL,
  turn_order INT NOT NULL DEFAULT 0,
  question_text TEXT NOT NULL,
  expected_answer_snapshot TEXT NOT NULL DEFAULT '',
  accepted_keywords_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  child_transcript TEXT,
  normalized_answer TEXT NOT NULL DEFAULT '',
  evaluation_result TEXT NOT NULL
    CHECK (evaluation_result IN ('CORRECT', 'PARTIALLY_CORRECT', 'INCORRECT', 'UNCLEAR', 'SKIPPED')),
  score NUMERIC(4,2) NOT NULL DEFAULT 0,
  ai_feedback TEXT NOT NULL DEFAULT '',
  hint_used BOOLEAN NOT NULL DEFAULT false,
  attempt_no INT NOT NULL DEFAULT 1,
  started_at TIMESTAMPTZ,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ai_conversation_progress_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  progress_date DATE NOT NULL,
  total_sessions INT NOT NULL DEFAULT 0,
  completed_sessions INT NOT NULL DEFAULT 0,
  total_duration_seconds INT NOT NULL DEFAULT 0,
  total_questions INT NOT NULL DEFAULT 0,
  total_correct INT NOT NULL DEFAULT 0,
  total_partially_correct INT NOT NULL DEFAULT 0,
  total_incorrect INT NOT NULL DEFAULT 0,
  average_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (child_id, progress_date)
);

CREATE TABLE ai_conversation_topic_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES ai_conversation_topics(id) ON DELETE CASCADE,
  total_sessions INT NOT NULL DEFAULT 0,
  total_questions INT NOT NULL DEFAULT 0,
  total_correct INT NOT NULL DEFAULT 0,
  total_partially_correct INT NOT NULL DEFAULT 0,
  total_incorrect INT NOT NULL DEFAULT 0,
  average_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  last_practiced_at TIMESTAMPTZ,
  needs_practice BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (child_id, topic_id)
);

-- Indexes
CREATE INDEX idx_children_user ON children(user_id);
CREATE INDEX idx_path_items_path ON path_items(path_id, sequence);
CREATE INDEX idx_activities_lesson ON activities(lesson_id, order_index);
CREATE INDEX idx_progress_child ON progress(user_id, child_id);
CREATE INDEX idx_xp_logs_child ON xp_logs(user_id, child_id);
CREATE INDEX idx_daily_progress_date ON user_mission_progress(user_id, child_id, date);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_ai_conversation_questions_topic ON ai_conversation_questions(topic_id);
CREATE INDEX idx_ai_conversation_questions_active ON ai_conversation_questions(is_active);
CREATE INDEX idx_ai_conversation_sessions_child ON ai_conversation_sessions(child_id);
CREATE INDEX idx_ai_conversation_sessions_user_child ON ai_conversation_sessions(user_id, child_id);
CREATE INDEX idx_ai_conversation_sessions_topic ON ai_conversation_sessions(topic_id);
CREATE INDEX idx_ai_conversation_sessions_status ON ai_conversation_sessions(status);
CREATE INDEX idx_ai_conversation_turns_session ON ai_conversation_turns(session_id);
CREATE INDEX idx_ai_conversation_turns_question ON ai_conversation_turns(question_id);
CREATE INDEX idx_ai_conversation_progress_daily_child_date ON ai_conversation_progress_daily(child_id, progress_date);
CREATE INDEX idx_ai_conversation_topic_progress_child_topic ON ai_conversation_topic_progress(child_id, topic_id);

-- Default static records seeding
INSERT INTO roles(name) VALUES ('PARENT'), ('ADMIN'), ('STAFF') ON CONFLICT (name) DO NOTHING;
INSERT INTO ai_provider_configs (provider, semantic_model) VALUES ('GEMINI', 'gemini-3.1-flash-lite') ON CONFLICT (provider) DO NOTHING;

-- Triggers for updated_at
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'roles','users','children','programs','learning_paths','lessons','npcs','path_items',
    'activities','math_questions','flashcards','progress','lesson_progress','streaks',
    'daily_missions','user_mission_progress','badges','media_files','subscriptions',
    'activation_codes','qr_codes','development_categories','learning_goals','skills',
    'media_assets','nfc_tags','number_items','number_examples','number_counting_questions',
    'shape_items','shape_examples','shape_recognition_questions','pecs_cards','ai_provider_configs',
    'ai_conversation_topics','ai_conversation_questions','ai_conversation_sessions',
    'ai_conversation_progress_daily','ai_conversation_topic_progress','child_development_profiles'
  ]
  LOOP
    EXECUTE format('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', table_name, table_name);
  END LOOP;
END $$;
