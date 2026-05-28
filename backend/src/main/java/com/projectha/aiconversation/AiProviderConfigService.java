package com.projectha.aiconversation;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.projectha.aiconversation.AiConversationDtos.*;
import com.projectha.common.EncryptionUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AiProviderConfigService {
    private static final Logger log = LoggerFactory.getLogger(AiProviderConfigService.class);
    private final AiProviderConfigRepository repository;
    private final EncryptionUtils encryptionUtils;
    private final GeminiEvaluationService geminiEvaluationService;
    
    @Value("${project-ha.ai.gemini.api-key:}") private String envApiKey;
    @Value("${project-ha.ai.gemini.evaluation-model:gemini-3.1-flash-lite}") private String envModel;
    @Value("${project-ha.ai.gemini.evaluation-enabled:false}") private boolean envEnabled;
    @Value("${project-ha.ai.gemini.evaluation-timeout-ms:8000}") private int envTimeout;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public AiProviderConfigService(AiProviderConfigRepository repository, EncryptionUtils encryptionUtils, GeminiEvaluationService geminiEvaluationService, RestTemplate restTemplate, ObjectMapper objectMapper) {
        this.repository = repository;
        this.encryptionUtils = encryptionUtils;
        this.geminiEvaluationService = geminiEvaluationService;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public AdminGeminiConfigResponse getGeminiConfig() {
        try {
            AiProviderConfig config = repository.findByProvider("GEMINI");
            return new AdminGeminiConfigResponse(
                config.provider(),
                config.evaluationEnabled(),
                config.semanticModel(),
                config.timeoutMs(),
                config.apiKeyEncrypted() != null,
                config.apiKeyEncrypted() != null ? "AIza...****" : null,
                config.lastTestedAt(),
                config.lastTestStatus(),
                config.lastTestMessage()
            );
        } catch (Exception e) {
            return new AdminGeminiConfigResponse("GEMINI", envEnabled, envModel, envTimeout, !envApiKey.isBlank(), !envApiKey.isBlank() ? "AIza...****" : null, null, null, null);
        }
    }

    @Transactional
    public AdminGeminiConfigResponse updateGeminiConfig(AdminGeminiConfigRequest request) {
        AiProviderConfig config;
        try {
            config = repository.findByProvider("GEMINI");
        } catch (Exception e) {
            config = new AiProviderConfig(UUID.randomUUID(), "GEMINI", false, envModel, null, envTimeout, null, null, null, null, null);
        }

        Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("provider", "GEMINI");
        payload.put("evaluationEnabled", request.evaluationEnabled());
        payload.put("semanticModel", request.semanticModel());
        payload.put("timeoutMs", request.timeoutMs());
        
        if (request.clearApiKey()) {
            payload.put("apiKeyEncrypted", null);
        } else if (request.apiKey() != null && !request.apiKey().isBlank()) {
            // Safe debug log: no secret or key value exposed
            log.info("[AI Config] Saving API key - encryptionSecretConfigured={}, encryptionSecretLength={}",
                encryptionUtils.isSecretConfigured(), encryptionUtils.getSecretLength());
            payload.put("apiKeyEncrypted", encryptionUtils.encrypt(request.apiKey()));
        }

        AiProviderConfig updated = repository.save(new AiProviderConfig(
            config.id(), "GEMINI", request.evaluationEnabled(), request.semanticModel(), 
            (String) payload.get("apiKeyEncrypted"), request.timeoutMs(), config.lastTestedAt(), 
            config.lastTestStatus(), config.lastTestMessage(), config.createdAt(), OffsetDateTime.now()
        ));

        return getGeminiConfig();
    }

    @Transactional
    public AdminAiConfigTestResponse testGeminiConfig(AdminAiConfigTestRequest request) {
        String testKey = (request != null && request.apiKey() != null && !request.apiKey().isBlank()) 
            ? request.apiKey() 
            : null;
        String testModel = (request != null && request.semanticModel() != null && !request.semanticModel().isBlank())
            ? request.semanticModel()
            : null;
        int testTimeout = (request != null && request.timeoutMs() != null)
            ? request.timeoutMs()
            : 0;

        // Resolve missing values from DB or Env
        try {
            AiProviderConfig db = repository.findByProvider("GEMINI");
            if (testKey == null) testKey = db.apiKeyEncrypted() != null ? encryptionUtils.decrypt(db.apiKeyEncrypted()) : envApiKey;
            if (testModel == null) testModel = db.semanticModel();
            if (testTimeout == 0) testTimeout = db.timeoutMs();
        } catch (Exception e) {
            if (testKey == null) testKey = envApiKey;
            if (testModel == null) testModel = envModel;
            if (testTimeout == 0) testTimeout = envTimeout;
        }

        if (testKey == null || testKey.isBlank()) {
            return new AdminAiConfigTestResponse(false, "Chưa cấu hình API Key.", testModel);
        }

        AdminAiConfigTestResponse result = testGeminiConnection(testKey, testModel, testTimeout);
        
        // Save test result to DB if it's the current config (optional but good)
        try {
            AiProviderConfig config = repository.findByProvider("GEMINI");
            repository.save(new AiProviderConfig(
                config.id(), "GEMINI", config.evaluationEnabled(), config.semanticModel(),
                config.apiKeyEncrypted(), config.timeoutMs(), OffsetDateTime.now(),
                result.success() ? "SUCCESS" : "FAILED", result.message(), 
                config.createdAt(), OffsetDateTime.now()
            ));
        } catch (Exception e) {
            // Ignore if DB not ready
        }

        return result;
    }

    private AdminAiConfigTestResponse testGeminiConnection(String apiKey, String model, int timeoutMs) {
        try {
            String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", model, apiKey);
            
            Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                    Map.of("parts", List.of(Map.of("text", "Return only this JSON: {\"ok\":true}")))
                ),
                "generationConfig", Map.of(
                    "temperature", 0,
                    "maxOutputTokens", 10
                )
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            // Create temporary restTemplate with specific timeout
            SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
            factory.setConnectTimeout(Math.min(timeoutMs, 5000));
            factory.setReadTimeout(timeoutMs);
            RestTemplate timeoutRestTemplate = new RestTemplate(factory);

            org.springframework.http.ResponseEntity<String> responseEntity = timeoutRestTemplate.postForEntity(url, entity, String.class);
            
            if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                JsonNode root = objectMapper.readTree(responseEntity.getBody());
                JsonNode candidates = root.path("candidates");
                if (candidates.isArray() && !candidates.isEmpty()) {
                    return new AdminAiConfigTestResponse(true, "Kết nối Gemini thành công.", model);
                }
            }
            
            return new AdminAiConfigTestResponse(false, "Gemini trả về kết quả không mong đợi.", model);

        } catch (org.springframework.web.client.HttpClientErrorException e) {
            String msg = "Không kết nối được Gemini. Vui lòng kiểm tra API key hoặc model.";
            if (e.getStatusCode().value() == 404) {
                msg = "Model không tồn tại hoặc không được API key này hỗ trợ.";
            } else if (e.getStatusCode().value() == 401 || e.getStatusCode().value() == 403) {
                msg = "API Key không hợp lệ hoặc không có quyền truy cập model này.";
            }
            return new AdminAiConfigTestResponse(false, msg, model);
        } catch (Exception e) {
            log.error("[AI Config] Test connection failed for model: {}", model, e);
            return new AdminAiConfigTestResponse(false, "Lỗi kết nối: " + e.getMessage(), model);
        }
    }

    public ResolvedGeminiConfig resolveGeminiConfig() {
        try {
            AiProviderConfig db = repository.findByProvider("GEMINI");
            String apiKey = db.apiKeyEncrypted() != null ? encryptionUtils.decrypt(db.apiKeyEncrypted()) : envApiKey;
            String model = db.semanticModel();
            return new ResolvedGeminiConfig(db.evaluationEnabled(), apiKey, model, db.timeoutMs());
        } catch (Exception e) {
            return new ResolvedGeminiConfig(envEnabled, envApiKey, envModel, envTimeout);
        }
    }
}
