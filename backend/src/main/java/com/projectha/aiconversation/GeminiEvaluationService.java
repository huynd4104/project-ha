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
        String suggestedRetryText,
        String reason
    ) {}

    public GeminiEvaluationResult evaluate(
        AiConversationQuestion question,
        AiConversationRuntimeContext context,
        String transcript,
        int attemptNo
    ) {
        ResolvedGeminiConfig config = configService.resolveGeminiConfig();
        if (!config.enabled() || config.apiKey() == null || config.apiKey().isBlank()) {
            return null;
        }

        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + config.semanticModel() + ":generateContent?key=" + config.apiKey();

            Map<String, Object> childContext = context.childContext();
            String communicationLevel = childContext != null ? String.valueOf(childContext.getOrDefault("communicationLevel", "")) : "";
            String comprehensionLevel = childContext != null ? String.valueOf(childContext.getOrDefault("comprehensionLevel", "")) : "";
            String favoriteAnimal = childContext != null ? String.valueOf(childContext.getOrDefault("favoriteAnimals", "")) : "";
            String favoriteToy = childContext != null ? String.valueOf(childContext.getOrDefault("favoriteToys", "")) : "";
            String favoriteColor = childContext != null ? String.valueOf(childContext.getOrDefault("favoriteColors", "")) : "";
            String preferredPraise = childContext != null ? String.valueOf(childContext.getOrDefault("preferredPraise", "")) : "";
            String calmingStrategies = childContext != null ? String.valueOf(childContext.getOrDefault("calmingStrategies", "")) : "";
            String childAge = childContext != null ? String.valueOf(childContext.getOrDefault("childAge", "")) : "";

            String systemInstruction = "Bạn là bộ đánh giá câu trả lời của trẻ nhỏ trong ứng dụng luyện giao tiếp.\n" +
                "Nhiệm vụ: Phân tích 'childTranscript' dựa trên ngữ cảnh câu hỏi ('questionText'), đáp án kỳ vọng đã xử lý biến ('expectedAnswerResolved'), từ khóa chấp nhận ('acceptedKeywordsResolved') và các câu trả lời thay thế ('alternativeAnswersResolved').\n" +
                "Đồng thời, cá nhân hóa phản hồi dựa trên hồ sơ phát triển rút gọn của trẻ ('childContext').\n" +
                "Quy tắc phản hồi và đánh giá:\n" +
                "1. Không chẩn đoán, không đưa ra kết luận bệnh lý hay lời khuyên y tế. Không nhắc đến các chẩn đoán, bệnh tật hay thuốc thang.\n" +
                "2. Feedback bằng tiếng Việt, tích cực, tự nhiên, cực kỳ ngắn gọn (dưới 20 từ), không chứa emoji, dễ đọc bằng giọng nói (TTS).\n" +
                "3. Đánh giá câu trả lời theo ý nghĩa, không yêu cầu bé nói đúng từng chữ.\n" +
                "4. Nếu bé nói 'không biết', 'con không biết', 'chịu', 'không' hoặc các câu tương tự: kết quả 'result' phải là INCORRECT hoặc UNCLEAR, score = 0.1. Không được khen bé 'gần đúng rồi' hoặc 'giỏi lắm'. Gợi ý câu mẫu ngắn dựa trên 'expectedAnswerResolved'.\n" +
                "5. Nếu bé chưa trả lời đúng, gợi ý một câu mẫu ngắn để bé thử nói theo ở lượt tiếp theo.\n" +
                "6. Sử dụng thông tin sở thích, con vật thích, đồ chơi thích, màu sắc thích hoặc cách khen bé thích từ 'childContext' để động viên bé một cách nhẹ nhàng và tự nhiên.\n" +
                "7. Trả về JSON nghiêm ngặt theo schema sau, không thêm markdown hay text bên ngoài:\n" +
                "{\n" +
                "  \"result\": \"CORRECT | PARTIALLY_CORRECT | INCORRECT | UNCLEAR\",\n" +
                "  \"score\": 0.0 - 1.0,\n" +
                "  \"feedback\": \"câu phản hồi tiếng Việt tự nhiên cho bé\",\n" +
                "  \"suggestedRetryText\": \"câu mẫu ngắn để bé nói theo nếu cần\",\n" +
                "  \"reason\": \"lý do ngắn gọn cho hệ thống\"\n" +
                "}";

            String prompt = String.format(
                "Dữ liệu đánh giá:\n" +
                "- questionText: %s\n" +
                "- expectedAnswerResolved: %s\n" +
                "- acceptedKeywordsResolved: %s\n" +
                "- alternativeAnswersResolved: %s\n" +
                "- childTranscript: %s\n" +
                "- attemptNo: %d\n" +
                "- maxAttempts: %d\n" +
                "- advancePolicy: %s\n" +
                "- childName: %s\n" +
                "- topicName: %s\n" +
                "- childContext:\n" +
                "  * childAge: %s\n" +
                "  * communicationLevel: %s\n" +
                "  * comprehensionLevel: %s\n" +
                "  * favoriteAnimal: %s\n" +
                "  * favoriteToy: %s\n" +
                "  * favoriteColor: %s\n" +
                "  * preferredPraise: %s\n" +
                "  * calmingStrategies: %s",
                question.questionText(),
                context.expectedAnswerResolved(),
                String.join(", ", context.acceptedKeywordsResolved()),
                String.join(", ", context.alternativeAnswersResolved()),
                transcript,
                attemptNo,
                question.maxAttempts(),
                question.advancePolicy() != null ? question.advancePolicy().name() : "ON_CORRECT_ONLY",
                context.childName() != null ? context.childName() : "",
                context.topicName() != null ? context.topicName() : "",
                childAge,
                communicationLevel,
                comprehensionLevel,
                favoriteAnimal,
                favoriteToy,
                favoriteColor,
                preferredPraise,
                calmingStrategies
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
                resultNode.path("suggestedRetryText").asText(""),
                resultNode.path("reason").asText("")
            );

        } catch (Exception e) {
            log.error("Lỗi khi gọi Gemini API cho questionId: {}", question.id(), e);
            return null;
        }
    }
}
