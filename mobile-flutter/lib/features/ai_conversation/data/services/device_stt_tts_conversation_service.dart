import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:speech_to_text/speech_recognition_result.dart';
import 'package:speech_to_text/speech_to_text.dart';

import '../models/ai_conversation_session.dart';
import '../models/transcript_result.dart';
import 'ai_live_conversation_service.dart';

/// Active production service that combines on-device STT (Speech-to-Text)
/// and TTS (Text-to-Speech) for full-duplex local voice interaction.
class DeviceSttTtsConversationService implements AiLiveConversationService {
  DeviceSttTtsConversationService() {
    _initTts();
  }

  final _statusController = StreamController<String>.broadcast();
  final _transcriptController = StreamController<TranscriptResult>.broadcast();
  final SpeechToText _stt = SpeechToText();
  final FlutterTts _tts = FlutterTts();

  bool _sttAvailable = false;
  DateTime? _listenStartedAt;
  String _currentLocale = 'vi_VN';
  Completer<void>? _ttsCompleter;

  @override
  Stream<String> get statusStream => _statusController.stream;

  @override
  Stream<TranscriptResult> get transcriptStream =>
      _transcriptController.stream;

  void _initTts() {
    _tts.setStartHandler(() {
      _statusController.add('AI đang nói');
    });
    _tts.setCompletionHandler(() {
      if (_ttsCompleter != null && !_ttsCompleter!.isCompleted) {
        _ttsCompleter!.complete();
      }
    });
    _tts.setErrorHandler((msg) {
      if (_ttsCompleter != null && !_ttsCompleter!.isCompleted) {
        _ttsCompleter!.completeError(msg);
      }
    });
  }

  Future<void> _configureTts() async {
    try {
      if (defaultTargetPlatform == TargetPlatform.iOS) {
        await _tts.setSharedInstance(true);
        await _tts.setIosAudioCategory(
          IosTextToSpeechAudioCategory.playAndRecord,
          [
            IosTextToSpeechAudioCategoryOptions.allowBluetooth,
            IosTextToSpeechAudioCategoryOptions.allowBluetoothA2DP,
            IosTextToSpeechAudioCategoryOptions.mixWithOthers,
            IosTextToSpeechAudioCategoryOptions.defaultToSpeaker,
          ],
          IosTextToSpeechAudioMode.defaultMode,
        );
      }
      await _tts.setLanguage('vi-VN');
      await _tts.setSpeechRate(0.48); // Slightly slower rate for children
      await _tts.setPitch(1.0); // Standard, clear pitch
      await _tts.setVolume(1.0);
      await _tts.awaitSpeakCompletion(true);
    } catch (e) {
      if (kDebugMode) {
        print("[AI Conversation TTS] error: Failed to configure TTS: $e");
        debugPrint('Failed to configure TTS: $e');
      }
    }
  }

  @override
  Future<bool> requestMicPermission() async {
    final micStatus = await Permission.microphone.request();
    if (!micStatus.isGranted) return false;

    final speechStatus = await Permission.speech.request();
    return speechStatus.isGranted;
  }

  @override
  Future<void> connect(AiConversationSession session) async {
    _statusController.add('Đang kết nối...');
    try {
      // 1. Initialize TTS
      await _configureTts();

      // 2. Initialize STT
      _sttAvailable = await _stt.initialize(
        onError: (error) {
          if (kDebugMode) {
            debugPrint('STT error: ${error.errorMsg}');
          }
          // If silent or no match error occurred, gently prompt the child to speak
          if (error.errorMsg.contains('no_match') || error.errorMsg.contains('speech_timeout')) {
            speak('Mình chưa nghe rõ con nói gì. Con bấm nút mic nói lại nhé.');
          } else {
            _statusController.add('Con trả lời nhé');
          }
        },
        onStatus: (status) {
          if (status == 'listening') {
            _statusController.add('Đang nghe con nói');
          } else if (status == 'notListening') {
            _statusController.add('Con trả lời nhé');
          }
        },
      );
      if (!_sttAvailable) {
        _statusController.add('Thiết bị chưa hỗ trợ nhận diện giọng nói');
        return;
      }

      // Determine STT locale
      final locales = await _stt.locales();
      final viLocale = locales.where(
        (l) => l.localeId.startsWith('vi'),
      );
      if (viLocale.isNotEmpty) {
        _currentLocale = viLocale.first.localeId;
      }

      _statusController.add('Con trả lời nhé');
    } catch (e) {
      _statusController.add('Không kết nối được. Mình thử lại nhé.');
      if (kDebugMode) {
        debugPrint('STT connect error: $e');
      }
    }
  }

  @override
  Future<void> startListening() async {
    if (!_sttAvailable) {
      _statusController.add('Thiết bị chưa hỗ trợ nhận diện giọng nói');
      return;
    }
    // Stop any speaking TTS before recording
    await _tts.stop();

    // Small delay to release hardware resource before recording
    await Future<void>.delayed(const Duration(milliseconds: 300));

    _listenStartedAt = DateTime.now();
    _statusController.add('Đang nghe con nói');
    await _stt.listen(
      onResult: _onSpeechResult,
      listenOptions: SpeechListenOptions(
        localeId: _currentLocale,
        listenMode: ListenMode.dictation,
        cancelOnError: false,
        partialResults: true,
        listenFor: const Duration(seconds: 30),
        pauseFor: const Duration(seconds: 3),
      ),
    );
  }

  void _onSpeechResult(SpeechRecognitionResult result) {
    if (result.finalResult) {
      if (result.recognizedWords.trim().isNotEmpty) {
        _transcriptController.add(
          TranscriptResult(
            text: result.recognizedWords.trim(),
            confidence: result.confidence,
            source: TranscriptSource.deviceStt,
            language: _currentLocale,
            startedAt: _listenStartedAt,
            endedAt: DateTime.now(),
          ),
        );
        _statusController.add('Đang kiểm tra');
      } else {
        // Final result but empty (silent/unrecognized)
        _statusController.add('Con trả lời nhé');
        speak('Mình chưa nghe rõ con nói gì. Con bấm nút mic nói lại nhé.');
      }
    }
  }

  @override
  Future<void> stopListening() async {
    if (_stt.isListening) {
      await _stt.stop();
    }
    _statusController.add('Con trả lời nhé');
  }

  @override
  Future<void> speak(String text) async {
    if (text.trim().isEmpty) return;

    // Stop listening before speaking
    if (_stt.isListening) {
      await _stt.stop();
    }

    _statusController.add('AI đang nói');
    _ttsCompleter = Completer<void>();

    try {
      if (kDebugMode) {
        print("[AI Conversation TTS] speaking: $text");
      }
      await _tts.speak(text);
      // Wait up to 15 seconds for speaking to complete
      await _ttsCompleter!.future.timeout(const Duration(seconds: 15));
      if (kDebugMode) {
        print("[AI Conversation TTS] completed");
      }
    } catch (e) {
      if (kDebugMode) {
        print("[AI Conversation TTS] error: $e");
        debugPrint('TTS speak error or timeout: $e');
      }
    } finally {
      _ttsCompleter = null;
      _statusController.add('Con trả lời nhé');
    }
  }

  @override
  Future<void> close() async {
    if (_stt.isListening) {
      await _stt.stop();
    }
    await _tts.stop();
    _statusController.add('Đã kết thúc');
    await _statusController.close();
    await _transcriptController.close();
  }
}
