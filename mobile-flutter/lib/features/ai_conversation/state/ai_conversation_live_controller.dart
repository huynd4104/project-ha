import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:permission_handler/permission_handler.dart';

import '../data/models/ai_conversation_question.dart';
import '../data/models/ai_conversation_session.dart';
import '../data/models/ai_conversation_turn_result.dart';
import '../data/models/transcript_result.dart';
import '../data/repositories/ai_conversation_repository.dart';
import '../data/services/ai_conversation_permission_service.dart';
import '../data/services/ai_live_conversation_service.dart';
import '../data/services/device_stt_tts_conversation_service.dart';
import '../data/services/gemini_live_conversation_service.dart';
import '../data/services/mock_ai_live_conversation_service.dart';

enum AiLiveState {
  preparing,
  connecting,
  aiSpeaking,
  childTurn,
  listening,
  processing,
  feedback,
  completed,
  error,
}

class AiConversationLiveController extends ChangeNotifier {
  AiConversationLiveController({
    AiConversationRepository? repository,
    AiLiveConversationService? liveService,
  })  : _repository = repository ?? AiConversationRepository(),
        _injectedLiveService = liveService;

  final AiConversationRepository _repository;
  final AiLiveConversationService? _injectedLiveService;
  late AiLiveConversationService _activeService;

  AiConversationSession? session;
  List<AiConversationQuestion> questions = const [];
  AiConversationTurnResult? lastResult;
  AiLiveState liveState = AiLiveState.preparing;
  String? error;
  bool isPermissionError = false;
  bool isSttInitFailed = false;
  PermissionStatus micPermissionStatus = PermissionStatus.denied;
  PermissionStatus speechPermissionStatus = PermissionStatus.denied;
  bool loading = false;
  bool submitting = false;
  int currentIndex = 0;
  Timer? _silenceTimer;
  Timer? _childTurnReminderTimer;
  Timer? _connectionTimeoutTimer;
  StreamSubscription<String>? _statusSub;
  StreamSubscription<TranscriptResult>? _transcriptSub;

  AiConversationQuestion? get currentQuestion =>
      currentIndex < questions.length ? questions[currentIndex] : null;

  String get statusLabel => switch (liveState) {
        AiLiveState.preparing => 'Đang chuẩn bị...',
        AiLiveState.connecting => 'Đang kết nối...',
        AiLiveState.aiSpeaking => 'AI đang nói',
        AiLiveState.childTurn => 'Con bấm mic rồi trả lời nhé',
        AiLiveState.listening => 'Đang nghe con nói',
        AiLiveState.processing => 'Đang kiểm tra',
        AiLiveState.feedback => lastResult?.isGood == true
            ? 'Giỏi lắm!'
            : 'Mình thử lại nhé',
        AiLiveState.completed => 'Hoàn thành!',
        AiLiveState.error => 'Có lỗi xảy ra',
      };

  bool get isListening => liveState == AiLiveState.listening;

  bool get canTapMic =>
      liveState == AiLiveState.childTurn ||
      liveState == AiLiveState.listening ||
      liveState == AiLiveState.feedback;

  void _startConnectionTimeout() {
    _cancelConnectionTimeout();
    _connectionTimeoutTimer = Timer(const Duration(seconds: 10), () {
      if (liveState == AiLiveState.preparing || liveState == AiLiveState.connecting) {
        if (kDebugMode) {
          debugPrint('[AI Conversation State] Connection timeout after 10s');
        }
        error = 'Không kết nối được. Con bấm Thử lại để kết nối lại nhé.';
        isPermissionError = false;
        liveState = AiLiveState.error;
        loading = false;
        notifyListeners();
        try {
          _activeService.close();
        } catch (_) {}
      }
    });
  }

  void _cancelConnectionTimeout() {
    _connectionTimeoutTimer?.cancel();
    _connectionTimeoutTimer = null;
  }

  Future<void> start({
    required String userId,
    required String childId,
    required String topicId,
  }) async {
    loading = true;
    error = null;
    isPermissionError = false;
    isSttInitFailed = false;
    liveState = AiLiveState.preparing;
    _cancelConnectionTimeout();
    notifyListeners();

    try {
      // 1. Check & request Microphone permission first
      micPermissionStatus = await AiConversationPermissionService.getMicrophoneStatus();
      if (!micPermissionStatus.isGranted) {
        micPermissionStatus = await AiConversationPermissionService.requestMicrophone();
        if (!micPermissionStatus.isGranted) {
          isPermissionError = true;
          error = 'Cần quyền Micro';
          liveState = AiLiveState.error;
          loading = false;
          notifyListeners();
          return;
        }
      }

      // 2. Check & request Speech Recognition permission (only on iOS)
      if (defaultTargetPlatform == TargetPlatform.iOS) {
        speechPermissionStatus = await AiConversationPermissionService.getSpeechStatus();
        if (!speechPermissionStatus.isGranted) {
          speechPermissionStatus = await AiConversationPermissionService.requestSpeech();
          if (!speechPermissionStatus.isGranted) {
            isPermissionError = true;
            error = 'Cần quyền Nhận diện giọng nói';
            liveState = AiLiveState.error;
            loading = false;
            notifyListeners();
            return;
          }
        }
      }

      // Log the final missing status for debugging
      await AiConversationPermissionService.getMissingPermission();

      // 3. Start session via backend to obtain config
      session = await _repository.startSession(
        userId: userId,
        childId: childId,
        topicId: topicId,
      );
      questions = session!.questions;

      // 4. Select appropriate service dynamically
      if (_injectedLiveService != null) {
        _activeService = _injectedLiveService;
      } else if (session!.isRealGeminiLive) {
        _activeService = GeminiLiveConversationService();
        if (kDebugMode) {
          debugPrint('[AI Conversation Service] using GeminiLiveConversationService');
        }
      } else {
        const useMockService = bool.fromEnvironment('USE_MOCK_AI_CONVERSATION', defaultValue: false);
        if (useMockService) {
          _activeService = MockAiLiveConversationService();
          if (kDebugMode) {
            debugPrint('[AI Conversation Service] using MockAiLiveConversationService');
          }
        } else {
          _activeService = DeviceSttTtsConversationService();
          if (kDebugMode) {
            debugPrint('[AI Conversation Service] using DeviceSttTtsConversationService');
          }
        }
      }

      // 5. Start connection timeout timer and transition to connecting
      liveState = AiLiveState.connecting;
      _startConnectionTimeout();
      notifyListeners();

      _statusSub = _activeService.statusStream.listen((value) {
        final oldState = liveState;
        if (value == 'AI đang nói') {
          _cancelConnectionTimeout();
          liveState = AiLiveState.aiSpeaking;
          _cancelChildTurnReminder();
        } else if (value == 'Con trả lời nhé') {
          _cancelConnectionTimeout();
          if (liveState == AiLiveState.aiSpeaking) {
            liveState = AiLiveState.childTurn;
            _startChildTurnReminder();
          } else {
            liveState = AiLiveState.childTurn;
          }
        } else if (value == 'Đang nghe con nói') {
          liveState = AiLiveState.listening;
          _cancelChildTurnReminder();
          _startSilenceTimer();
        } else if (value == 'Đang kiểm tra') {
          liveState = AiLiveState.processing;
          _cancelChildTurnReminder();
          _cancelSilenceTimer();
        } else if (value == 'Đã kết thúc') {
          liveState = AiLiveState.completed;
          _cancelChildTurnReminder();
        }

        if (kDebugMode && oldState != liveState) {
          debugPrint('[AI Conversation State] ${oldState.name} -> ${liveState.name}');
        }
        notifyListeners();
      });

      // 6. Listen to transcripts
      _transcriptSub = _activeService.transcriptStream.listen((result) {
        if (result.isNotEmpty) {
          _handleTranscript(result.text);
        }
      });

      // 7. Connect the active service
      await _activeService.connect(session!);

      // 8. Auto-speak the first question
      if (currentQuestion != null) {
        final speakText = currentQuestion!.questionAudioText.trim().isNotEmpty
            ? currentQuestion!.questionAudioText
            : currentQuestion!.questionText;
        
        // Before speaking, transition state to aiSpeaking
        liveState = AiLiveState.aiSpeaking;
        _cancelConnectionTimeout();
        notifyListeners();

        await _activeService.speak(speakText);
        liveState = AiLiveState.childTurn;
        notifyListeners();
        _startChildTurnReminder();
      }
    } catch (e) {
      _cancelConnectionTimeout();
      final msg = e.toString();
      if (msg.contains('speech_to_text_init_failed')) {
        isSttInitFailed = true;
        error = 'Nhận diện giọng nói chưa sẵn sàng';
      } else {
        error = _friendlyError(e);
      }
      liveState = AiLiveState.error;
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> toggleListening() async {
    if (!canTapMic) return;

    if (isListening) {
      await stopListening();
    } else {
      await startListening();
    }
  }

  Future<void> startListening() async {
    if (currentQuestion == null) return;
    _cancelSilenceTimer();
    _cancelChildTurnReminder();
    try {
      await _activeService.startListening();
    } catch (e) {
      error = _friendlyError(e);
      liveState = AiLiveState.error;
      notifyListeners();
    }
  }

  Future<void> stopListening() async {
    _cancelSilenceTimer();
    _cancelChildTurnReminder();
    try {
      await _activeService.stopListening();
    } catch (e) {
      if (kDebugMode) debugPrint('Stop listening error: $e');
    }
  }

  /// Submit transcript from external source (debug input).
  Future<AiConversationTurnResult?> submitTranscript(String transcript) async {
    return _handleTranscript(transcript);
  }

  Future<AiConversationTurnResult?> _handleTranscript(
    String transcript,
  ) async {
    final activeSession = session;
    final question = currentQuestion;
    if (activeSession == null ||
        question == null ||
        transcript.trim().isEmpty) {
      return null;
    }
    submitting = true;
    liveState = AiLiveState.processing;
    _cancelChildTurnReminder();
    notifyListeners();
    try {
      lastResult = await _repository.submitTurn(
        sessionId: activeSession.sessionId,
        questionId: question.id,
        turnOrder: currentIndex + 1,
        transcript: transcript.trim(),
        attemptNo: 1,
        hintUsed: false,
      );
      liveState = AiLiveState.feedback;
      notifyListeners();

      // AI speaks feedback
      final speakFeedback = lastResult!.aiFeedback.trim().isNotEmpty
          ? lastResult!.aiFeedback
          : (lastResult!.isGood
              ? 'Con làm tốt lắm! Cùng trả lời câu tiếp theo nhé.'
              : 'Con cố gắng lên nhé, cùng luyện tập thêm nào.');
      await _activeService.speak(speakFeedback);

      // Move to next question
      currentIndex += 1;
      if (currentQuestion == null) {
        liveState = AiLiveState.completed;
      } else {
        liveState = AiLiveState.childTurn;
        notifyListeners();
        // Auto-speak the next question
        final speakText = currentQuestion!.questionAudioText.trim().isNotEmpty
            ? currentQuestion!.questionAudioText
            : currentQuestion!.questionText;
        await _activeService.speak(speakText);
        liveState = AiLiveState.childTurn;
        notifyListeners();
        _startChildTurnReminder();
      }
      return lastResult;
    } catch (e) {
      error = 'Có lỗi xảy ra. Mình thử lại câu này nhé.';
      liveState = AiLiveState.error;
      return null;
    } finally {
      submitting = false;
      notifyListeners();
    }
  }

  void _startSilenceTimer() {
    _cancelSilenceTimer();
    _silenceTimer = Timer(const Duration(seconds: 15), () {
      if (liveState == AiLiveState.listening) {
        // Child has been silent too long
        liveState = AiLiveState.childTurn;
        notifyListeners();
        _activeService.stopListening();
        _startChildTurnReminder();
      }
    });
  }

  void _cancelSilenceTimer() {
    _silenceTimer?.cancel();
    _silenceTimer = null;
  }

  void _startChildTurnReminder() {
    _cancelChildTurnReminder();
    _childTurnReminderTimer = Timer(const Duration(seconds: 12), () async {
      if (liveState == AiLiveState.childTurn && !submitting && !loading) {
        try {
          await _activeService.speak('Con bấm nút mic màu cam để trả lời câu hỏi nhé.');
          _startChildTurnReminder();
        } catch (e) {
          if (kDebugMode) debugPrint('Reminder TTS error: $e');
        }
      }
    });
  }

  void _cancelChildTurnReminder() {
    _childTurnReminderTimer?.cancel();
    _childTurnReminderTimer = null;
  }

  /// Retry after error — reset state to childTurn
  void retry() {
    error = null;
    liveState = AiLiveState.childTurn;
    notifyListeners();
    _startChildTurnReminder();
  }

  String _friendlyError(dynamic e) {
    final msg = e.toString().toLowerCase();
    if (msg.contains('permission') || msg.contains('denied')) {
      return 'Mình cần quyền micro và nhận diện giọng nói để nghe con nói nhé. '
          'Bạn hãy vào Cài đặt để cho phép.';
    }
    if (msg.contains('network') ||
        msg.contains('socket') ||
        msg.contains('connection')) {
      return 'Mất kết nối mạng. Mình thử lại sau nhé.';
    }
    return 'Không kết nối được. Mình thử lại nhé.';
  }

  Future<void> close() async {
    _cancelSilenceTimer();
    _cancelChildTurnReminder();
    _cancelConnectionTimeout();
    _statusSub?.cancel();
    _transcriptSub?.cancel();
    if (session != null) {
      await _activeService.close();
    }
  }

  @override
  void dispose() {
    _cancelSilenceTimer();
    _cancelChildTurnReminder();
    _cancelConnectionTimeout();
    _statusSub?.cancel();
    _transcriptSub?.cancel();
    super.dispose();
  }
}
