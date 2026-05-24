import 'model_helpers.dart';

class Streak {
  const Streak({
    required this.id,
    required this.userId,
    required this.childId,
    required this.currentStreak,
    required this.longestStreak,
    required this.lastActiveDate,
  });
  final String id;
  final String userId;
  final String childId;
  final int currentStreak;
  final int longestStreak;
  final String lastActiveDate;

  factory Streak.fromMap(String id, Map<String, dynamic> map) => Streak(
    id: id,
    userId: '${map['userId'] ?? ''}',
    childId: '${map['childId'] ?? ''}',
    currentStreak: readInt(map['currentStreak']),
    longestStreak: readInt(map['longestStreak']),
    lastActiveDate: '${map['lastActiveDate'] ?? ''}',
  );

  Map<String, dynamic> toMap() => {
    'userId': userId,
    'childId': childId,
    'currentStreak': currentStreak,
    'longestStreak': longestStreak,
    'lastActiveDate': lastActiveDate,
  };
}
