import 'package:flutter/material.dart';

import 'feedback_panel.dart';

class FeedbackSheet extends StatelessWidget {
  const FeedbackSheet({
    super.key,
    required this.correct,
    required this.message,
    required this.onContinue,
  });
  final bool correct;
  final String message;
  final VoidCallback onContinue;

  @override
  Widget build(BuildContext context) => FeedbackPanel(
    type: correct ? FeedbackType.correct : FeedbackType.wrong,
    message: correct
        ? (message.isEmpty ? 'Con làm tốt lắm!' : message)
        : 'Không sao, mình thử thêm lần nữa nhé.',
    ctaLabel: correct ? 'Tiếp tục' : 'Thử lại',
    onPressed: onContinue,
  );
}
