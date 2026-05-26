import '../models/ai_conversation_session.dart';
import '../models/transcript_result.dart';

abstract class AiLiveConversationService {
  Stream<String> get statusStream;
  Stream<TranscriptResult> get transcriptStream;

  Future<bool> requestMicPermission();
  Future<void> connect(AiConversationSession session);
  Future<void> startListening();
  Future<void> stopListening();
  Future<void> speak(String text);
  Future<void> close();
}
