import 'package:flutter/foundation.dart';

import '../data/models/ai_conversation_progress_overview.dart';
import '../data/models/ai_conversation_recommendation.dart';
import '../data/models/ai_conversation_session_history.dart';
import '../data/models/ai_conversation_topic_progress.dart';
import '../data/repositories/ai_conversation_repository.dart';

class AiConversationProgressController extends ChangeNotifier {
  AiConversationProgressController({AiConversationRepository? repository})
    : _repository = repository ?? AiConversationRepository();

  final AiConversationRepository _repository;
  bool loading = false;
  String? error;
  AiConversationProgressOverview? overview;
  List<AiConversationTopicProgress> topicProgress = const [];
  List<AiConversationSessionHistory> recentSessions = const [];
  List<AiConversationRecommendation> recommendations = const [];

  Future<void> load(String childId) async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      final results = await Future.wait([
        _repository.progressOverview(childId),
        _repository.topicProgress(childId),
        _repository.sessionHistory(childId),
        _repository.recommendations(childId),
      ]);
      overview = results[0] as AiConversationProgressOverview;
      topicProgress = results[1] as List<AiConversationTopicProgress>;
      recentSessions = results[2] as List<AiConversationSessionHistory>;
      recommendations = results[3] as List<AiConversationRecommendation>;
    } catch (e) {
      error = e.toString();
    } finally {
      loading = false;
      notifyListeners();
    }
  }
}
