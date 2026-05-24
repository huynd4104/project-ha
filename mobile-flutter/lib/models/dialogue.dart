import 'math_question.dart';
import 'model_helpers.dart';

class Dialogue extends MathQuestion {
  const Dialogue({
    required super.id,
    required super.lessonId,
    required this.title,
    required this.sceneText,
    required super.questionText,
    required super.options,
    required super.correctOption,
    super.imageUrl,
    super.explanation,
    super.orderIndex,
    this.audioUrl,
  });

  final String title;
  final String sceneText;
  final String? audioUrl;

  factory Dialogue.fromMap(String id, Map<String, dynamic> map) => Dialogue(
    id: id,
    lessonId: '${map['lessonId'] ?? ''}',
    title: '${map['title'] ?? ''}',
    sceneText: '${map['sceneText'] ?? ''}',
    questionText: '${map['questionText'] ?? ''}',
    options: {
      'A': '${map['optionA'] ?? ''}',
      'B': '${map['optionB'] ?? ''}',
      'C': '${map['optionC'] ?? ''}',
      'D': '${map['optionD'] ?? ''}',
    },
    correctOption: '${map['correctOption'] ?? 'A'}',
    audioUrl: map['audioUrl']?.toString(),
    orderIndex: readInt(map['orderIndex']),
  );
}
