DELETE FROM path_items
WHERE lesson_id IN (
  SELECT id FROM lessons
  WHERE upper(coalesce(type, '')) = 'DIALOGUE'
     OR upper(coalesce(lesson_type, '')) = 'DIALOGUE'
);

DELETE FROM lessons
WHERE upper(coalesce(type, '')) = 'DIALOGUE'
   OR upper(coalesce(lesson_type, '')) = 'DIALOGUE';

DROP TABLE IF EXISTS dialogues CASCADE;

CREATE TABLE ai_conversation_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
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
  hint_text TEXT NOT NULL DEFAULT '',
  positive_feedback TEXT NOT NULL DEFAULT '',
  retry_feedback TEXT NOT NULL DEFAULT '',
  max_attempts INT NOT NULL DEFAULT 2,
  skill_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
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

CREATE TRIGGER trg_ai_conversation_topics_updated_at BEFORE UPDATE ON ai_conversation_topics FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_ai_conversation_questions_updated_at BEFORE UPDATE ON ai_conversation_questions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_ai_conversation_sessions_updated_at BEFORE UPDATE ON ai_conversation_sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_ai_conversation_progress_daily_updated_at BEFORE UPDATE ON ai_conversation_progress_daily FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_ai_conversation_topic_progress_updated_at BEFORE UPDATE ON ai_conversation_topic_progress FOR EACH ROW EXECUTE FUNCTION set_updated_at();
