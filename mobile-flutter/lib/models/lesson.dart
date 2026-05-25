import 'npc.dart';
import 'model_helpers.dart';
import 'domain.dart';

enum LessonType { math, dialogue, flashcard, thinking, spelling, rhyme }

LessonType lessonTypeFromString(String value) {
  switch (value.toUpperCase()) {
    case 'DIALOGUE':
      return LessonType.dialogue;
    case 'FLASHCARD':
      return LessonType.flashcard;
    case 'THINKING':
      return LessonType.thinking;
    case 'SPELLING':
      return LessonType.spelling;
    case 'RHYME':
      return LessonType.rhyme;
    default:
      return LessonType.math;
  }
}

String lessonTypeToString(LessonType value) => value.name.toUpperCase();

class Lesson {
  const Lesson({
    required this.id,
    required this.title,
    required this.description,
    required this.type,
    required this.orderIndex,
    this.programId,
    this.pathId,
    this.lessonType = 'MATH',
    this.level = LearningLevel.beginner,
    this.skillTags = const [],
    this.difficultyCategories = const [],
    this.learningGoals = const [],
    this.estimatedMinutes = 3,
    this.npcId,
    this.npc,
    this.accessType = AccessType.free,
    this.publishStatus = PublishStatus.published,
    this.isActive = true,
  });

  final String id;
  final String title;
  final String description;
  final LessonType type;
  final int orderIndex;
  final String? programId;
  final String? pathId;
  final String lessonType;
  final LearningLevel level;
  final List<String> skillTags;
  final List<DevelopmentCategoryKey> difficultyCategories;
  final List<LearningGoalKey> learningGoals;
  final int estimatedMinutes;
  final String? npcId;
  final NPC? npc;
  final AccessType accessType;
  final PublishStatus publishStatus;
  final bool isActive;

  factory Lesson.fromMap(String id, Map<String, dynamic> map, {NPC? npc}) {
    final rawType = '${map['lessonType'] ?? map['type'] ?? 'MATH'}';
    final active = map['isActive'] != false;
    return Lesson(
      id: id,
      title: '${map['title'] ?? ''}',
      description: '${map['description'] ?? ''}',
      type: lessonTypeFromString(rawType),
      orderIndex: readInt(map['orderIndex']),
      programId: map['programId']?.toString(),
      pathId: map['pathId']?.toString(),
      lessonType: rawType.toUpperCase(),
      level: learningLevelFromString(map['level']),
      skillTags: readStringList(map['skillTags']),
      difficultyCategories: developmentCategoryListFrom(
        map['difficultyCategories'],
      ),
      learningGoals: learningGoalListFrom(map['learningGoals']),
      estimatedMinutes: readInt(map['estimatedMinutes'], 3),
      npcId: map['npcId']?.toString(),
      npc: npc,
      accessType: accessTypeFromString(map['accessType']),
      publishStatus: map['publishStatus'] == null
          ? (active ? PublishStatus.published : PublishStatus.draft)
          : publishStatusFromString(map['publishStatus']),
      isActive: active,
    );
  }

  Map<String, dynamic> toMap() => {
    'title': title,
    'description': description,
    'type': lessonTypeToString(type),
    'lessonType': lessonType,
    'orderIndex': orderIndex,
    'programId': programId,
    'pathId': pathId,
    'level': level.apiValue,
    'skillTags': skillTags,
    'difficultyCategories': difficultyCategories
        .map((item) => item.apiValue)
        .toList(),
    'learningGoals': learningGoals.map((item) => item.apiValue).toList(),
    'estimatedMinutes': estimatedMinutes,
    'npcId': npcId,
    'accessType': accessType.apiValue,
    'publishStatus': publishStatus.apiValue,
    'isActive': isActive,
  };
}
