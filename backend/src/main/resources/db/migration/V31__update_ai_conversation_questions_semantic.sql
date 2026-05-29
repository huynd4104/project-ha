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
