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
    required this.shouldAdvance,
    required this.canSkip,
    required this.attemptNo,
    required this.maxAttempts,
    this.nextQuestionId,
    required this.isSessionCompleted,
    required this.advanceReason,
  });

  final String turnId;
  final String sessionId;
  final String questionId;
  final String evaluationResult;
  final double score;
  final String aiFeedback;
  final String hintText;
  final bool shouldRetry;
  final bool shouldAdvance;
  final bool canSkip;
  final int attemptNo;
  final int maxAttempts;
  final String? nextQuestionId;
  final bool isSessionCompleted;
  final String advanceReason;

  bool get isGood =>
      evaluationResult == 'CORRECT' || evaluationResult == 'PARTIALLY_CORRECT';

  factory AiConversationTurnResult.fromMap(Map<String, dynamic> map) {
    return AiConversationTurnResult(
      turnId: '${map['turnId'] ?? ''}',
      sessionId: '${map['sessionId'] ?? ''}',
      questionId: '${map['questionId'] ?? ''}',
      evaluationResult: '${map['evaluationResult'] ?? 'UNCLEAR'}',
      score: readDouble(map['score']),
      aiFeedback: '${map['aiFeedback'] ?? ''}',
      hintText: '${map['hintText'] ?? ''}',
      shouldRetry: map['shouldRetry'] == true,
      shouldAdvance: map['shouldAdvance'] == true,
      canSkip: map['canSkip'] == true,
      attemptNo: readInt(map['attemptNo'], 1),
      maxAttempts: readInt(map['maxAttempts'], 2),
      nextQuestionId: map['nextQuestionId']?.toString(),
      isSessionCompleted: map['isSessionCompleted'] == true,
      advanceReason: '${map['advanceReason'] ?? ''}',
    );
  }
}
