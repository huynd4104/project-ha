CREATE TABLE child_development_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID UNIQUE NOT NULL REFERENCES children(id) ON DELETE CASCADE,

    -- Basic
    nickname TEXT,
    primary_language TEXT,
    communication_level VARCHAR(50),
    comprehension_level VARCHAR(50),
    attention_span_level VARCHAR(50),

    -- Skills
    gross_motor_level VARCHAR(50),
    fine_motor_level VARCHAR(50),
    self_care_level VARCHAR(50),

    -- Behavior/emotion
    need_expression_style TEXT,
    common_triggers TEXT,
    calming_strategies TEXT,
    eye_contact_level VARCHAR(50),
    social_interaction_level VARCHAR(50),

    -- Preferences/motivators
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

    -- Family/environment
    primary_caregiver TEXT,
    family_members TEXT,
    sibling_names TEXT,
    home_rules TEXT,
    home_notes TEXT,

    -- Health/safety
    hearing_vision_notes TEXT,
    health_notes TEXT,
    medication_notes TEXT,
    safety_notes TEXT,

    -- Privacy
    consent_to_use_for_ai BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_child_development_profiles_updated_at
BEFORE UPDATE ON child_development_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Update existing questions
UPDATE ai_conversation_questions
SET expected_answer = 'Con tên là {childName}',
    evaluation_type = 'SEMANTIC',
    advance_policy = 'ON_CORRECT_ONLY'
WHERE id = 'b66aaba6-dc1b-5f37-bbc9-ea45f2698afb';

UPDATE ai_conversation_questions
SET expected_answer = 'Con chào cô',
    evaluation_type = 'SEMANTIC',
    advance_policy = 'ON_CORRECT_ONLY'
WHERE id = '44d0e44e-61a3-56da-9dbe-aa3a84647405';
