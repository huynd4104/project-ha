import 'npc.dart';
import 'model_helpers.dart';

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
    this.npcId,
    this.npc,
    this.isActive = true,
  });

  final String id;
  final String title;
  final String description;
  final LessonType type;
  final int orderIndex;
  final String? npcId;
  final NPC? npc;
  final bool isActive;

  factory Lesson.fromMap(String id, Map<String, dynamic> map, {NPC? npc}) =>
      Lesson(
        id: id,
        title: '${map['title'] ?? ''}',
        description: '${map['description'] ?? ''}',
        type: lessonTypeFromString('${map['type'] ?? 'MATH'}'),
        orderIndex: readInt(map['orderIndex']),
        npcId: map['npcId']?.toString(),
        npc: npc,
        isActive: map['isActive'] != false,
      );

  Map<String, dynamic> toMap() => {
    'title': title,
    'description': description,
    'type': lessonTypeToString(type),
    'orderIndex': orderIndex,
    'npcId': npcId,
    'isActive': isActive,
  };
}
