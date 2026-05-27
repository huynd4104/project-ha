import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../../../core/services/nfc_service.dart';
import '../../../core/services/tts_service.dart';

mixin NfcTtsMixin<T extends StatefulWidget> on State<T> {
  StreamSubscription<NfcResolvedTag>? _nfcTagSubscription;
  bool _startedListening = false;

  bool get enableNfcListening => true;

  @override
  void initState() {
    super.initState();
    if (enableNfcListening) {
      _startedListening = true;
      NfcService.instance.startListening();
      _nfcTagSubscription = NfcService.instance.tagStream.listen((tag) {
        if (mounted) {
          onNfcTagScanned(tag);
        }
      });
    }
  }

  @override
  void dispose() {
    _nfcTagSubscription?.cancel();
    if (_startedListening) {
      NfcService.instance.stopListening();
    }
    TtsService.instance.stop();
    super.dispose();
  }

  /// Override this in state class to handle resolved tag events
  void onNfcTagScanned(NfcResolvedTag tag);

  /// Automatically plays the question voice.
  void speakQuestion(String text) {
    TtsService.instance.speakQuestion(text);
  }

  /// Repeats the question voice when prompt is tapped.
  void handleQuestionTap(String text) {
    TtsService.instance.speakQuestion(text);
  }

  /// Plays evaluation voice feedback.
  /// Priority:
  /// 1. customFeedback (e.g. success_feedback / failure_feedback from DB)
  /// 2. explanation if available
  /// 3. fallback defaults
  void speakEvaluationFeedback(bool correct, {String? customFeedback, String? explanation}) {
    if (correct) {
      if (customFeedback != null && customFeedback.trim().isNotEmpty) {
        TtsService.instance.speakCorrectFeedback(customFeedback);
      } else if (explanation != null && explanation.trim().isNotEmpty) {
        TtsService.instance.speakCorrectFeedback('Đúng rồi, bạn giỏi quá! $explanation');
      } else {
        TtsService.instance.speakCorrectFeedback('Đúng rồi, bạn giỏi quá!');
      }
    } else {
      if (customFeedback != null && customFeedback.trim().isNotEmpty) {
        TtsService.instance.speakWrongFeedback(customFeedback);
      } else if (explanation != null && explanation.trim().isNotEmpty) {
        TtsService.instance.speakWrongFeedback('Tiếc quá, chưa chính xác rồi. $explanation');
      } else {
        TtsService.instance.speakWrongFeedback('Tiếc quá, chưa chính xác rồi. Mình thử lại nhé!');
      }
    }
  }

  /// Plays explanation text.
  void speakExplanation(String explanation) {
    TtsService.instance.speakExplanation(explanation);
  }

  /// Renders a child-friendly NFC state indicator with debug Mock option.
  Widget buildNfcIndicator(BuildContext context) {
    if (!enableNfcListening) {
      return Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.teal.shade50,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.teal.shade200, width: 1.5),
        ),
        child: Row(
          children: [
            Icon(Icons.link_rounded, size: 20, color: Colors.teal.shade900),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Đang hiển thị kết quả từ thẻ NFC',
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.teal.shade900,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return StreamBuilder<NfcState>(
      stream: NfcService.instance.stateStream,
      initialData: NfcState.ready,
      builder: (context, stateSnap) {
        final state = stateSnap.data ?? NfcState.ready;
        return StreamBuilder<String>(
          stream: NfcService.instance.messageStream,
          initialData: "Đang sẵn sàng quét thẻ NFC...",
          builder: (context, msgSnap) {
            final msg = msgSnap.data ?? "Đang sẵn sàng quét thẻ NFC...";
            
            Color bgColor = Colors.blue.shade50;
            Color borderColor = Colors.blue.shade200;
            Color textColor = Colors.blue.shade900;
            IconData icon = Icons.nfc_rounded;

            if (state == NfcState.unavailable) {
              bgColor = Colors.grey.shade100;
              borderColor = Colors.grey.shade300;
              textColor = Colors.grey.shade600;
              icon = Icons.nfc_outlined;
            } else if (state == NfcState.reading) {
              bgColor = Colors.amber.shade50;
              borderColor = Colors.amber.shade300;
              textColor = Colors.amber.shade900;
              icon = Icons.hourglass_empty_rounded;
            } else if (state == NfcState.success) {
              bgColor = Colors.green.shade50;
              borderColor = Colors.green.shade200;
              textColor = Colors.green.shade900;
              icon = Icons.check_circle_rounded;
            } else if (state == NfcState.error) {
              bgColor = Colors.red.shade50;
              borderColor = Colors.red.shade200;
              textColor = Colors.red.shade900;
              icon = Icons.error_outline_rounded;
            }

            return Container(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: bgColor,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: borderColor, width: 1.5),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Row(
                      children: [
                        Icon(icon, size: 20, color: textColor),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            msg,
                            style: TextStyle(
                              fontSize: 13,
                              color: textColor,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (kDebugMode)
                    GestureDetector(
                      onTap: () {
                        showDialog(
                          context: context,
                          builder: (ctx) {
                            final textController = TextEditingController();
                            return AlertDialog(
                              title: const Text('Giả lập quét thẻ NFC'),
                              content: TextField(
                                controller: textController,
                                decoration: const InputDecoration(
                                  hintText: 'Nhập mã UID của thẻ...',
                                ),
                              ),
                              actions: [
                                TextButton(
                                  onPressed: () => Navigator.pop(ctx),
                                  child: const Text('Hủy'),
                                ),
                                TextButton(
                                  onPressed: () {
                                    final val = textController.text.trim();
                                    if (val.isNotEmpty) {
                                      NfcService.instance.triggerMockScan(val);
                                    }
                                    Navigator.pop(ctx);
                                  },
                                  child: const Text('Quét thẻ'),
                                ),
                              ],
                            );
                          },
                        );
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.orange.shade100,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.orange.shade300),
                        ),
                        child: const Text(
                          'MOCK',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w900,
                            color: Colors.orange,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}
