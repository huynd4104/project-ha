import '../../../../models/model_helpers.dart';

class AiConversationTopicProgress {
  const AiConversationTopicProgress({
    required this.topicId,
    required this.topicTitle,
    required this.totalSessions,
    required this.totalQuestions,
    required this.totalCorrect,
    required this.totalPartiallyCorrect,
    required this.totalIncorrect,
    required this.averageScore,
    required this.lastPracticedAt,
    required this.needsPractice,
  });

  final String topicId;
  final String topicTitle;
  final int totalSessions;
  final int totalQuestions;
  final int totalCorrect;
  final int totalPartiallyCorrect;
  final int totalIncorrect;
  final double averageScore;
  final DateTime? lastPracticedAt;
  final bool needsPractice;

  factory AiConversationTopicProgress.fromMap(Map<String, dynamic> map) =>
      AiConversationTopicProgress(
        topicId: '${map['topicId'] ?? ''}',
        topicTitle: '${map['topicTitle'] ?? ''}',
        totalSessions: readInt(map['totalSessions']),
        totalQuestions: readInt(map['totalQuestions']),
        totalCorrect: readInt(map['totalCorrect']),
        totalPartiallyCorrect: readInt(map['totalPartiallyCorrect']),
        totalIncorrect: readInt(map['totalIncorrect']),
        averageScore: readDouble(map['averageScore']),
        lastPracticedAt: readDate(map['lastPracticedAt']),
        needsPractice: map['needsPractice'] == true,
      );
}
