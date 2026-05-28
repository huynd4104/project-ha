package com.projectha.aiconversation;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class GeminiEvaluationService {
    private static final Logger log = LoggerFactory.getLogger(GeminiEvaluationService.class);
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final GeminiConfigService configService;

    public GeminiEvaluationService(
        RestTemplate geminiRestTemplate,
        ObjectMapper objectMapper,
        GeminiConfigService configService
    ) {
        this.restTemplate = geminiRestTemplate;
        this.objectMapper = objectMapper;
        this.configService = configService;
    }

    public record GeminiEvaluationResult(
        AiConversationEvaluationResult result,
        double score,
        String feedback,
        String reason
    ) {}

    public GeminiEvaluationResult evaluate(AiConversationQuestion question, String transcript) {
        ResolvedGeminiConfig config = configService.resolveGeminiConfig();
        if (!config.enabled() || config.apiKey() == null || config.apiKey().isBlank()) {
            return null;
        }

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + config.semanticModel() + ":generateContent?key=" + config.apiKey();

            String systemInstruction = "Bạn là bộ đánh giá câu trả lời của trẻ nhỏ trong ứng dụng luyện giao tiếp.\n" +
                "Nhiệm vụ: So sánh 'transcript' (câu trẻ nói) với 'expectedAnswer' (đáp án mong đợi) và 'acceptedKeywords' (từ khóa).\n" +
                "Quy tắc:\n" +
                "1. Không chẩn đoán, không dùng từ tiêu cực (không dùng từ 'sai').\n" +
                "2. Feedback bằng tiếng Việt, tích cực, ngắn gọn dưới 20 từ, không dùng emoji.\n" +
                "3. Nếu bé nói 'không biết', 'con không biết', 'chịu' hoặc các câu tương tự: kết quả là INCORRECT. Feedback nên gợi ý câu mẫu, ví dụ: 'Không sao đâu, con thử nói: [expectedAnswer] nhé.'\n" +
                "4. Nếu transcript rỗng hoặc không nghe rõ, kết quả là UNCLEAR.\n" +
                "5. Nếu đúng ý chính, dùng CORRECT.\n" +
                "6. Nếu gần đúng, dùng PARTIALLY_CORRECT.\n" +
                "7. Trả về JSON nghiêm ngặt theo schema sau, không thêm markdown hay text bên ngoài:\n" +
                "{\n" +
                "  \"result\": \"CORRECT | PARTIALLY_CORRECT | INCORRECT | UNCLEAR\",\n" +
                "  \"score\": 0.0 - 1.0,\n" +
                "  \"feedback\": \"câu phản hồi tiếng Việt cho bé\",\n" +
                "  \"reason\": \"lý do ngắn gọn cho hệ thống\"\n" +
                "}";

            String prompt = String.format(
                "Dữ liệu đánh giá:\n- Câu hỏi: %s\n- Đáp án mong đợi: %s\n- Từ khóa chấp nhận: %s\n- Transcript của trẻ: %s",
                question.questionText(),
                question.expectedAnswer(),
                String.join(", ", question.acceptedKeywords()),
                transcript
            );

            Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                    Map.of("parts", List.of(Map.of("text", prompt)))
                ),
                "systemInstruction", Map.of(
                    "parts", List.of(Map.of("text", systemInstruction))
                ),
                "generationConfig", Map.of(
                    "responseMimeType", "application/json"
                )
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            String response = restTemplate.postForObject(url, entity, String.class);
            if (response == null) return null;

            JsonNode root = objectMapper.readTree(response);
            String jsonOutput = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
            
            JsonNode resultNode = objectMapper.readTree(jsonOutput);
            
            return new GeminiEvaluationResult(
                AiConversationEvaluationResult.valueOf(resultNode.path("result").asText("UNCLEAR").toUpperCase()),
                resultNode.path("score").asDouble(0.0),
                resultNode.path("feedback").asText(""),
                resultNode.path("reason").asText("")
            );

        } catch (Exception e) {
            log.error("Lỗi khi gọi Gemini API cho questionId: {}", question.id(), e);
            return null;
        }
    }
}
