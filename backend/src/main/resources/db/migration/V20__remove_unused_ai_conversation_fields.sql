ALTER TABLE ai_conversation_topics DROP CONSTRAINT IF EXISTS ai_conversation_topics_code_key CASCADE;
ALTER TABLE ai_conversation_topics DROP COLUMN IF EXISTS code;

ALTER TABLE ai_conversation_questions DROP COLUMN IF EXISTS skill_tags;
