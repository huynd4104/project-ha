package com.projectha.aiconversation;

import com.projectha.aiconversation.AiConversationDtos.AdminAiConversationQuestionRequest;
import com.projectha.aiconversation.AiConversationDtos.AdminAiConversationQuestionResponse;
import com.projectha.aiconversation.AiConversationDtos.AdminAiConversationTopicRequest;
import com.projectha.aiconversation.AiConversationDtos.AdminAiConversationTopicResponse;
import com.projectha.common.BadRequestException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AiConversationAdminService {
    private final AiConversationTopicRepository topicRepository;
    private final AiConversationQuestionRepository questionRepository;

    public AiConversationAdminService(
        AiConversationTopicRepository topicRepository,
        AiConversationQuestionRepository questionRepository
    ) {
        this.topicRepository = topicRepository;
        this.questionRepository = questionRepository;
    }

    public List<AdminAiConversationTopicResponse> topics() {
        return topicRepository.findAll().stream().map(AiConversationDtoMapper::adminTopic).toList();
    }

    @Transactional
    public AdminAiConversationTopicResponse createTopic(AdminAiConversationTopicRequest request) {
        validateTopic(request);
        return AiConversationDtoMapper.adminTopic(topicRepository.create(topicPayload(request)));
    }

    @Transactional
    public AdminAiConversationTopicResponse updateTopic(UUID id, AdminAiConversationTopicRequest request) {
        validateTopic(request);
        return AiConversationDtoMapper.adminTopic(topicRepository.update(id, topicPayload(request)));
    }

    @Transactional
    public AdminAiConversationTopicResponse setTopicActive(UUID id, boolean active) {
        return AiConversationDtoMapper.adminTopic(topicRepository.setActive(id, active));
    }

    @Transactional
    public void deleteTopic(UUID id) {
        topicRepository.delete(id);
    }

    public List<AdminAiConversationQuestionResponse> questions(UUID topicId) {
        topicRepository.require(topicId);
        return questionRepository.findAllByTopic(topicId).stream().map(AiConversationDtoMapper::adminQuestion).toList();
    }

    @Transactional
    public AdminAiConversationQuestionResponse createQuestion(UUID topicId, AdminAiConversationQuestionRequest request) {
        topicRepository.require(topicId);
        validateQuestion(request);
        return AiConversationDtoMapper.adminQuestion(questionRepository.create(topicId, questionPayload(request)));
    }

    @Transactional
    public AdminAiConversationQuestionResponse updateQuestion(UUID id, AdminAiConversationQuestionRequest request) {
        validateQuestion(request);
        return AiConversationDtoMapper.adminQuestion(questionRepository.update(id, questionPayload(request)));
    }

    @Transactional
    public AdminAiConversationQuestionResponse setQuestionActive(UUID id, boolean active) {
        return AiConversationDtoMapper.adminQuestion(questionRepository.setActive(id, active));
    }

    @Transactional
    public void deleteQuestion(UUID id) {
        questionRepository.delete(id);
    }

    private void validateTopic(AdminAiConversationTopicRequest request) {
        if (blank(request.title())) throw new BadRequestException("Tên chủ đề không được để trống.");
        int duration = request.estimatedDurationSeconds() == null ? 180 : request.estimatedDurationSeconds();
        if (duration < 30 || duration > 600) throw new BadRequestException("Thời lượng nên nằm trong khoảng 30-600 giây.");
    }

    private void validateQuestion(AdminAiConversationQuestionRequest request) {
        if (blank(request.questionText())) throw new BadRequestException("question_text không được để trống.");
        if (blank(request.evaluationType())) throw new BadRequestException("evaluation_type không được để trống.");
        AiConversationEvaluationType type;
        try {
            type = AiConversationEvaluationType.valueOf(request.evaluationType().toUpperCase(Locale.ROOT));
        } catch (Exception e) {
            throw new BadRequestException("evaluation_type không hợp lệ.");
        }
        int maxAttempts = request.maxAttempts() == null ? 2 : request.maxAttempts();
        if (maxAttempts < 1) throw new BadRequestException("max_attempts phải >= 1.");
        if (type == AiConversationEvaluationType.KEYWORD && (request.acceptedKeywords() == null || request.acceptedKeywords().isEmpty())) {
            throw new BadRequestException("accepted_keywords không được rỗng khi evaluation_type là KEYWORD.");
        }
    }

    private Map<String, Object> topicPayload(AdminAiConversationTopicRequest request) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("title", request.title().trim());
        payload.put("description", request.description() == null ? "" : request.description().trim());
        payload.put("ageRangeMin", request.ageRangeMin());
        payload.put("ageRangeMax", request.ageRangeMax());
        payload.put("difficultyLevel", text(request.difficultyLevel(), "BEGINNER"));
        payload.put("iconName", text(request.iconName(), "chat_bubble"));
        payload.put("mascotReaction", text(request.mascotReaction(), "welcome"));
        payload.put("estimatedDurationSeconds", request.estimatedDurationSeconds() == null ? 180 : request.estimatedDurationSeconds());
        payload.put("isActive", request.isActive() == null || request.isActive());
        payload.put("sortOrder", request.sortOrder() == null ? 0 : request.sortOrder());
        return payload;
    }

    private Map<String, Object> questionPayload(AdminAiConversationQuestionRequest request) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("questionText", request.questionText().trim());
        payload.put("questionAudioText", text(request.questionAudioText(), request.questionText().trim()));
        payload.put("expectedAnswer", text(request.expectedAnswer(), ""));
        payload.put("acceptedKeywords", request.acceptedKeywords() == null ? List.of() : request.acceptedKeywords());
        payload.put("alternativeAnswers", request.alternativeAnswers() == null ? List.of() : request.alternativeAnswers());
        payload.put("evaluationType", request.evaluationType().toUpperCase(Locale.ROOT));
        payload.put("advancePolicy", request.advancePolicy() != null ? request.advancePolicy().toUpperCase(Locale.ROOT) : "ON_CORRECT_ONLY");
        payload.put("allowSkip", request.allowSkip() == null ? true : request.allowSkip());
        payload.put("skipAfterAttempts", request.skipAfterAttempts() == null ? (request.maxAttempts() == null ? 3 : request.maxAttempts()) : request.skipAfterAttempts());
        payload.put("retryPromptText", text(request.retryPromptText(), ""));
        payload.put("correctFeedback", text(request.correctFeedback(), ""));
        payload.put("hintText", text(request.hintText(), ""));
        payload.put("positiveFeedback", text(request.positiveFeedback(), ""));
        payload.put("retryFeedback", text(request.retryFeedback(), ""));
        payload.put("maxAttempts", request.maxAttempts() == null ? 3 : request.maxAttempts());
        payload.put("difficultyLevel", text(request.difficultyLevel(), "BEGINNER"));
        payload.put("sortOrder", request.sortOrder() == null ? 0 : request.sortOrder());
        payload.put("isActive", request.isActive() == null || request.isActive());
        return payload;
    }

    private boolean blank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String text(String value, String fallback) {
        return value == null || value.trim().isEmpty() ? fallback : value.trim();
    }
}
