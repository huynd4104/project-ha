import '../../../../models/model_helpers.dart';

class AiConversationSummary {
  const AiConversationSummary({
    required this.sessionId,
    required this.topicId,
    required this.topicTitle,
    required this.status,
    required this.durationSeconds,
    required this.totalQuestions,
    required this.answeredQuestions,
    required this.correctAnswers,
    required this.partiallyCorrectAnswers,
    required this.incorrectAnswers,
    required this.needsPracticeCount,
    required this.averageScore,
    required this.summaryFeedback,
    required this.startedAt,
    required this.endedAt,
  });

  final String sessionId;
  final String topicId;
  final String topicTitle;
  final String status;
  final int durationSeconds;
  final int totalQuestions;
  final int answeredQuestions;
  final int correctAnswers;
  final int partiallyCorrectAnswers;
  final int incorrectAnswers;
  final int needsPracticeCount;
  final double averageScore;
  final String summaryFeedback;
  final DateTime? startedAt;
  final DateTime? endedAt;

  factory AiConversationSummary.fromMap(Map<String, dynamic> map) =>
      AiConversationSummary(
        sessionId: '${map['sessionId'] ?? ''}',
        topicId: '${map['topicId'] ?? ''}',
        topicTitle: '${map['topicTitle'] ?? ''}',
        status: '${map['status'] ?? ''}',
        durationSeconds: readInt(map['durationSeconds']),
        totalQuestions: readInt(map['totalQuestions']),
        answeredQuestions: readInt(map['answeredQuestions']),
        correctAnswers: readInt(map['correctAnswers']),
        partiallyCorrectAnswers: readInt(map['partiallyCorrectAnswers']),
        incorrectAnswers: readInt(map['incorrectAnswers']),
        needsPracticeCount: readInt(map['needsPracticeCount']),
        averageScore: readDouble(map['averageScore']),
        summaryFeedback: '${map['summaryFeedback'] ?? ''}',
        startedAt: readDate(map['startedAt']),
        endedAt: readDate(map['endedAt']),
      );
}
