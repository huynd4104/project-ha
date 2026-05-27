import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_nfc_kit/flutter_nfc_kit.dart';
import 'package:ndef/ndef.dart' as ndef;
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
    this.description,
    this.metadata = const {},
  });

  final String tagUid;
  final String tagType;
  final String targetType;
  final String? targetId;
  final String? payloadValue;
  final String displayName;
  final String? spokenText;
  final String? description;
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
      description: map['description']?.toString(),
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

    if (kDebugMode) {
      _mockSubscription = _mockController.stream.listen((input) {
        final trimmed = input.trim();
        final match = RegExp(r'PHA_[A-Z0-9_]+').firstMatch(trimmed);
        if (match != null) {
          final extracted = match.group(0);
          _handleTagScanned('mock_uid_${extracted!.toLowerCase()}', extracted);
        } else {
          _handleTagScanned(trimmed, null);
        }
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

        String? ndefPayload;
        if (tag.ndefAvailable == true) {
          try {
            final records = await FlutterNfcKit.readNDEFRecords();
            for (var record in records) {
              String? recordText;
              if (record is ndef.TextRecord) {
                recordText = record.text;
              } else if (record is ndef.UriRecord) {
                recordText = record.uriString;
              } else {
                recordText = record.toString();
              }

              if (recordText != null) {
                final match = RegExp(r'PHA_[A-Z0-9_]+').firstMatch(recordText);
                if (match != null) {
                  ndefPayload = recordText;
                  break;
                }
              }
            }
          } catch (e) {
            debugPrint('NFC: Error reading NDEF records: $e');
          }
        }

        await _handleTagScanned(tag.id, ndefPayload);

        await Future.delayed(const Duration(milliseconds: 1000));
      } catch (e) {
        if (!_isListening) break;
        await Future.delayed(const Duration(milliseconds: 1000));
      }
    }
  }

  Future<void> _handleTagScanned(String uid, String? ndefPayload) async {
    String? extractedToken;
    if (ndefPayload != null) {
      final match = RegExp(r'PHA_[A-Z0-9_]+').firstMatch(ndefPayload);
      if (match != null) {
        extractedToken = match.group(0);
      }
    }

    if (extractedToken == null && uid.isNotEmpty) {
      final match = RegExp(r'PHA_[A-Z0-9_]+').firstMatch(uid);
      if (match != null) {
        extractedToken = match.group(0);
      }
    }

    final hasToken = extractedToken != null;
    final hasUid = uid.isNotEmpty;

    if (!hasToken && !hasUid) {
      _stateController.add(NfcState.error);
      _messageController.add("Thẻ NFC này chưa có nội dung hợp lệ. Hãy ghi nội dung thẻ từ trang Quản lý thẻ NFC.");
      return;
    }

    final now = DateTime.now();
    final debounceKey = extractedToken ?? uid;

    if (_lastTagUid == debounceKey && _lastTagTime != null && now.difference(_lastTagTime!).inSeconds < 2) {
      debugPrint('NFC: Skipped duplicate scan of $debounceKey within debounce window.');
      return;
    }

    _lastTagUid = debounceKey;
    _lastTagTime = now;

    _stateController.add(NfcState.reading);
    _messageController.add("Đang nhận dạng thẻ...");

    try {
      final Map<String, dynamic> body = {};
      if (hasToken) {
        body['payload'] = extractedToken;
      } else {
        body['tagUid'] = uid;
      }
      final response = await ApiClient.instance.post('/api/nfc/resolve', body);

      if (response != null && response['success'] == true) {
        final resolved = NfcResolvedTag.fromMap(response['data']);
        _stateController.add(NfcState.success);
        _messageController.add("Đã nhận thẻ: ${resolved.displayName}");
        _tagController.add(resolved);
      } else {
        _stateController.add(NfcState.error);
        final msg = response?['message'];
        if (msg != null && msg.toString().isNotEmpty) {
          _messageController.add(msg.toString());
        } else {
          _messageController.add("Thẻ NFC này chưa có nội dung hợp lệ. Hãy ghi nội dung thẻ từ trang Quản lý thẻ NFC.");
        }
      }
    } catch (e) {
      _stateController.add(NfcState.error);
      _messageController.add("Không thể kết nối đến máy chủ.");
    }
  }
}
