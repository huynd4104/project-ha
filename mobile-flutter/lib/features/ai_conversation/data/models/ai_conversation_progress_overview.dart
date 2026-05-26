import '../../../../models/model_helpers.dart';

class AiConversationProgressOverview {
  const AiConversationProgressOverview({
    required this.childId,
    required this.totalCompletedSessions,
    required this.totalDurationSeconds,
    required this.totalAnsweredQuestions,
    required this.goodResponseRate,
    required this.strongTopics,
    required this.needsPracticeTopics,
  });

  final String childId;
  final int totalCompletedSessions;
  final int totalDurationSeconds;
  final int totalAnsweredQuestions;
  final double goodResponseRate;
  final List<String> strongTopics;
  final List<String> needsPracticeTopics;

  factory AiConversationProgressOverview.fromMap(Map<String, dynamic> map) =>
      AiConversationProgressOverview(
        childId: '${map['childId'] ?? ''}',
        totalCompletedSessions: readInt(
          map['totalCompletedSessions'] ?? map['completedSessions'],
        ),
        totalDurationSeconds: readInt(map['totalDurationSeconds']),
        totalAnsweredQuestions: readInt(map['totalAnsweredQuestions']),
        goodResponseRate: readDouble(
          map['goodResponseRate'] ?? map['positiveResponseRate'],
        ),
        strongTopics: readStringList(map['strongTopics']),
        needsPracticeTopics: readStringList(map['needsPracticeTopics']),
      );
}
