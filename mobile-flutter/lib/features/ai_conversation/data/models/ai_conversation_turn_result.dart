import '../../../../models/model_helpers.dart';

class AiConversationTurnResult {
  const AiConversationTurnResult({
    required this.turnId,
    required this.sessionId,
    required this.questionId,
    required this.evaluationResult,
    required this.score,
    required this.aiFeedback,
    required this.hintText,
    required this.shouldRetry,
    required this.attemptNo,
  });

  final String turnId;
  final String sessionId;
  final String questionId;
  final String evaluationResult;
  final double score;
  final String aiFeedback;
  final String hintText;
  final bool shouldRetry;
  final int attemptNo;

  bool get isGood =>
      evaluationResult == 'CORRECT' || evaluationResult == 'PARTIALLY_CORRECT';

  factory AiConversationTurnResult.fromMap(Map<String, dynamic> map) =>
      AiConversationTurnResult(
        turnId: '${map['turnId'] ?? ''}',
        sessionId: '${map['sessionId'] ?? ''}',
        questionId: '${map['questionId'] ?? ''}',
        evaluationResult: '${map['evaluationResult'] ?? 'UNCLEAR'}',
        score: readDouble(map['score']),
        aiFeedback: '${map['aiFeedback'] ?? ''}',
        hintText: '${map['hintText'] ?? ''}',
        shouldRetry:
            map['shouldRetry'] == true ||
            '${map['nextAction'] ?? ''}' == 'RETRY_OR_HINT',
        attemptNo: readInt(map['attemptNo'], 1),
      );
}
