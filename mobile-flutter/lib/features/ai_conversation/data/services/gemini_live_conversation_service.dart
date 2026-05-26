import 'dart:async';

import '../models/ai_conversation_session.dart';
import '../models/transcript_result.dart';
import 'ai_live_conversation_service.dart';

/// Future placeholder for direct Gemini Live WebSocket connection.
///
/// Under the current implementation phase, WebSocket audio streaming is not yet supported.
/// Attempting to use this service will throw an [UnsupportedError].
/// The app should configure the session to run in STT/TTS mode.
class GeminiLiveConversationService implements AiLiveConversationService {
  final _statusController = StreamController<String>.broadcast();
  final _transcriptController = StreamController<TranscriptResult>.broadcast();

  @override
  Stream<String> get statusStream => _statusController.stream;

  @override
  Stream<TranscriptResult> get transcriptStream =>
      _transcriptController.stream;

  @override
  Future<bool> requestMicPermission() async {
    // Gemini Live requires mic permission
    return false;
  }

  @override
  Future<void> connect(AiConversationSession session) async {
    _statusController.add('Đang kết nối Gemini Live...');
    throw UnsupportedError(
      'Gemini Live WebSocket connection is not yet integrated. '
      'Please use Device STT + TTS (Local Mode) instead.',
    );
  }

  @override
  Future<void> startListening() async {
    throw UnsupportedError('Gemini Live not connected.');
  }

  @override
  Future<void> stopListening() async {
    throw UnsupportedError('Gemini Live not connected.');
  }

  @override
  Future<void> speak(String text) async {
    throw UnsupportedError('Gemini Live not connected.');
  }

  @override
  Future<void> close() async {
    await _statusController.close();
    await _transcriptController.close();
  }
}
