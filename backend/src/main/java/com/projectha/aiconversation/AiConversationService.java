package com.projectha.aiconversation;

import com.projectha.aiconversation.AiConversationDtos.AiConversationQuestionResponse;
import com.projectha.aiconversation.AiConversationDtos.AiConversationSessionSummaryResponse;
import com.projectha.aiconversation.AiConversationDtos.AiConversationTopicResponse;
import com.projectha.aiconversation.AiConversationDtos.AiConversationTurnDetailResponse;
import com.projectha.aiconversation.AiConversationDtos.AiLiveTokenResponse;
import com.projectha.aiconversation.AiConversationDtos.ChildAiConversationSessionDetailResponse;
import com.projectha.aiconversation.AiConversationDtos.ChildAiConversationSessionHistoryResponse;
import com.projectha.aiconversation.AiConversationDtos.CompleteAiConversationSessionRequest;
import com.projectha.aiconversation.AiConversationDtos.StartAiConversationSessionRequest;
import com.projectha.aiconversation.AiConversationDtos.StartAiConversationSessionResponse;
import com.projectha.aiconversation.AiConversationDtos.SubmitAiConversationTurnRequest;
import com.projectha.aiconversation.AiConversationDtos.SubmitAiConversationTurnResponse;
import com.projectha.child.ChildRepository;
import com.projectha.common.BadRequestException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AiConversationService {
    private static final Logger log = LoggerFactory.getLogger(AiConversationService.class);

    private final ChildRepository childRepository;
    private final AiConversationTopicRepository topicRepository;
    private final AiConversationQuestionRepository questionRepository;
    private final AiConversationSessionRepository sessionRepository;
    private final AiConversationTurnRepository turnRepository;
    private final AiConversationEvaluationService evaluationService;
    private final AiConversationProgressService progressService;
    private final AiLiveSessionService liveSessionService;
    private final String aiModel;

    public AiConversationService(
        ChildRepository childRepository,
        AiConversationTopicRepository topicRepository,
        AiConversationQuestionRepository questionRepository,
        AiConversationSessionRepository sessionRepository,
        AiConversationTurnRepository turnRepository,
        AiConversationEvaluationService evaluationService,
        AiConversationProgressService progressService,
        AiLiveSessionService liveSessionService,
        @Value("${project-ha.ai.gemini.live-model:gemini-3.1-flash-live-preview}") String aiModel
    ) {
        this.childRepository = childRepository;
        this.topicRepository = topicRepository;
        this.questionRepository = questionRepository;
        this.sessionRepository = sessionRepository;
        this.turnRepository = turnRepository;
        this.evaluationService = evaluationService;
        this.progressService = progressService;
        this.liveSessionService = liveSessionService;
        this.aiModel = aiModel;
    }

    public List<AiConversationTopicResponse> topics() {
        return topicRepository.findActive().stream().map(AiConversationDtoMapper::topic).toList();
    }

    public List<AiConversationQuestionResponse> questions(UUID topicId) {
        topicRepository.require(topicId);
        return questionRepository.findActiveByTopic(topicId).stream().map(AiConversationDtoMapper::question).toList();
    }

    @Transactional
    public StartAiConversationSessionResponse start(UUID userId, StartAiConversationSessionRequest request) {
        if (request.childId() == null) throw new BadRequestException("childId là bắt buộc.");
        if (request.topicId() == null) throw new BadRequestException("topicId là bắt buộc.");
        childRepository.requireOwned(userId, request.childId());
        AiConversationTopic topic = topicRepository.require(request.topicId());
        if (!topic.isActive()) throw new BadRequestException("Chủ đề này đang tạm ẩn.");
        List<AiConversationQuestion> questions = questionRepository.findActiveByTopic(topic.id());
        if (questions.isEmpty()) throw new BadRequestException("Chủ đề chưa có câu hỏi hoạt động.");

        AiConversationSession session = sessionRepository.create(userId, request.childId(), topic.id(), questions.size(), aiModel, null);
        AiLiveSessionConfig live = liveSessionService.createLiveSession(session, topic, questions);
        sessionRepository.updateLiveSession(session.id(), live.liveSessionId());
        String mode = live.enabled() ? "PRODUCTION" : "MOCK";
        boolean isRealGeminiLive = false;
        return new StartAiConversationSessionResponse(
            session.id(),
            topic.id(),
            live.liveSessionId(),
            live.ephemeralToken(),
            live.model(),
            live.systemInstruction(),
            questions.stream().map(AiConversationDtoMapper::question).toList(),
            topic.estimatedDurationSeconds(),
            mode,
            isRealGeminiLive
        );
    }

    public AiLiveTokenResponse liveToken(UUID userId, UUID sessionId) {
        AiConversationSession session = sessionRepository.requireOwned(userId, sessionId);
        if (session.status() != AiConversationSessionStatus.IN_PROGRESS) {
            throw new BadRequestException("Phiên hội thoại không ở trạng thái phù hợp.");
        }
        if (session.topicId() == null) {
            throw new BadRequestException("Phiên hội thoại thiếu chủ đề.");
        }
        AiConversationTopic topic = topicRepository.require(session.topicId());
        List<AiConversationQuestion> questions = questionRepository.findActiveByTopic(topic.id());
        AiLiveSessionConfig live = liveSessionService.generateLiveToken(session, topic, questions);
        String provider = live.enabled() ? "GEMINI" : "MOCK";
        String mode = live.enabled() ? "PRODUCTION" : "MOCK";
        boolean isRealGeminiLive = false;
        return new AiLiveTokenResponse(
            session.id(),
            provider,
            live.model(),
            live.ephemeralToken(),
            live.expiresAt(),
            live.webSocketUrl(),
            live.systemInstruction(),
            live.responseLanguage(),
            live.maxDurationSeconds(),
            questions.stream().map(AiConversationDtoMapper::question).toList(),
            mode,
            isRealGeminiLive
        );
    }

    @Transactional
    public SubmitAiConversationTurnResponse submitTurn(UUID userId, UUID sessionId, SubmitAiConversationTurnRequest request) {
        if (request.questionId() == null) throw new BadRequestException("questionId là bắt buộc.");
        AiConversationSession session = sessionRepository.requireOwned(userId, sessionId);
        if (session.status() == AiConversationSessionStatus.COMPLETED) {
            throw new BadRequestException("Phiên hội thoại đã hoàn thành.");
        }
        AiConversationQuestion question = questionRepository.require(request.questionId());
        if (session.topicId() != null && !session.topicId().equals(question.topicId())) {
            throw new BadRequestException("Câu hỏi không thuộc chủ đề của phiên.");
        }

        int maxAttempts = question.maxAttempts() > 0 ? question.maxAttempts() : 2;
        int attemptNo = request.attemptNo() != null ? Math.max(1, request.attemptNo()) : 1;

        // ══ EVALUATE ══
        AiConversationEvaluationOutcome outcome = evaluationService.evaluate(question, request.childTranscript());

        // ══ ADVANCE POLICY ══
        AiConversationAdvancePolicy policy = question.advancePolicy() != null
            ? question.advancePolicy()
            : AiConversationAdvancePolicy.ON_CORRECT_ONLY;

        boolean allowSkip = question.allowSkip();
        Integer skipAfterAttempts = question.skipAfterAttempts();
        int effectiveSkipAfterAttempts = skipAfterAttempts != null ? skipAfterAttempts : maxAttempts;
        boolean canSkip = allowSkip && attemptNo >= effectiveSkipAfterAttempts;

        boolean shouldRetry = false;
        boolean shouldAdvance = false;
        String advanceReason = "";

        switch (policy) {
            case ON_CORRECT_ONLY -> {
                switch (outcome.result()) {
                    case CORRECT -> {
                        shouldRetry = false;
                        shouldAdvance = true;
                        advanceReason = "CORRECT";
                    }
                    case PARTIALLY_CORRECT -> {
                        // If score is high enough (>= 0.75), allow advance
                        if (outcome.score() >= 0.75) {
                            shouldRetry = false;
                            shouldAdvance = true;
                            advanceReason = "PARTIALLY_CORRECT_HIGH_SCORE";
                        } else {
                            shouldRetry = true;
                            shouldAdvance = false;
                            advanceReason = "PARTIALLY_CORRECT_LOW_SCORE";
                        }
                    }
                    case INCORRECT, UNCLEAR -> {
                        // ON_CORRECT_ONLY: NEVER auto-advance, even after maxAttempts
                        shouldRetry = true;
                        shouldAdvance = false;
                        advanceReason = "NOT_CORRECT_ON_CORRECT_ONLY";
                        // canSkip is already computed above based on allowSkip + skipAfterAttempts
                    }
                    case SKIPPED -> {
                        shouldRetry = false;
                        shouldAdvance = true;
                        advanceReason = "SKIPPED";
                    }
                }
            }
            case AFTER_MAX_ATTEMPTS -> {
                switch (outcome.result()) {
                    case CORRECT, SKIPPED -> {
                        shouldRetry = false;
                        shouldAdvance = true;
                        advanceReason = outcome.result() == AiConversationEvaluationResult.CORRECT
                            ? "CORRECT" : "SKIPPED";
                    }
                    default -> {
                        if (attemptNo >= maxAttempts) {
                            shouldRetry = false;
                            shouldAdvance = true;
                            advanceReason = "AFTER_MAX_ATTEMPTS";
                        } else {
                            shouldRetry = true;
                            shouldAdvance = false;
                            advanceReason = "AFTER_MAX_ATTEMPTS_NOT_YET";
                        }
                    }
                }
            }
            case MANUAL_SKIP_ONLY -> {
                switch (outcome.result()) {
                    case CORRECT, SKIPPED -> {
                        shouldRetry = false;
                        shouldAdvance = true;
                        advanceReason = outcome.result() == AiConversationEvaluationResult.CORRECT
                            ? "CORRECT" : "SKIPPED";
                    }
                    default -> {
                        shouldRetry = true;
                        shouldAdvance = false;
                        advanceReason = "MANUAL_SKIP_ONLY";
                        canSkip = allowSkip; // Always allow skip if configured
                    }
                }
            }
        }

        // ══ DETERMINE NEXT QUESTION ══
        UUID nextQuestionId = null;
        boolean isSessionCompleted = false;

        if (shouldAdvance) {
            List<AiConversationQuestion> questions = questionRepository.findActiveByTopic(session.topicId());
            int currentIndex = -1;
            for (int i = 0; i < questions.size(); i++) {
                if (questions.get(i).id().equals(question.id())) {
                    currentIndex = i;
                    break;
                }
            }
            if (currentIndex >= 0 && currentIndex < questions.size() - 1) {
                nextQuestionId = questions.get(currentIndex + 1).id();
            } else {
                isSessionCompleted = true;
            }
        }

        // ══ SAVE TURN ══
        AiConversationTurn turn = turnRepository.create(
            session.id(),
            question,
            request.childTranscript(),
            outcome,
            request.hintUsed() != null && request.hintUsed(),
            attemptNo
        );

        String nextAction = shouldAdvance ? "CONTINUE" : (canSkip ? "RETRY_OR_SKIP" : "RETRY_OR_HINT");

        // ══ DEBUG LOG ══
        log.info("[AI Turn Debug]\n" +
            "questionId={}\n" +
            "questionText={}\n" +
            "evaluationType={}\n" +
            "advancePolicy={}\n" +
            "attemptNo={}\n" +
            "maxAttempts={}\n" +
            "allowSkip={}\n" +
            "skipAfterAttempts={}\n" +
            "usedGemini={}\n" +
            "evaluationSource={}\n" +
            "childTranscript={}\n" +
            "evaluationResult={}\n" +
            "score={}\n" +
            "shouldRetry={}\n" +
            "shouldAdvance={}\n" +
            "canSkip={}\n" +
            "advanceReason={}\n" +
            "feedback={}\n" +
            "suggestedRetryText={}",
            question.id(),
            question.questionText(),
            question.evaluationType(),
            policy,
            attemptNo,
            maxAttempts,
            allowSkip,
            effectiveSkipAfterAttempts,
            outcome.usedGemini(),
            outcome.evaluationSource(),
            request.childTranscript(),
            outcome.result(),
            outcome.score(),
            shouldRetry,
            shouldAdvance,
            canSkip,
            advanceReason,
            outcome.feedback(),
            outcome.suggestedRetryText()
        );

        return new SubmitAiConversationTurnResponse(
            turn.id(),
            session.id(),
            question.id(),
            outcome.result().name(),
            outcome.score(),
            outcome.feedback(),
            nextAction,
            shouldRetry,
            shouldAdvance,
            canSkip,
            attemptNo,
            maxAttempts,
            nextQuestionId,
            isSessionCompleted,
            outcome.usedGemini(),
            outcome.evaluationSource(),
            advanceReason,
            outcome.suggestedRetryText()
        );
    }

    @Transactional
    public AiConversationSessionSummaryResponse complete(UUID userId, UUID sessionId, CompleteAiConversationSessionRequest request) {
        AiConversationSession session = sessionRepository.requireOwned(userId, sessionId);
        List<AiConversationTurn> turns = turnRepository.findBySession(session.id());
        int answered = turns.size();
        int correct = count(turns, AiConversationEvaluationResult.CORRECT);
        int partial = count(turns, AiConversationEvaluationResult.PARTIALLY_CORRECT);
        int incorrect = count(turns, AiConversationEvaluationResult.INCORRECT) + count(turns, AiConversationEvaluationResult.UNCLEAR);
        int skipped = Math.max(0, session.totalQuestions() - answered);
        int needsPractice = incorrect + skipped;
        double averageScore = turns.isEmpty() ? 0 : round(turns.stream().mapToDouble(AiConversationTurn::score).average().orElse(0));
        int duration = sessionRepository.elapsedSeconds(session);
        String summaryFeedback = childSummary(answered, correct, partial);
        String parentRecommendation = parentRecommendation(incorrect, skipped, averageScore);
        AiConversationSession completed = sessionRepository.complete(
            session.id(),
            AiConversationSessionStatus.COMPLETED,
            duration,
            session.totalQuestions(),
            answered,
            correct,
            partial,
            incorrect,
            needsPractice,
            averageScore,
            summaryFeedback,
            parentRecommendation
        );
        progressService.updateAfterSession(completed);
        liveSessionService.closeSession(session.liveSessionId());
        return summary(session.id());
    }

    public AiConversationSessionSummaryResponse summary(UUID sessionId) {
        return AiConversationDtoMapper.summary(sessionRepository.summaryRow(sessionId));
    }

    public AiConversationSessionSummaryResponse summary(UUID userId, UUID sessionId) {
        sessionRepository.requireOwned(userId, sessionId);
        return summary(sessionId);
    }

    public List<ChildAiConversationSessionHistoryResponse> history(UUID userId, UUID childId) {
        childRepository.requireOwned(userId, childId);
        return sessionRepository.history(userId, childId).stream().map(this::historyItem).toList();
    }

    public ChildAiConversationSessionDetailResponse detail(UUID userId, UUID childId, UUID sessionId) {
        childRepository.requireOwned(userId, childId);
        sessionRepository.requireForChild(userId, childId, sessionId);
        boolean transcriptVisible = true;
        List<AiConversationTurnDetailResponse> turns = turnRepository.findBySession(sessionId).stream()
            .map(turn -> AiConversationDtoMapper.turnDetail(turn, transcriptVisible))
            .toList();
        return new ChildAiConversationSessionDetailResponse(summary(sessionId), turns, transcriptVisible);
    }

    private ChildAiConversationSessionHistoryResponse historyItem(Map<String, Object> row) {
        return new ChildAiConversationSessionHistoryResponse(
            AiConversationMapper.uuid(row.get("id")),
            AiConversationMapper.nullableUuid(row.get("topicId")),
            AiConversationMapper.str(row.get("topicTitle"), "Chủ đề đã xóa"),
            AiConversationMapper.offset(row.get("startedAt")),
            AiConversationMapper.offset(row.get("endedAt")),
            AiConversationMapper.intValue(row.get("durationSeconds"), 0),
            AiConversationMapper.intValue(row.get("answeredQuestions"), 0),
            AiConversationMapper.intValue(row.get("correctAnswers"), 0),
            AiConversationMapper.intValue(row.get("partiallyCorrectAnswers"), 0),
            AiConversationMapper.intValue(row.get("incorrectAnswers"), 0),
            AiConversationMapper.doubleValue(row.get("averageScore"), 0),
            AiConversationMapper.str(row.get("summaryFeedback"))
        );
    }

    private int count(List<AiConversationTurn> turns, AiConversationEvaluationResult result) {
        return (int) turns.stream().filter(turn -> turn.evaluationResult() == result).count();
    }

    private String childSummary(int answered, int correct, int partial) {
        if (answered == 0) return "Con đã tham gia rồi. Lần sau mình thử nói thêm nhé!";
        if (correct + partial >= answered) return "Con đã hoàn thành rồi! Con trả lời rất cố gắng.";
        return "Con đã hoàn thành rồi! Mình cùng luyện thêm một chút nữa nhé.";
    }

    private String parentRecommendation(int incorrect, int skipped, double averageScore) {
        if (incorrect + skipped == 0 && averageScore >= 0.75) {
            return "Bé phản hồi tốt trong phiên này. Có thể duy trì luyện ngắn mỗi ngày.";
        }
        return "Nên luyện lại các câu bé cần thêm gợi ý, ưu tiên câu ngắn và khen nỗ lực của bé.";
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
