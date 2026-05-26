import '../../../../models/model_helpers.dart';
import 'ai_conversation_question.dart';

class AiConversationSession {
  const AiConversationSession({
    required this.sessionId,
    required this.liveSessionId,
    required this.ephemeralToken,
    required this.model,
    required this.systemInstruction,
    required this.questions,
    required this.maxDurationSeconds,
    required this.startedAt,
    required this.mode,
    required this.isRealGeminiLive,
  });

  final String sessionId;
  final String liveSessionId;
  final String ephemeralToken;
  final String model;
  final String systemInstruction;
  final List<AiConversationQuestion> questions;
  final int maxDurationSeconds;
  final DateTime? startedAt;
  final String mode;
  final bool isRealGeminiLive;

  factory AiConversationSession.fromMap(Map<String, dynamic> map) =>
      AiConversationSession(
        sessionId: '${map['sessionId'] ?? ''}',
        liveSessionId: '${map['liveSessionId'] ?? ''}',
        ephemeralToken: '${map['ephemeralToken'] ?? ''}',
        model: '${map['model'] ?? ''}',
        systemInstruction: '${map['systemInstruction'] ?? ''}',
        questions: (map['questionList'] as List? ?? const [])
            .map(
              (item) => AiConversationQuestion.fromMap(
                Map<String, dynamic>.from(item as Map),
              ),
            )
            .toList(),
        maxDurationSeconds: readInt(map['maxDurationSeconds'], 180),
        startedAt: readDate(map['startedAt']),
        mode: '${map['mode'] ?? 'MOCK'}',
        isRealGeminiLive: map['isRealGeminiLive'] == true,
      );
}
