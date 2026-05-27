import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import '../api/api_client.dart';

class NfcResolvedTag {
  const NfcResolvedTag({
    required this.tagUid,
    required this.tagType,
    required this.targetType,
    this.targetId,
    this.payloadValue,
    this.displayName = '',
    this.spokenText,
    this.metadata = const {},
  });

  final String tagUid;
  final String tagType;
  final String targetType;
  final String? targetId;
  final String? payloadValue;
  final String displayName;
  final String? spokenText;
  final Map<String, dynamic> metadata;

  factory NfcResolvedTag.fromMap(Map<String, dynamic> map) {
    return NfcResolvedTag(
      tagUid: '${map['tagUid'] ?? ''}',
      tagType: '${map['tagType'] ?? ''}',
      targetType: '${map['targetType'] ?? ''}',
      targetId: map['targetId']?.toString(),
      payloadValue: map['payloadValue']?.toString(),
      displayName: '${map['displayName'] ?? ''}',
      spokenText: map['spokenText']?.toString(),
      metadata: map['metadata'] is Map ? Map<String, dynamic>.from(map['metadata']) : const {},
    );
  }
}

enum NfcState {
  unavailable,
  ready,
  reading,
  success,
  error,
}

class NfcService {
  NfcService._();

  static final NfcService instance = NfcService._();

  final _stateController = StreamController<NfcState>.broadcast();
  final _tagController = StreamController<NfcResolvedTag>.broadcast();
  final _messageController = StreamController<String>.broadcast();

  Stream<NfcState> get stateStream => _stateController.stream;
  Stream<NfcResolvedTag> get tagStream => _tagController.stream;
  Stream<String> get messageStream => _messageController.stream;

  bool _isListening = false;
  String? _lastTagUid;
  DateTime? _lastTagTime;

  // Mock scan listener stream for Emulator/Sim
  final _mockController = StreamController<String>.broadcast();
  StreamSubscription<String>? _mockSubscription;

  void triggerMockScan(String uid) {
    if (kDebugMode) {
      _mockController.add(uid);
    }
  }

  Future<void> startListening() async {
    if (_isListening) return;
    _isListening = true;
    _lastTagUid = null;
    _lastTagTime = null;

    // Start listening to mock events in debug mode
    if (kDebugMode) {
      _mockSubscription = _mockController.stream.listen((uid) {
        _handleTagScanned(uid);
      });
    }

    _pollPhysicalNfc();
  }

  Future<void> stopListening() async {
    _isListening = false;
    _mockSubscription?.cancel();
    _mockSubscription = null;
    try {
      await FlutterNfcKit.finish();
    } catch (_) {}
  }

  Future<void> _pollPhysicalNfc() async {
    // Check if device supports NFC
    try {
      final availability = await FlutterNfcKit.nfcAvailability;
      if (availability != NFCAvailability.available) {
        _stateController.add(NfcState.unavailable);
        _messageController.add("Thiết bị không hỗ trợ NFC");
        return;
      }
    } catch (e) {
      _stateController.add(NfcState.unavailable);
      _messageController.add("Thiết bị không hỗ trợ NFC");
      return;
    }

    _stateController.add(NfcState.ready);
    _messageController.add("Sẵn sàng quét thẻ");

    while (_isListening) {
      try {
        final tag = await FlutterNfcKit.poll(
          timeout: const Duration(seconds: 20),
          iosAlertMessage: "Đang đợi quét thẻ học...",
        );
        
        await _handleTagScanned(tag.id);
        
        // Brief pause before polling again
        await Future.delayed(const Duration(milliseconds: 1000));
      } catch (e) {
        // Safe check for timeout or cancelled poll
        if (!_isListening) break;
        await Future.delayed(const Duration(milliseconds: 1000));
      }
    }
  }

  Future<void> _handleTagScanned(String uid) async {
    final now = DateTime.now();

    // Debounce / Throttle repeated tag scans (2 seconds window)
    if (_lastTagUid == uid && _lastTagTime != null && now.difference(_lastTagTime!).inSeconds < 2) {
      debugPrint('NFC: Skipped duplicate scan of $uid within debounce window.');
      return;
    }

    _lastTagUid = uid;
    _lastTagTime = now;

    _stateController.add(NfcState.reading);
    _messageController.add("Đang nhận dạng thẻ...");

    try {
      final response = await ApiClient.instance.post('/api/nfc/resolve', {'tagUid': uid});
      if (response != null && response['success'] == true) {
        final resolved = NfcResolvedTag.fromMap(response['data']);
        _stateController.add(NfcState.success);
        _messageController.add("Đã nhận thẻ: ${resolved.displayName}");
        _tagController.add(resolved);
      } else {
        _stateController.add(NfcState.error);
        _messageController.add(response?['message'] ?? "Thẻ chưa được hỗ trợ.");
      }
    } catch (e) {
      _stateController.add(NfcState.error);
      _messageController.add("Không thể kết nối đến máy chủ.");
    }
  }
}
