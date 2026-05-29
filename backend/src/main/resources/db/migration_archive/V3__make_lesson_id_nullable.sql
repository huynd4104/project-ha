ALTER TABLE flashcards ALTER COLUMN lesson_id DROP NOT NULL;
ALTER TABLE dialogues ALTER COLUMN lesson_id DROP NOT NULL;
ALTER TABLE math_questions ALTER COLUMN lesson_id DROP NOT NULL;

ALTER TABLE math_questions ADD COLUMN category TEXT;

UPDATE math_questions mq
SET category = l.type
FROM lessons l
WHERE mq.lesson_id = l.id;
