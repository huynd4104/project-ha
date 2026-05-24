import 'model_helpers.dart';

class DailyMission {
  const DailyMission({
    required this.id,
    required this.title,
    required this.description,
    required this.type,
    this.targetValue = 1,
    this.rewardXp = 0,
    this.isActive = true,
  });
  final String id;
  final String title;
  final String description;
  final String type;
  final int targetValue;
  final int rewardXp;
  final bool isActive;

  factory DailyMission.fromMap(String id, Map<String, dynamic> map) =>
      DailyMission(
        id: id,
        title: '${map['title'] ?? ''}',
        description: '${map['description'] ?? ''}',
        type: '${map['type'] ?? ''}',
        targetValue: readInt(map['targetValue'], 1),
        rewardXp: readInt(map['rewardXp']),
        isActive: map['isActive'] != false,
      );

  Map<String, dynamic> toMap() => {
    'title': title,
    'description': description,
    'type': type,
    'targetValue': targetValue,
    'rewardXp': rewardXp,
    'isActive': isActive,
  };
}
