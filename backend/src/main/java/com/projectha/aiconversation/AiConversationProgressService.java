package com.projectha.aiconversation;

import com.projectha.aiconversation.AiConversationDtos.ChildAiConversationDailyProgressResponse;
import com.projectha.aiconversation.AiConversationDtos.ChildAiConversationProgressOverviewResponse;
import com.projectha.aiconversation.AiConversationDtos.ChildAiConversationRecommendationResponse;
import com.projectha.aiconversation.AiConversationDtos.ChildAiConversationTopicProgressResponse;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class AiConversationProgressService {
    private final AiConversationProgressDailyRepository dailyRepository;
    private final AiConversationTopicProgressRepository topicProgressRepository;
    private final AiConversationTopicRepository topicRepository;

    public AiConversationProgressService(
        AiConversationProgressDailyRepository dailyRepository,
        AiConversationTopicProgressRepository topicProgressRepository,
        AiConversationTopicRepository topicRepository
    ) {
        this.dailyRepository = dailyRepository;
        this.topicProgressRepository = topicProgressRepository;
        this.topicRepository = topicRepository;
    }

    public void updateAfterSession(AiConversationSession session) {
        if (session.endedAt() == null || session.topicId() == null) return;
        dailyRepository.rebuildForDate(session.userId(), session.childId(), session.endedAt().toLocalDate());
        topicProgressRepository.rebuildForTopic(session.userId(), session.childId(), session.topicId());
    }

    public ChildAiConversationProgressOverviewResponse overview(UUID userId, UUID childId) {
        List<AiConversationProgressDaily> daily = dailyRepository.findByChild(userId, childId);
        List<ChildAiConversationTopicProgressResponse> topics = topicProgress(userId, childId);
        int completedSessions = daily.stream().mapToInt(AiConversationProgressDaily::completedSessions).sum();
        int totalDuration = daily.stream().mapToInt(AiConversationProgressDaily::totalDurationSeconds).sum();
        int totalQuestions = daily.stream().mapToInt(AiConversationProgressDaily::totalQuestions).sum();
        int positive = daily.stream().mapToInt(item -> item.totalCorrect() + item.totalPartiallyCorrect()).sum();
        double positiveRate = totalQuestions == 0 ? 0 : round((double) positive / totalQuestions);
        List<String> strong = topics.stream()
            .filter(item -> item.totalQuestions() > 0 && item.averageScore() >= 0.75)
            .sorted(Comparator.comparingDouble(ChildAiConversationTopicProgressResponse::averageScore).reversed())
            .limit(3)
            .map(ChildAiConversationTopicProgressResponse::topicTitle)
            .toList();
        List<String> needsPractice = topics.stream()
            .filter(item -> item.needsPractice() || (item.totalQuestions() > 0 && item.averageScore() < 0.65))
            .sorted(Comparator.comparingDouble(ChildAiConversationTopicProgressResponse::averageScore))
            .limit(3)
            .map(ChildAiConversationTopicProgressResponse::topicTitle)
            .toList();
        return new ChildAiConversationProgressOverviewResponse(completedSessions, totalDuration, totalQuestions, positiveRate, strong, needsPractice);
    }

    public List<ChildAiConversationDailyProgressResponse> dailyProgress(UUID userId, UUID childId) {
        return dailyRepository.findByChild(userId, childId).stream()
            .map(item -> new ChildAiConversationDailyProgressResponse(
                item.progressDate(),
                item.totalSessions(),
                item.completedSessions(),
                item.totalDurationSeconds(),
                item.totalQuestions(),
                item.totalCorrect(),
                item.totalPartiallyCorrect(),
                item.totalIncorrect(),
                item.averageScore()
            ))
            .toList();
    }

    public List<ChildAiConversationTopicProgressResponse> topicProgress(UUID userId, UUID childId) {
        Map<UUID, String> titles = topicRepository.findAll().stream()
            .collect(Collectors.toMap(AiConversationTopic::id, AiConversationTopic::title));
        return topicProgressRepository.findByChild(userId, childId).stream()
            .map(item -> new ChildAiConversationTopicProgressResponse(
                item.topicId(),
                titles.getOrDefault(item.topicId(), "Chủ đề đã xóa"),
                item.totalSessions(),
                item.totalQuestions(),
                item.totalCorrect(),
                item.totalPartiallyCorrect(),
                item.totalIncorrect(),
                item.averageScore(),
                item.lastPracticedAt(),
                item.needsPractice()
            ))
            .toList();
    }

    public List<ChildAiConversationRecommendationResponse> recommendations(UUID userId, UUID childId) {
        List<ChildAiConversationTopicProgressResponse> topics = topicProgress(userId, childId);
        List<ChildAiConversationRecommendationResponse> needs = topics.stream()
            .filter(item -> item.needsPractice() || item.averageScore() < 0.65)
            .limit(3)
            .map(item -> new ChildAiConversationRecommendationResponse(
                "Luyện thêm " + item.topicTitle(),
                "Nên luyện chủ đề " + item.topicTitle() + " thêm 2-3 lần tuần này. Hãy khuyến khích bé trả lời bằng câu ngắn.",
                item.topicId(),
                item.topicTitle()
            ))
            .toList();
        if (!needs.isEmpty()) return needs;
        return List.of(new ChildAiConversationRecommendationResponse(
            "Duy trì nhịp luyện nói",
            "Bé đang có tín hiệu tốt. Phụ huynh có thể luyện 3 phút mỗi ngày và khen nỗ lực của bé.",
            null,
            ""
        ));
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
