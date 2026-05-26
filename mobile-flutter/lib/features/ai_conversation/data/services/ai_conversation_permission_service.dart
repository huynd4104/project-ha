import 'package:flutter/foundation.dart';
import 'package:permission_handler/permission_handler.dart';

class AiConversationPermissionService {
  /// Checks status of Microphone permission.
  static Future<PermissionStatus> getMicrophoneStatus() async {
    final status = await Permission.microphone.status;
    if (kDebugMode) {
      print('[AI Permission] microphone = $status');
    }
    return status;
  }

  /// Checks status of Speech Recognition permission.
  /// On platforms other than iOS, it automatically returns [PermissionStatus.granted].
  static Future<PermissionStatus> getSpeechStatus() async {
    if (defaultTargetPlatform != TargetPlatform.iOS) {
      return PermissionStatus.granted;
    }
    final status = await Permission.speech.status;
    if (kDebugMode) {
      print('[AI Permission] speech = $status');
    }
    return status;
  }

  /// Requests Microphone permission.
  static Future<PermissionStatus> requestMicrophone() async {
    if (kDebugMode) {
      print('[AI Permission] retry request microphone = calling request()...');
    }
    final status = await Permission.microphone.request();
    if (kDebugMode) {
      print('[AI Permission] microphone status after request = $status');
    }
    return status;
  }

  /// Requests Speech Recognition permission.
  static Future<PermissionStatus> requestSpeech() async {
    if (defaultTargetPlatform != TargetPlatform.iOS) {
      return PermissionStatus.granted;
    }
    if (kDebugMode) {
      print('[AI Permission] retry request speech = calling request()...');
    }
    final status = await Permission.speech.request();
    if (kDebugMode) {
      print('[AI Permission] speech status after request = $status');
    }
    return status;
  }

  /// Returns which permission is currently missing: 'microphone', 'speech', 'both', or 'none'.
  static Future<String> getMissingPermission() async {
    final micGranted = (await getMicrophoneStatus()).isGranted;
    final speechGranted = (await getSpeechStatus()).isGranted;

    String missing;
    if (!micGranted && !speechGranted) {
      missing = 'both';
    } else if (!micGranted) {
      missing = 'microphone';
    } else if (!speechGranted) {
      missing = 'speech';
    } else {
      missing = 'none';
    }

    if (kDebugMode) {
      print('[AI Permission] missing = $missing');
    }
    return missing;
  }

  /// Opens the device app settings screen.
  static Future<bool> openSettings() async {
    return openAppSettings();
  }
}
