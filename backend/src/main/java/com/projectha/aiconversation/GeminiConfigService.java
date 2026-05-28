package com.projectha.aiconversation;

import com.projectha.common.EncryptionUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class GeminiConfigService {
    private final AiProviderConfigRepository repository;
    private final EncryptionUtils encryptionUtils;
    
    @Value("${project-ha.ai.gemini.api-key:}") private String envApiKey;
    @Value("${project-ha.ai.gemini.evaluation-model:gemini-3.1-flash-lite}") private String envModel;
    @Value("${project-ha.ai.gemini.evaluation-enabled:false}") private boolean envEnabled;
    @Value("${project-ha.ai.gemini.evaluation-timeout-ms:8000}") private int envTimeout;

    public GeminiConfigService(AiProviderConfigRepository repository, EncryptionUtils encryptionUtils) {
        this.repository = repository;
        this.encryptionUtils = encryptionUtils;
    }

    public ResolvedGeminiConfig resolveGeminiConfig() {
        try {
            AiProviderConfig dbConfig = repository.findByProvider("GEMINI");
            String apiKey = dbConfig.apiKeyEncrypted() != null ? encryptionUtils.decrypt(dbConfig.apiKeyEncrypted()) : envApiKey;
            String model = dbConfig.semanticModel() != null && !dbConfig.semanticModel().isBlank() ? dbConfig.semanticModel() : envModel;
            
            return new ResolvedGeminiConfig(
                dbConfig.evaluationEnabled(),
                apiKey,
                model,
                dbConfig.timeoutMs()
            );
        } catch (Exception e) {
            // Fallback to env
            return new ResolvedGeminiConfig(envEnabled, envApiKey, envModel, envTimeout);
        }
    }
}
