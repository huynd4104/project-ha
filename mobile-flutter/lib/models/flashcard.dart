import 'model_helpers.dart';

class Flashcard {
  const Flashcard({
    required this.id,
    required this.lessonId,
    required this.frontText,
    required this.backText,
    this.imageUrl,
    this.audioUrl,
    this.orderIndex = 0,
  });
  final String id;
  final String lessonId;
  final String frontText;
  final String backText;
  final String? imageUrl;
  final String? audioUrl;
  final int orderIndex;

  factory Flashcard.fromMap(String id, Map<String, dynamic> map) => Flashcard(
    id: id,
    lessonId: '${map['lessonId'] ?? ''}',
    frontText: '${map['frontText'] ?? ''}',
    backText: '${map['backText'] ?? ''}',
    imageUrl: map['imageUrl']?.toString(),
    audioUrl: map['audioUrl']?.toString(),
    orderIndex: readInt(map['orderIndex']),
  );

  Map<String, dynamic> toMap() => {
    'lessonId': lessonId,
    'frontText': frontText,
    'backText': backText,
    'imageUrl': imageUrl,
    'audioUrl': audioUrl,
    'orderIndex': orderIndex,
  };
}
