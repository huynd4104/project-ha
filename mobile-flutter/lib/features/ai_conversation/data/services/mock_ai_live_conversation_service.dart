import 'dart:async';

import '../models/ai_conversation_session.dart';
import '../models/transcript_result.dart';
import 'ai_live_conversation_service.dart';

class MockAiLiveConversationService implements AiLiveConversationService {
  final _statusController = StreamController<String>.broadcast();
  final _transcriptController = StreamController<TranscriptResult>.broadcast();

  @override
  Stream<String> get statusStream => _statusController.stream;

  @override
  Stream<TranscriptResult> get transcriptStream =>
      _transcriptController.stream;

  @override
  Future<bool> requestMicPermission() async => true;

  @override
  Future<void> connect(AiConversationSession session) async {
    _statusController.add('AI đang nói');
    await Future<void>.delayed(const Duration(milliseconds: 400));
    _statusController.add('Con trả lời nhé');
  }

  @override
  Future<void> startListening() async {
    _statusController.add('Đang nghe con nói');
    await Future<void>.delayed(const Duration(seconds: 2));
    _transcriptController.add(
      TranscriptResult(
        text: 'Mock transcript response',
        confidence: 0.9,
        source: TranscriptSource.debugInput,
        startedAt: DateTime.now().subtract(const Duration(seconds: 2)),
        endedAt: DateTime.now(),
      ),
    );
    _statusController.add('Đang kiểm tra');
  }

  @override
  Future<void> stopListening() async {
    _statusController.add('Con trả lời nhé');
  }

  @override
  Future<void> speak(String text) async {
    _statusController.add('AI đang nói');
    await Future<void>.delayed(const Duration(milliseconds: 500));
    _statusController.add('Con trả lời nhé');
  }

  @override
  Future<void> close() async {
    _statusController.add('Đã kết thúc');
    await _statusController.close();
    await _transcriptController.close();
  }
}
