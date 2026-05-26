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
import '../services/ai_conversation_api_service.dart';

class AiConversationRepository {
  AiConversationRepository({AiConversationApiService? api})
    : _api = api ?? AiConversationApiService();

  final AiConversationApiService _api;

  Future<List<AiConversationTopic>> topics() => _api.topics();

  Future<List<AiConversationQuestion>> questions(String topicId) =>
      _api.questions(topicId);

  Future<AiConversationSession> startSession({
    required String userId,
    required String childId,
    required String topicId,
  }) => _api.startSession(userId: userId, childId: childId, topicId: topicId);

  Future<AiConversationTurnResult> submitTurn({
    required String sessionId,
    required String questionId,
    required int turnOrder,
    required String transcript,
    required int attemptNo,
    required bool hintUsed,
  }) => _api.submitTurn(
    sessionId: sessionId,
    questionId: questionId,
    turnOrder: turnOrder,
    transcript: transcript,
    attemptNo: attemptNo,
    hintUsed: hintUsed,
  );

  Future<AiConversationSummary> completeSession(String sessionId) =>
      _api.completeSession(sessionId);

  Future<AiConversationSummary> sessionSummary(String sessionId) =>
      _api.sessionSummary(sessionId);

  Future<Map<String, dynamic>> liveToken(String sessionId) =>
      _api.liveToken(sessionId);

  Future<AiConversationProgressOverview> progressOverview(String childId) =>
      _api.progressOverview(childId);

  Future<List<AiConversationDailyProgress>> dailyProgress(String childId) =>
      _api.dailyProgress(childId);

  Future<List<AiConversationTopicProgress>> topicProgress(String childId) =>
      _api.topicProgress(childId);

  Future<List<AiConversationSessionHistory>> sessionHistory(String childId) =>
      _api.sessionHistory(childId);

  Future<AiConversationSessionDetail> sessionDetail(
    String childId,
    String sessionId,
  ) => _api.sessionDetail(childId, sessionId);

  Future<List<AiConversationRecommendation>> recommendations(String childId) =>
      _api.recommendations(childId);
}
