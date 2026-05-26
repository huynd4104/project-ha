import '../../../../models/model_helpers.dart';
import 'ai_conversation_summary.dart';

class AiConversationSessionHistory {
  const AiConversationSessionHistory({
    required this.sessionId,
    required this.topicTitle,
    required this.startedAt,
    required this.endedAt,
    required this.durationSeconds,
    required this.answeredQuestions,
    required this.goodResponseRate,
    required this.summaryFeedback,
  });

  final String sessionId;
  final String topicTitle;
  final DateTime? startedAt;
  final DateTime? endedAt;
  final int durationSeconds;
  final int answeredQuestions;
  final double goodResponseRate;
  final String summaryFeedback;

  factory AiConversationSessionHistory.fromMap(Map<String, dynamic> map) =>
      AiConversationSessionHistory(
        sessionId: '${map['sessionId'] ?? ''}',
        topicTitle: '${map['topicTitle'] ?? ''}',
        startedAt: readDate(map['startedAt']),
        endedAt: readDate(map['endedAt']),
        durationSeconds: readInt(map['durationSeconds']),
        answeredQuestions: readInt(map['answeredQuestions']),
        goodResponseRate: readDouble(
          map['goodResponseRate'] ?? map['averageScore'],
        ),
        summaryFeedback: '${map['summaryFeedback'] ?? ''}',
      );
}

class AiConversationTurnDetail {
  const AiConversationTurnDetail({
    required this.questionText,
    required this.childTranscript,
    required this.evaluationResult,
    required this.score,
    required this.aiFeedback,
    required this.hintUsed,
    required this.attemptNo,
  });

  final String questionText;
  final String childTranscript;
  final String evaluationResult;
  final double score;
  final String aiFeedback;
  final bool hintUsed;
  final int attemptNo;

  factory AiConversationTurnDetail.fromMap(Map<String, dynamic> map) =>
      AiConversationTurnDetail(
        questionText: '${map['questionText'] ?? ''}',
        childTranscript: '${map['childTranscript'] ?? ''}',
        evaluationResult: '${map['evaluationResult'] ?? ''}',
        score: readDouble(map['score']),
        aiFeedback: '${map['aiFeedback'] ?? ''}',
        hintUsed: map['hintUsed'] == true,
        attemptNo: readInt(map['attemptNo'], 1),
      );
}

class AiConversationSessionDetail {
  const AiConversationSessionDetail({
    required this.summary,
    required this.turns,
    required this.transcriptVisible,
  });

  final AiConversationSummary summary;
  final List<AiConversationTurnDetail> turns;
  final bool transcriptVisible;

  factory AiConversationSessionDetail.fromMap(Map<String, dynamic> map) =>
      AiConversationSessionDetail(
        summary: AiConversationSummary.fromMap(
          Map<String, dynamic>.from(map['summary'] as Map? ?? const {}),
        ),
        turns: (map['turns'] as List? ?? const [])
            .map(
              (item) => AiConversationTurnDetail.fromMap(
                Map<String, dynamic>.from(item as Map),
              ),
            )
            .toList(),
        transcriptVisible: map['transcriptVisible'] != false,
      );
}
