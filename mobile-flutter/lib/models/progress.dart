import 'model_helpers.dart';

class UserProgress {
  const UserProgress({
    required this.id,
    required this.userId,
    required this.childId,
    required this.lessonId,
    required this.status,
    this.activityType = '',
    this.score = 0,
    this.totalQuestions = 0,
    this.correctAnswers = 0,
  });

  final String id;
  final String userId;
  final String childId;
  final String lessonId;
  final String status;
  final String activityType;
  final int score;
  final int totalQuestions;
  final int correctAnswers;

  factory UserProgress.fromMap(String id, Map<String, dynamic> map) =>
      UserProgress(
        id: id,
        userId: '${map['userId'] ?? ''}',
        childId: '${map['childId'] ?? ''}',
        lessonId: '${map['lessonId'] ?? ''}',
        status: '${map['status'] ?? 'NOT_STARTED'}',
        activityType: '${map['activityType'] ?? ''}',
        score: readInt(map['score']),
        totalQuestions: readInt(map['totalQuestions']),
        correctAnswers: readInt(map['correctAnswers']),
      );

  Map<String, dynamic> toMap() => {
    'userId': userId,
    'childId': childId,
    'lessonId': lessonId,
    'status': status,
    'activityType': activityType,
    'score': score,
    'totalQuestions': totalQuestions,
    'correctAnswers': correctAnswers,
  };
}
