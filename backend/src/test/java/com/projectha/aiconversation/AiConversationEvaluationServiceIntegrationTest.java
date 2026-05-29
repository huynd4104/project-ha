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

    private AiConversationRuntimeContext createContext(AiConversationQuestion question, String childName) {
        String expectedAnswerResolved = "";
        if (AiConversationTemplateResolver.isFullyResolved(question.expectedAnswer(), childName, "")) {
            expectedAnswerResolved = AiConversationTemplateResolver.resolve(question.expectedAnswer(), childName, "");
        }
        
        String retryPromptTextResolved = "";
        if (AiConversationTemplateResolver.isFullyResolved(question.retryPromptText(), childName, expectedAnswerResolved)) {
            retryPromptTextResolved = AiConversationTemplateResolver.resolve(question.retryPromptText(), childName, expectedAnswerResolved);
        }
        
        String correctFeedbackResolved = "";
        if (AiConversationTemplateResolver.isFullyResolved(question.correctFeedback(), childName, expectedAnswerResolved)) {
            correctFeedbackResolved = AiConversationTemplateResolver.resolve(question.correctFeedback(), childName, expectedAnswerResolved);
        }
        
        String retryFeedbackResolved = "";
        if (AiConversationTemplateResolver.isFullyResolved(question.retryFeedback(), childName, expectedAnswerResolved)) {
            retryFeedbackResolved = AiConversationTemplateResolver.resolve(question.retryFeedback(), childName, expectedAnswerResolved);
        }

        List<String> acceptedKeywordsResolved = AiConversationTemplateResolver.resolveList(question.acceptedKeywords(), childName, expectedAnswerResolved);
        List<String> alternativeAnswersResolved = AiConversationTemplateResolver.resolveList(question.alternativeAnswers(), childName, expectedAnswerResolved);

        return new AiConversationRuntimeContext(
            UUID.randomUUID(),
            childName,
            "Topic Test",
            expectedAnswerResolved,
            retryPromptTextResolved,
            correctFeedbackResolved,
            retryFeedbackResolved,
            acceptedKeywordsResolved,
            alternativeAnswersResolved,
            new java.util.HashMap<>()
        );
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
        AiConversationRuntimeContext context = createContext(question, null);
        
        AiConversationEvaluationOutcome result = evaluationService.evaluate(question, "Con chào cô", context, 1);
        
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
        AiConversationRuntimeContext context = createContext(question, null);
        
        AiConversationEvaluationOutcome result = evaluationService.evaluate(question, "Em chào cô ạ", context, 1);
        
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
                "Con chào cô",
                "Transcript matches expected answer"
            );
        
        when(geminiEvaluationService.evaluate(any(), any(), anyString(), anyInt()))
            .thenReturn(geminiResult);
        
        AiConversationQuestion question = createQuestion(
            "Khi gặp cô giáo, con nói gì?",
            "Con chào cô",
            List.of("chào cô"),
            AiConversationEvaluationType.SEMANTIC
        );
        AiConversationRuntimeContext context = createContext(question, null);
        
        AiConversationEvaluationOutcome result = evaluationService.evaluate(question, "Em chào cô ạ", context, 1);
        
        assertEquals(AiConversationEvaluationResult.CORRECT, result.result());
        assertEquals(1.0, result.score());
        assertEquals("Giỏi lắm, con trả lời tốt!", result.feedback());
        verify(geminiEvaluationService, times(1)).evaluate(any(), any(), anyString(), anyInt());
    }

    @Test
    @DisplayName("SEMANTIC evaluation should fallback to local when Gemini returns null")
    void testSemanticEvaluationFallbackWhenGeminiNull() {
        when(geminiEvaluationService.evaluate(any(), any(), anyString(), anyInt()))
            .thenReturn(null);
        
        AiConversationQuestion question = createQuestion(
            "Chào cô",
            "Con chào cô",
            List.of("chào cô"),
            AiConversationEvaluationType.SEMANTIC
        );
        AiConversationRuntimeContext context = createContext(question, null);
        
        AiConversationEvaluationOutcome result = evaluationService.evaluate(question, "Em chào cô ạ", context, 1);
        
        assertNotNull(result);
        assertEquals(AiConversationEvaluationResult.CORRECT, result.result());
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
        AiConversationRuntimeContext context = createContext(question, null);
        
        AiConversationEvaluationOutcome result = evaluationService.evaluate(question, "", context, 1);
        
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
        AiConversationRuntimeContext context = createContext(question, null);

        AiConversationEvaluationOutcome result = evaluationService.evaluate(question, "Em thích chơi bóng", context, 1);

        assertNotNull(result);
        assertNotNull(result.result());
    }

    @Test
    @DisplayName("\"Không biết\" should NEVER be PARTIALLY_CORRECT - SEMANTIC")
    void testDontKnowNeverPartiallyCorrect_Semantic() {
        AiConversationQuestion question = createQuestion(
            "Con tên là gì?",
            "Con tên là Nam",
            List.of("tên là", "Nam"),
            AiConversationEvaluationType.SEMANTIC
        );
        AiConversationRuntimeContext context = createContext(question, "Nam");

        AiConversationEvaluationOutcome result = evaluationService.evaluate(question, "Không biết", context, 1);

        assertNotEquals(AiConversationEvaluationResult.PARTIALLY_CORRECT, result.result());
        assertNotEquals(AiConversationEvaluationResult.CORRECT, result.result());
        assertEquals(AiConversationEvaluationResult.INCORRECT, result.result());
        assertTrue(result.score() <= 0.2);
        assertFalse(result.feedback().contains("gần đúng") || result.feedback().contains("Gần đúng"));
        assertFalse(result.feedback().contains("tốt lắm") || result.feedback().contains("Giỏi"));
        assertTrue(result.feedback().contains("Con tên là Nam"));
    }

    @Test
    @DisplayName("Gemini returning PARTIALLY_CORRECT for \"Không biết\" should be OVERRIDDEN to INCORRECT")
    void testGeminiOverrideForDontKnow() {
        GeminiEvaluationService.GeminiEvaluationResult geminiResult =
            new GeminiEvaluationService.GeminiEvaluationResult(
                AiConversationEvaluationResult.PARTIALLY_CORRECT,
                0.6,
                "Gần đúng rồi, con thử nói rõ hơn nhé.",
                "Con tên là Nam",
                "Close match"
            );

        when(geminiEvaluationService.evaluate(any(), any(), anyString(), anyInt()))
            .thenReturn(geminiResult);

        AiConversationQuestion question = createQuestion(
            "Con tên là gì?",
            "Con tên là Nam",
            List.of("tên là", "Nam"),
            AiConversationEvaluationType.SEMANTIC
        );
        AiConversationRuntimeContext context = createContext(question, "Nam");

        AiConversationEvaluationOutcome result = evaluationService.evaluate(question, "Không biết", context, 1);

        assertEquals(AiConversationEvaluationResult.INCORRECT, result.result());
        assertTrue(result.score() <= 0.2);
        assertFalse(result.feedback().contains("Gần đúng"));
        assertTrue(result.feedback().contains("Con tên là Nam"));
    }

    @Test
    @DisplayName("MANDATORY TEST 1: childName=Huy, expectedAnswer='Con tên là {childName}', transcript='Không biết'")
    void testMandatoryCase1() {
        AiConversationQuestion question = createQuestion(
            "Con tên là gì?",
            "Con tên là {childName}",
            List.of("tên", "là"),
            AiConversationEvaluationType.SEMANTIC
        );
        AiConversationRuntimeContext context = createContext(question, "Huy");

        AiConversationEvaluationOutcome result = evaluationService.evaluate(question, "Không biết", context, 1);

        assertTrue(result.feedback().contains("Con tên là Huy"), "Feedback must contain 'Con tên là Huy'");
        assertFalse(result.feedback().contains("{childName}"), "Feedback must not contain '{childName}'");
        assertFalse(result.feedback().contains("[tên của con]"), "Feedback must not contain '[tên của con]'");
        assertNotEquals(AiConversationEvaluationResult.PARTIALLY_CORRECT, result.result());
        assertTrue(result.shouldRetry());
        assertFalse(result.shouldAdvance());
    }

    @Test
    @DisplayName("MANDATORY TEST 2: childName=Huy, transcript='Con tên là Huy'")
    void testMandatoryCase2() {
        AiConversationQuestion question = createQuestion(
            "Con tên là gì?",
            "Con tên là {childName}",
            List.of("tên", "Huy"),
            AiConversationEvaluationType.SEMANTIC
        );
        AiConversationRuntimeContext context = createContext(question, "Huy");

        AiConversationEvaluationOutcome result = evaluationService.evaluate(question, "Con tên là Huy", context, 1);

        assertEquals(AiConversationEvaluationResult.CORRECT, result.result());
    }

    @Test
    @DisplayName("MANDATORY TEST 3: expectedAnswer contains placeholder but no childName resolved")
    void testMandatoryCase3() {
        AiConversationQuestion question = createQuestion(
            "Con tên là gì?",
            "Con tên là {childName}",
            List.of("tên", "là"),
            AiConversationEvaluationType.SEMANTIC
        );
        // childName is null/empty
        AiConversationRuntimeContext context = createContext(question, null);

        // Child answers "Không biết"
        AiConversationEvaluationOutcome result = evaluationService.evaluate(question, "Không biết", context, 1);

        assertFalse(result.feedback().contains("{childName}"));
        assertFalse(result.feedback().contains("[tên của con]"));
        assertEquals("Con thử nói tên của con nhé.", result.feedback());
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
