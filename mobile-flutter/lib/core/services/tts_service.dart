import 'package:flutter/foundation.dart';
import 'package:flutter_tts/flutter_tts.dart';

class TtsService {
  TtsService._() {
    _init();
  }

  static final TtsService instance = TtsService._();
  final FlutterTts _flutterTts = FlutterTts();
  bool _isInitialized = false;

  Future<void> _init() async {
    try {
      await _flutterTts.setLanguage('vi-VN');
      // Child-friendly parameters (slower speed, slightly higher pitch for clarity)
      await _flutterTts.setSpeechRate(0.45);
      await _flutterTts.setPitch(1.1);
      _isInitialized = true;
    } catch (e) {
      debugPrint('Error initializing TTS: $e');
    }
  }

  Future<void> stop() async {
    try {
      await _flutterTts.stop();
    } catch (e) {
      debugPrint('Error stopping TTS: $e');
    }
  }

  Future<void> speak(String? text) async {
    if (text == null || text.trim().isEmpty) return;
    await stop();
    if (!_isInitialized) {
      await _init();
    }
    try {
      await _flutterTts.speak(text);
    } catch (e) {
      debugPrint('Error speaking TTS: $e');
    }
  }

  Future<void> speakQuestion(String? text) async {
    await speak(text);
  }

  Future<void> speakCorrectFeedback(String? text) async {
    if (text == null || text.trim().isEmpty) {
      await speak('Đúng rồi, bạn giỏi quá!');
    } else {
      await speak(text);
    }
  }

  Future<void> speakWrongFeedback(String? text) async {
    if (text == null || text.trim().isEmpty) {
      await speak('Tiếc quá, chưa chính xác rồi. Mình thử lại nhé!');
    } else {
      await speak(text);
    }
  }

  Future<void> speakExplanation(String? text) async {
    await speak(text);
  }

  Future<void> speakFlashcardFront(String? text) async {
    await speak(text);
  }

  Future<void> speakFlashcardBack(String? text) async {
    await speak(text);
  }
}
