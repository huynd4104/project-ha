import 'model_helpers.dart';

class MathQuestion {
  const MathQuestion({
    required this.id,
    required this.lessonId,
    required this.questionText,
    required this.options,
    required this.correctOption,
    this.imageUrl,
    this.explanation = '',
  });
  final String id;
  final String lessonId;
  final String questionText;
  final Map<String, String> options;
  final String correctOption;
  final String? imageUrl;
  final String explanation;

  factory MathQuestion.fromMap(String id, Map<String, dynamic> map) =>
      MathQuestion(
        id: id,
        lessonId: '${map['lessonId'] ?? ''}',
        questionText: '${map['questionText'] ?? ''}',
        options: {
          'A': '${map['optionA'] ?? ''}',
          'B': '${map['optionB'] ?? ''}',
          'C': '${map['optionC'] ?? ''}',
          'D': '${map['optionD'] ?? ''}',
        },
        correctOption: '${map['correctOption'] ?? 'A'}',
        imageUrl: map['imageUrl']?.toString(),
        explanation: '${map['explanation'] ?? ''}',
      );

  Map<String, dynamic> toMap() => {
    'lessonId': lessonId,
    'questionText': questionText,
    'optionA': options['A'],
    'optionB': options['B'],
    'optionC': options['C'],
    'optionD': options['D'],
    'correctOption': correctOption,
    'imageUrl': imageUrl,
    'explanation': explanation,
  };
}
