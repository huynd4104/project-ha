import '../../../../core/api/api_client.dart';
import '../models/ai_conversation_daily_progress.dart';
import '../models/ai_conversation_progress_overview.dart';
import '../models/ai_conversation_question.dart';
import '../models/ai_conversation_recommendation.dart';
import '../models/ai_conversation_session.dart';
import '../models/ai_conversation_session_history.dart';
import '../models/ai_conversation_summary.dart';
import '../models/ai_conversation_topic.dart';
import '../models/ai_conversation_topic_progress.dart';
import '../models/ai_conversation_turn_result.dart';

class AiConversationApiService {
  AiConversationApiService({ApiClient? api}) : _api = api ?? ApiClient.instance;

  final ApiClient _api;

  Future<List<AiConversationTopic>> topics() async {
    final data = await _api.get('/api/ai-conversations/topics') as List;
    return data
        .map(
          (item) => AiConversationTopic.fromMap(
            Map<String, dynamic>.from(item as Map),
          ),
        )
        .toList();
  }

  Future<List<AiConversationQuestion>> questions(String topicId) async {
    final data =
        await _api.get('/api/ai-conversations/topics/$topicId/questions')
            as List;
    return data
        .map(
          (item) => AiConversationQuestion.fromMap(
            Map<String, dynamic>.from(item as Map),
          ),
        )
        .toList();
  }

  Future<AiConversationSession> startSession({
    required String userId,
    required String childId,
    required String topicId,
  }) async {
    final data =
        await _api.post('/api/ai-conversations/sessions/start', {
              'childId': childId,
              'topicId': topicId,
            })
            as Map<String, dynamic>;
    return AiConversationSession.fromMap(data);
  }

  Future<AiConversationTurnResult> submitTurn({
    required String sessionId,
    required String questionId,
    required int turnOrder,
    required String transcript,
    required int attemptNo,
    required bool hintUsed,
  }) async {
    final data =
        await _api.post('/api/ai-conversations/sessions/$sessionId/turns', {
              'questionId': questionId,
              'childTranscript': transcript,
              'attemptNo': attemptNo,
              'hintUsed': hintUsed,
            })
            as Map<String, dynamic>;
    return AiConversationTurnResult.fromMap(data);
  }

  Future<AiConversationSummary> completeSession(String sessionId) async {
    final data =
        await _api.post(
              '/api/ai-conversations/sessions/$sessionId/complete',
              <String, dynamic>{},
            )
            as Map<String, dynamic>;
    return AiConversationSummary.fromMap(data);
  }

  Future<AiConversationSummary> sessionSummary(String sessionId) async {
    final data =
        await _api.get('/api/ai-conversations/sessions/$sessionId/summary')
            as Map<String, dynamic>;
    return AiConversationSummary.fromMap(data);
  }

  Future<Map<String, dynamic>> liveToken(String sessionId) async {
    final data =
        await _api.post(
              '/api/ai-conversations/sessions/$sessionId/live-token',
              <String, dynamic>{},
            )
            as Map<String, dynamic>;
    return data;
  }

  Future<AiConversationProgressOverview> progressOverview(
    String childId,
  ) async {
    final data =
        await _api.get(
              '/api/parent/children/$childId/ai-conversations/progress/overview',
            )
            as Map<String, dynamic>;
    return AiConversationProgressOverview.fromMap(data);
  }

  Future<List<AiConversationDailyProgress>> dailyProgress(
    String childId,
  ) async {
    final data =
        await _api.get(
              '/api/parent/children/$childId/ai-conversations/progress/daily',
            )
            as List;
    return data
        .map(
          (item) => AiConversationDailyProgress.fromMap(
            Map<String, dynamic>.from(item as Map),
          ),
        )
        .toList();
  }

  Future<List<AiConversationTopicProgress>> topicProgress(
    String childId,
  ) async {
    final data =
        await _api.get(
              '/api/parent/children/$childId/ai-conversations/progress/topics',
            )
            as List;
    return data
        .map(
          (item) => AiConversationTopicProgress.fromMap(
            Map<String, dynamic>.from(item as Map),
          ),
        )
        .toList();
  }

  Future<List<AiConversationSessionHistory>> sessionHistory(
    String childId,
  ) async {
    final data =
        await _api.get(
              '/api/parent/children/$childId/ai-conversations/sessions',
            )
            as List;
    return data
        .map(
          (item) => AiConversationSessionHistory.fromMap(
            Map<String, dynamic>.from(item as Map),
          ),
        )
        .toList();
  }

  Future<AiConversationSessionDetail> sessionDetail(
    String childId,
    String sessionId,
  ) async {
    final data =
        await _api.get(
              '/api/parent/children/$childId/ai-conversations/sessions/$sessionId',
            )
            as Map<String, dynamic>;
    return AiConversationSessionDetail.fromMap(data);
  }

  Future<List<AiConversationRecommendation>> recommendations(
    String childId,
  ) async {
    final data =
        await _api.get(
              '/api/parent/children/$childId/ai-conversations/recommendations',
            )
            as List;
    return data
        .map(
          (item) => AiConversationRecommendation.fromMap(
            Map<String, dynamic>.from(item as Map),
          ),
        )
        .toList();
  }
}
