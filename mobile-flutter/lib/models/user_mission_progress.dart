import 'model_helpers.dart';

class UserMissionProgress {
  const UserMissionProgress({
    required this.id,
    required this.userId,
    required this.childId,
    required this.missionId,
    required this.date,
    this.currentValue = 0,
    this.targetValue = 1,
    this.isCompleted = false,
    this.rewardClaimed = false,
  });
  final String id;
  final String userId;
  final String childId;
  final String missionId;
  final String date;
  final int currentValue;
  final int targetValue;
  final bool isCompleted;
  final bool rewardClaimed;

  factory UserMissionProgress.fromMap(String id, Map<String, dynamic> map) =>
      UserMissionProgress(
        id: id,
        userId: '${map['userId'] ?? ''}',
        childId: '${map['childId'] ?? ''}',
        missionId: '${map['missionId'] ?? ''}',
        date: '${map['date'] ?? ''}',
        currentValue: readInt(map['currentValue']),
        targetValue: readInt(map['targetValue'], 1),
        isCompleted: map['isCompleted'] == true,
        rewardClaimed: map['rewardClaimed'] == true,
      );

  Map<String, dynamic> toMap() => {
    'userId': userId,
    'childId': childId,
    'missionId': missionId,
    'date': date,
    'currentValue': currentValue,
    'targetValue': targetValue,
    'isCompleted': isCompleted,
    'rewardClaimed': rewardClaimed,
  };
}
