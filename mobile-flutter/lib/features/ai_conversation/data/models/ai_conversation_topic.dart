import '../../../../models/model_helpers.dart';

class AiConversationTopic {
  const AiConversationTopic({
    required this.id,
    required this.title,
    required this.description,
    required this.ageRangeMin,
    required this.ageRangeMax,
    required this.difficultyLevel,
    required this.iconName,
    required this.mascotReaction,
    required this.estimatedDurationSeconds,
    required this.isActive,
  });

  final String id;
  final String title;
  final String description;
  final int? ageRangeMin;
  final int? ageRangeMax;
  final int difficultyLevel;
  final String iconName;
  final String mascotReaction;
  final int estimatedDurationSeconds;
  final bool isActive;

  factory AiConversationTopic.fromMap(Map<String, dynamic> map) =>
      AiConversationTopic(
        id: '${map['id'] ?? ''}',
        title: '${map['title'] ?? ''}',
        description: '${map['description'] ?? ''}',
        ageRangeMin: map['ageRangeMin'] == null
            ? null
            : readInt(map['ageRangeMin']),
        ageRangeMax: map['ageRangeMax'] == null
            ? null
            : readInt(map['ageRangeMax']),
        difficultyLevel: readInt(map['difficultyLevel'], 1),
        iconName: '${map['iconName'] ?? ''}',
        mascotReaction: '${map['mascotReaction'] ?? 'welcome'}',
        estimatedDurationSeconds: readInt(map['estimatedDurationSeconds'], 180),
        isActive: map['isActive'] != false,
      );
}
