import '../../../../models/model_helpers.dart';

class AiConversationQuestion {
  const AiConversationQuestion({
    required this.id,
    required this.topicId,
    required this.questionText,
    required this.questionAudioText,
    required this.expectedAnswer,
    required this.acceptedKeywords,
    required this.alternativeAnswers,
    required this.evaluationType,
    required this.hintText,
    required this.positiveFeedback,
    required this.retryFeedback,
    required this.maxAttempts,
    required this.difficultyLevel,
    required this.sortOrder,
    required this.isActive,
  });

  final String id;
  final String topicId;
  final String questionText;
  final String questionAudioText;
  final String expectedAnswer;
  final List<String> acceptedKeywords;
  final List<String> alternativeAnswers;
  final String evaluationType;
  final String hintText;
  final String positiveFeedback;
  final String retryFeedback;
  final int maxAttempts;
  final int difficultyLevel;
  final int sortOrder;
  final bool isActive;

  factory AiConversationQuestion.fromMap(Map<String, dynamic> map) =>
      AiConversationQuestion(
        id: '${map['id'] ?? ''}',
        topicId: '${map['topicId'] ?? ''}',
        questionText: '${map['questionText'] ?? ''}',
        questionAudioText:
            '${map['questionAudioText'] ?? map['questionText'] ?? ''}',
        expectedAnswer: '${map['expectedAnswer'] ?? ''}',
        acceptedKeywords: readStringList(map['acceptedKeywords']),
        alternativeAnswers: readStringList(map['alternativeAnswers']),
        evaluationType: '${map['evaluationType'] ?? 'KEYWORD'}',
        hintText: '${map['hintText'] ?? ''}',
        positiveFeedback: '${map['positiveFeedback'] ?? ''}',
        retryFeedback: '${map['retryFeedback'] ?? ''}',
        maxAttempts: readInt(map['maxAttempts'], 2),
        difficultyLevel: readInt(map['difficultyLevel'], 1),
        sortOrder: readInt(map['sortOrder']),
        isActive: map['isActive'] != false,
      );
}
