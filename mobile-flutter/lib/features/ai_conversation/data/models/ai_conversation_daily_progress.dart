import '../../../../models/model_helpers.dart';

class AiConversationDailyProgress {
  const AiConversationDailyProgress({
    required this.progressDate,
    required this.totalSessions,
    required this.completedSessions,
    required this.totalDurationSeconds,
    required this.totalQuestions,
    required this.totalCorrect,
    required this.totalPartiallyCorrect,
    required this.totalIncorrect,
    required this.averageScore,
  });

  final DateTime? progressDate;
  final int totalSessions;
  final int completedSessions;
  final int totalDurationSeconds;
  final int totalQuestions;
  final int totalCorrect;
  final int totalPartiallyCorrect;
  final int totalIncorrect;
  final double averageScore;

  factory AiConversationDailyProgress.fromMap(Map<String, dynamic> map) =>
      AiConversationDailyProgress(
        progressDate: readDate(map['progressDate']),
        totalSessions: readInt(map['totalSessions']),
        completedSessions: readInt(map['completedSessions']),
        totalDurationSeconds: readInt(map['totalDurationSeconds']),
        totalQuestions: readInt(map['totalQuestions']),
        totalCorrect: readInt(map['totalCorrect']),
        totalPartiallyCorrect: readInt(map['totalPartiallyCorrect']),
        totalIncorrect: readInt(map['totalIncorrect']),
        averageScore: readDouble(map['averageScore']),
      );
}
