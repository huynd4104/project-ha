package com.projectha.aiconversation;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.web.client.RestTemplate;

@DisplayName("GeminiEvaluationService Tests")
class GeminiEvaluationServiceTest {

    private GeminiEvaluationService service;
    
    @Mock
    private RestTemplate restTemplate;
    
    @Mock
    private GeminiConfigService configService;
    
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        service = new GeminiEvaluationService(restTemplate, objectMapper, configService);
    }

    private void mockConfig(String apiKey, String model, boolean enabled) {
        when(configService.resolveGeminiConfig()).thenReturn(
            new ResolvedGeminiConfig(enabled, apiKey, model, 8000)
        );
    }

    private AiConversationRuntimeContext createContext(AiConversationQuestion question) {
        return new AiConversationRuntimeContext(
            UUID.randomUUID(),
            "Huy",
            "Chủ đề test",
            question.expectedAnswer(),
            question.retryPromptText(),
            question.correctFeedback(),
            question.retryFeedback(),
            question.acceptedKeywords(),
            question.alternativeAnswers(),
            new java.util.HashMap<>()
        );
    }

    @Test
    @DisplayName("Should return null when Gemini is disabled")
    void testEvaluateWhenDisabled() {
        mockConfig("test-key", "gemini-3.1-flash-lite", false);
        
        AiConversationQuestion question = createTestQuestion();
        AiConversationRuntimeContext context = createContext(question);
        GeminiEvaluationService.GeminiEvaluationResult result = service.evaluate(question, context, "Em chào cô ạ", 1);
        
        assertNull(result);
    }

    @Test
    @DisplayName("Should return null when API key is empty")
    void testEvaluateWhenApiKeyEmpty() {
        mockConfig("", "gemini-3.1-flash-lite", true);
        
        AiConversationQuestion question = createTestQuestion();
        AiConversationRuntimeContext context = createContext(question);
        GeminiEvaluationService.GeminiEvaluationResult result = service.evaluate(question, context, "Em chào cô ạ", 1);
        
        assertNull(result);
    }

    @Test
    @DisplayName("Should handle valid Gemini response with CORRECT result")
    void testEvaluateWithValidGeminiResponse() throws Exception {
        mockConfig("test-key", "gemini-3.1-flash-lite", true);
        
        String geminiResponse = """
            {
              "candidates": [
                {
                  "content": {
                    "parts": [
                      {
                        "text": "{\\"result\\": \\"CORRECT\\", \\"score\\": 1.0, \\"feedback\\": \\"Giỏi lắm, con trả lời tốt!\\", \\"suggestedRetryText\\": \\"Con chào cô\\", \\"reason\\": \\"Matches expected answer\\"}"
                      }
                    ]
                  }
                }
              ]
            }
            """;
        
        when(restTemplate.postForObject(anyString(), any(), eq(String.class)))
            .thenReturn(geminiResponse);
        
        AiConversationQuestion question = createTestQuestion();
        AiConversationRuntimeContext context = createContext(question);
        GeminiEvaluationService.GeminiEvaluationResult result = service.evaluate(question, context, "Con chào cô", 1);
        
        assertNotNull(result);
        assertEquals(AiConversationEvaluationResult.CORRECT, result.result());
        assertEquals(1.0, result.score());
        assertEquals("Giỏi lắm, con trả lời tốt!", result.feedback());
        assertEquals("Con chào cô", result.suggestedRetryText());
    }

    @Test
    @DisplayName("Should handle valid Gemini response with PARTIALLY_CORRECT result")
    void testEvaluateWithPartiallyCorrectResult() throws Exception {
        mockConfig("test-key", "gemini-3.1-flash-lite", true);
        
        String geminiResponse = """
            {
              "candidates": [
                {
                  "content": {
                    "parts": [
                      {
                        "text": "{\\"result\\": \\"PARTIALLY_CORRECT\\", \\"score\\": 0.6, \\"feedback\\": \\"Gần đúng rồi, con thử nói rõ hơn nhé.\\", \\"suggestedRetryText\\": \\"Con chào cô\\", \\"reason\\": \\"Partial match\\"}"
                      }
                    ]
                  }
                }
              ]
            }
            """;
        
        when(restTemplate.postForObject(anyString(), any(), eq(String.class)))
            .thenReturn(geminiResponse);
        
        AiConversationQuestion question = createTestQuestion();
        AiConversationRuntimeContext context = createContext(question);
        GeminiEvaluationService.GeminiEvaluationResult result = service.evaluate(question, context, "Em chào", 1);
        
        assertNotNull(result);
        assertEquals(AiConversationEvaluationResult.PARTIALLY_CORRECT, result.result());
        assertEquals(0.6, result.score());
    }

    @Test
    @DisplayName("Should return null when Gemini response is invalid JSON")
    void testEvaluateWhenInvalidJson() {
        mockConfig("test-key", "gemini-3.1-flash-lite", true);
        
        String invalidResponse = """
            {
              "candidates": [
                {
                  "content": {
                    "parts": [
                      {
                        "text": "This is not JSON"
                      }
                    ]
                  }
                }
              ]
            }
            """;
        
        when(restTemplate.postForObject(anyString(), any(), eq(String.class)))
            .thenReturn(invalidResponse);
        
        AiConversationQuestion question = createTestQuestion();
        AiConversationRuntimeContext context = createContext(question);
        GeminiEvaluationService.GeminiEvaluationResult result = service.evaluate(question, context, "Con chào cô", 1);
        
        assertNull(result);
    }

    private AiConversationQuestion createTestQuestion() {
        return new AiConversationQuestion(
            UUID.randomUUID(),
            UUID.randomUUID(),
            "Chào cô",
            "Chào cô",
            "Con chào cô",
            List.of("chào cô"),
            List.<String>of(),
            AiConversationEvaluationType.SEMANTIC,
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
