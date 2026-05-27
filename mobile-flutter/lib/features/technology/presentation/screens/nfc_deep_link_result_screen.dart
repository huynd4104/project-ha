import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/services/tts_service.dart';

class NfcDeepLinkResultScreen extends StatefulWidget {
  const NfcDeepLinkResultScreen({
    super.key,
    required this.payloadUri,
  });

  final String payloadUri;

  @override
  State<NfcDeepLinkResultScreen> createState() => _NfcDeepLinkResultScreenState();
}

class _NfcDeepLinkResultScreenState extends State<NfcDeepLinkResultScreen> {
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic>? _resolvedData;

  @override
  void initState() {
    super.initState();
    _resolvePayload();
  }

  Future<void> _resolvePayload() async {
    setState(() {
      _isLoading = true;
      _error = null;
      _resolvedData = null;
    });

    try {
      final match = RegExp(r'PHA_[A-Z0-9_]+').firstMatch(widget.payloadUri);
      final token = match != null ? match.group(0) : widget.payloadUri;

      if (token == null || token.trim().isEmpty) {
        setState(() {
          _error = 'Thẻ NFC này chưa có nội dung hợp lệ. Hãy ghi nội dung thẻ từ trang Quản lý thẻ NFC.';
          _isLoading = false;
        });
        return;
      }

      final response = await ApiClient.instance.post('/api/nfc/resolve', {
        'payload': token,
      });

      if (response != null && response['success'] == true) {
        final data = response['data'] as Map<String, dynamic>;
        setState(() {
          _resolvedData = data;
          _isLoading = false;
        });

        // Trigger TTS if available
        final spokenText = data['spokenText']?.toString();
        if (spokenText != null && spokenText.isNotEmpty) {
          TtsService.instance.speak(spokenText);
        }
      } else {
        setState(() {
          _error = response?['message']?.toString() ??
              'Thẻ NFC này chưa có nội dung hợp lệ. Hãy ghi nội dung thẻ từ trang Quản lý thẻ NFC.';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Không thể kết nối đến máy chủ.';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Kết quả NFC'),
        centerTitle: true,
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Colors.blue.shade50, Colors.white],
          ),
        ),
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Card(
              elevation: 4,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(24),
              ),
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (_isLoading) ...[
                      const CircularProgressIndicator(),
                      const SizedBox(height: 24),
                      const Text(
                        'Đang nhận dạng thẻ...',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ] else if (_error != null) ...[
                      const Icon(
                        Icons.error_outline_rounded,
                        color: Colors.red,
                        size: 80,
                      ),
                      const SizedBox(height: 24),
                      Text(
                        _error!,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 16,
                          color: Colors.black87,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ] else if (_resolvedData != null) ...[
                      const Icon(
                        Icons.check_circle_outline_rounded,
                        color: Colors.green,
                        size: 80,
                      ),
                      const SizedBox(height: 24),
                      Text(
                        _resolvedData!['displayName']?.toString() ?? 'Thẻ học tập',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Divider(),
                      const SizedBox(height: 16),
                      _buildDetailRow(
                        'Loại thẻ:',
                        _resolvedData!['tagType']?.toString() ?? 'Chưa xác định',
                      ),
                      const SizedBox(height: 12),
                      _buildDetailRow(
                        'Nội dung đọc:',
                        _resolvedData!['spokenText']?.toString() ?? 'Không có',
                      ),
                      const SizedBox(height: 12),
                      _buildDetailRow(
                        'Payload nội bộ:',
                        _resolvedData!['payloadValue']?.toString() ?? 'Chưa có',
                      ),
                      if (_resolvedData!['description'] != null) ...[
                        const SizedBox(height: 12),
                        _buildDetailRow(
                          'Mô tả:',
                          _resolvedData!['description'].toString(),
                        ),
                      ],
                    ],
                    const SizedBox(height: 32),
                    ElevatedButton(
                      onPressed: () {
                        if (Navigator.canPop(context)) {
                          Navigator.pop(context);
                        } else {
                          context.go('/home');
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue.shade600,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 32,
                          vertical: 16,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 2,
                      ),
                      child: const Text(
                        'Về trang Công nghệ học tập',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 120,
          child: Text(
            label,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              color: Colors.grey,
              fontSize: 15,
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              color: Colors.black87,
              fontSize: 15,
            ),
          ),
        ),
      ],
    );
  }
}
