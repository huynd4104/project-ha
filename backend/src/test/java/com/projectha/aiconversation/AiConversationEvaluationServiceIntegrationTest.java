package com.projectha.aiconversation;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

@DisplayName("AiConversationEvaluationService Integration Tests")
class AiConversationEvaluationServiceIntegrationTest {

    private AiConversationEvaluationService evaluationService;
    
    @Mock
    private GeminiEvaluationService geminiEvaluationService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        evaluationService = new AiConversationEvaluationService(geminiEvaluationService);
    }

    @Test
    @DisplayName("EXACT evaluation should work correctly")
    void testExactEvaluation() {
        AiConversationQuestion question = createQuestion(
            "Chào cô",
            "Con chào cô",
            List.of(),
            AiConversationEvaluationType.EXACT
        );
        
        AiConversationEvaluationOutcome result = evaluationService.evaluate(question, "Con chào cô");
        
        assertEquals(AiConversationEvaluationResult.CORRECT, result.result());
        assertEquals(1.0, result.score());
    }

    @Test
    @DisplayName("KEYWORD evaluation should work correctly")
    void testKeywordEvaluation() {
        AiConversationQuestion question = createQuestion(
            "Chào cô",
            "Con chào cô",
            List.of("chào cô", "con chào"),
            AiConversationEvaluationType.KEYWORD
        );
        
        AiConversationEvaluationOutcome result = evaluationService.evaluate(question, "Em chào cô ạ");
        
        assertEquals(AiConversationEvaluationResult.CORRECT, result.result());
        assertEquals(1.0, result.score());
    }

    @Test
    @DisplayName("SEMANTIC evaluation should use Gemini when available")
    void testSemanticEvaluationWithGemini() {
        GeminiEvaluationService.GeminiEvaluationResult geminiResult = 
            new GeminiEvaluationService.GeminiEvaluationResult(
                AiConversationEvaluationResult.CORRECT,
                1.0,
                "Giỏi lắm, con trả lời tốt!",
                "Transcript matches expected answer"
            );
        
        when(geminiEvaluationService.evaluate(any(), anyString()))
            .thenReturn(geminiResult);
        
        AiConversationQuestion question = createQuestion(
            "Khi gặp cô giáo, con nói gì?",
            "Con chào cô",
            List.of("chào cô"),
            AiConversationEvaluationType.SEMANTIC
        );
        
        AiConversationEvaluationOutcome result = evaluationService.evaluate(question, "Em chào cô ạ");
        
        assertEquals(AiConversationEvaluationResult.CORRECT, result.result());
        assertEquals(1.0, result.score());
        assertEquals("Giỏi lắm, con trả lời tốt!", result.feedback());
        verify(geminiEvaluationService, times(1)).evaluate(any(), anyString());
    }

    @Test
    @DisplayName("SEMANTIC evaluation should fallback to local when Gemini returns null")
    void testSemanticEvaluationFallbackWhenGeminiNull() {
        when(geminiEvaluationService.evaluate(any(), anyString()))
            .thenReturn(null);
        
        AiConversationQuestion question = createQuestion(
            "Chào cô",
            "Con chào cô",
            List.of("chào cô"),
            AiConversationEvaluationType.SEMANTIC
        );
        
        AiConversationEvaluationOutcome result = evaluationService.evaluate(question, "Em chào cô ạ");
        
        assertNotNull(result);
        assertEquals(AiConversationEvaluationResult.CORRECT, result.result());
    }

    @Test
    @DisplayName("SEMANTIC evaluation should fallback to local when Gemini throws exception")
    void testSemanticEvaluationFallbackWhenGeminiThrows() {
        when(geminiEvaluationService.evaluate(any(), anyString()))
            .thenThrow(new RuntimeException("API error"));
        
        AiConversationQuestion question = createQuestion(
            "Chào cô",
            "Con chào cô",
            List.of("chào cô"),
            AiConversationEvaluationType.SEMANTIC
        );
        
        AiConversationEvaluationOutcome result = evaluationService.evaluate(question, "Em chào cô ạ");
        
        assertNotNull(result);
        assertNotNull(result.result());
    }

    @Test
    @DisplayName("SEMANTIC evaluation should fallback when Gemini feedback is empty")
    void testSemanticEvaluationFallbackWhenFeedbackEmpty() {
        GeminiEvaluationService.GeminiEvaluationResult geminiResult = 
            new GeminiEvaluationService.GeminiEvaluationResult(
                AiConversationEvaluationResult.CORRECT,
                1.0,
                "",
                "Reason"
            );
        
        when(geminiEvaluationService.evaluate(any(), anyString()))
            .thenReturn(geminiResult);
        
        AiConversationQuestion question = createQuestion(
            "Chào cô",
            "Con chào cô",
            List.of("chào cô"),
            AiConversationEvaluationType.SEMANTIC
        );
        
        AiConversationEvaluationOutcome result = evaluationService.evaluate(question, "Em chào cô ạ");
        
        assertNotNull(result);
        assertNotNull(result.feedback());
    }

    @Test
    @DisplayName("Empty transcript should return UNCLEAR")
    void testEmptyTranscriptReturnsUnclear() {
        AiConversationQuestion question = createQuestion(
            "Chào cô",
            "Con chào cô",
            List.of(),
            AiConversationEvaluationType.SEMANTIC
        );
        
        AiConversationEvaluationOutcome result = evaluationService.evaluate(question, "");
        
        assertEquals(AiConversationEvaluationResult.UNCLEAR, result.result());
        assertEquals(0.0, result.score());
    }

    @Test
    @DisplayName("OPEN_ENDED evaluation should work correctly")
    void testOpenEndedEvaluation() {
        AiConversationQuestion question = createQuestion(
            "Con thích làm gì?",
            "Con thích chơi",
            List.of(),
            AiConversationEvaluationType.OPEN_ENDED
        );

        AiConversationEvaluationOutcome result = evaluationService.evaluate(question, "Em thích chơi bóng");

        assertNotNull(result);
        assertNotNull(result.result());
    }

    // ═══════════════════════════════════════════════════════════════════
    //  TEST: "Don't know" hard rule (REQUIRED)
    // ═══════════════════════════════════════════════════════════════════

    @Test
    @DisplayName("\"Không biết\" should NEVER be PARTIALLY_CORRECT - SEMANTIC")
    void testDontKnowNeverPartiallyCorrect_Semantic() {
        AiConversationQuestion question = createQuestion(
            "Con tên là gì?",
            "Con tên là Nam",
            List.of("tên là", "Nam"),
            AiConversationEvaluationType.SEMANTIC
        );

        AiConversationEvaluationOutcome result = evaluationService.evaluate(question, "Không biết");

        assertNotEquals(AiConversationEvaluationResult.PARTIALLY_CORRECT, result.result(),
            "\"Không biết\" must NEVER be PARTIALLY_CORRECT");
        assertNotEquals(AiConversationEvaluationResult.CORRECT, result.result(),
            "\"Không biết\" must NEVER be CORRECT");
        assertEquals(AiConversationEvaluationResult.INCORRECT, result.result());
        assertTrue(result.score() <= 0.2, "Score for \"Không biết\" must be <= 0.2");
        assertFalse(result.feedback().contains("gần đúng") || result.feedback().contains("Gần đúng"),
            "Feedback must NOT contain \"gần đúng\"");
        assertFalse(result.feedback().contains("tốt lắm") || result.feedback().contains("Giỏi"),
            "Feedback must NOT contain praise for don't-know answer");
        assertTrue(result.feedback().contains("Con tên là Nam"),
            "Feedback should suggest the expected answer");
    }

    @Test
    @DisplayName("\"Con không biết\" should NEVER be PARTIALLY_CORRECT - KEYWORD")
    void testDontKnowNeverPartiallyCorrect_Keyword() {
        AiConversationQuestion question = createQuestion(
            "Khi gặp cô giáo, con nói gì?",
            "Con chào cô",
            List.of("chào cô", "con chào"),
            AiConversationEvaluationType.KEYWORD
        );

        AiConversationEvaluationOutcome result = evaluationService.evaluate(question, "Con không biết");

        assertNotEquals(AiConversationEvaluationResult.PARTIALLY_CORRECT, result.result());
        assertEquals(AiConversationEvaluationResult.INCORRECT, result.result());
        assertTrue(result.feedback().contains("Con chào cô"),
            "Feedback should suggest the expected answer");
    }

    @Test
    @DisplayName("\"Không\" alone should be INCORRECT")
    void testDontKnowAlone() {
        AiConversationQuestion question = createQuestion(
            "Con thích màu gì?",
            "Con thích màu đỏ",
            List.of("màu đỏ", "thích"),
            AiConversationEvaluationType.KEYWORD
        );

        AiConversationEvaluationOutcome result = evaluationService.evaluate(question, "Không");

        assertEquals(AiConversationEvaluationResult.INCORRECT, result.result());
        assertTrue(result.score() <= 0.2);
    }

    @Test
    @DisplayName("\"Chịu\" should be INCORRECT")
    void testChiuAlone() {
        AiConversationQuestion question = createQuestion(
            "Con tên là gì?",
            "Con tên là Nam",
            List.of("tên là", "Nam"),
            AiConversationEvaluationType.SEMANTIC
        );

        AiConversationEvaluationOutcome result = evaluationService.evaluate(question, "Chịu");

        assertEquals(AiConversationEvaluationResult.INCORRECT, result.result());
        assertTrue(result.score() <= 0.2);
        assertFalse(result.feedback().contains("Gần đúng"));
    }

    @Test
    @DisplayName("\"Em không biết\" should be INCORRECT")
    void testEmKhongBiet() {
        AiConversationQuestion question = createQuestion(
            "Con thích làm gì?",
            "Con thích chơi",
            List.of("thích chơi"),
            AiConversationEvaluationType.SEMANTIC
        );

        AiConversationEvaluationOutcome result = evaluationService.evaluate(question, "Em không biết");

        assertEquals(AiConversationEvaluationResult.INCORRECT, result.result());
        assertTrue(result.score() <= 0.2);
    }

    @Test
    @DisplayName("Gemini returning PARTIALLY_CORRECT for \"Không biết\" should be OVERRIDDEN to INCORRECT")
    void testGeminiOverrideForDontKnow() {
        // Simulate Gemini incorrectly returning PARTIALLY_CORRECT
        GeminiEvaluationService.GeminiEvaluationResult geminiResult =
            new GeminiEvaluationService.GeminiEvaluationResult(
                AiConversationEvaluationResult.PARTIALLY_CORRECT,
                0.6,
                "Gần đúng rồi, con thử nói rõ hơn nhé.",
                "Close match"
            );

        when(geminiEvaluationService.evaluate(any(), anyString()))
            .thenReturn(geminiResult);

        AiConversationQuestion question = createQuestion(
            "Con tên là gì?",
            "Con tên là Nam",
            List.of("tên là", "Nam"),
            AiConversationEvaluationType.SEMANTIC
        );

        AiConversationEvaluationOutcome result = evaluationService.evaluate(question, "Không biết");

        // The hard rule MUST override Gemini's wrong evaluation
        assertEquals(AiConversationEvaluationResult.INCORRECT, result.result(),
            "Hard rule must override Gemini's PARTIALLY_CORRECT for \"Không biết\"");
        assertTrue(result.score() <= 0.2);
        assertFalse(result.feedback().contains("Gần đúng"),
            "Feedback must NOT be \"Gần đúng\" even if Gemini says so");
        assertTrue(result.feedback().contains("Con tên là Nam"),
            "Feedback should suggest expected answer");
    }

    @Test
    @DisplayName("Gemini disabled → fallback local still handles \"Không biết\" correctly")
    void testGeminiDisabledStillHandlesDontKnow() {
        when(geminiEvaluationService.evaluate(any(), anyString()))
            .thenReturn(null);

        AiConversationQuestion question = createQuestion(
            "Con tên là gì?",
            "Con tên là Nam",
            List.of("tên là", "Nam"),
            AiConversationEvaluationType.SEMANTIC
        );

        AiConversationEvaluationOutcome result = evaluationService.evaluate(question, "Không biết");

        assertEquals(AiConversationEvaluationResult.INCORRECT, result.result());
        assertTrue(result.score() <= 0.2);
    }

    @Test
    @DisplayName("Gemini exception → fallback local still handles \"Không biết\" correctly")
    void testGeminiExceptionStillHandlesDontKnow() {
        when(geminiEvaluationService.evaluate(any(), anyString()))
            .thenThrow(new RuntimeException("API error"));

        AiConversationQuestion question = createQuestion(
            "Con tên là gì?",
            "Con tên là Nam",
            List.of("tên là", "Nam"),
            AiConversationEvaluationType.SEMANTIC
        );

        AiConversationEvaluationOutcome result = evaluationService.evaluate(question, "Không biết");

        assertEquals(AiConversationEvaluationResult.INCORRECT, result.result());
        assertTrue(result.score() <= 0.2);
    }

    @Test
    @DisplayName("\"Con chào cô\" should be CORRECT")
    void testCorrectAnswerStillWorks() {
        AiConversationQuestion question = createQuestion(
            "Khi gặp cô giáo, con nói gì?",
            "Con chào cô",
            List.of("chào cô"),
            AiConversationEvaluationType.SEMANTIC
        );

        AiConversationEvaluationOutcome result = evaluationService.evaluate(question, "Con chào cô");

        assertEquals(AiConversationEvaluationResult.CORRECT, result.result());
        assertEquals(1.0, result.score());
    }

    private AiConversationQuestion createQuestion(
        String questionText,
        String expectedAnswer,
        List<String> acceptedKeywords,
        AiConversationEvaluationType evaluationType
    ) {
        return new AiConversationQuestion(
            UUID.randomUUID(),
            UUID.randomUUID(),
            questionText,
            questionText,
            expectedAnswer,
            acceptedKeywords,
            List.<String>of(),
            evaluationType,
            AiConversationAdvancePolicy.ON_CORRECT_ONLY,
            true,
            3,
            "Con thử nói theo mẫu nhé.",
            "Giỏi lắm, con nói rất tốt!",
            "Không sao đâu, con thử lại nhé.",
            "Gợi ý",
            "Giỏi lắm!",
            "EASY",
            3,
            1,
            true,
            null,
            null
        );
    }
}
