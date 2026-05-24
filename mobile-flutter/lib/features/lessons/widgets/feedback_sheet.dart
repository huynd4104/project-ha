import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

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
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(18),
    decoration: BoxDecoration(
      color: correct
          ? AppColors.primary.withValues(alpha: .14)
          : AppColors.error.withValues(alpha: .12),
      borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
    ),
    child: SafeArea(
      top: false,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            correct ? 'Chính xác!' : 'Chưa đúng',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: correct ? AppColors.primary : AppColors.error,
            ),
          ),
          const SizedBox(height: 6),
          Text(message),
          const SizedBox(height: 12),
          FilledButton(onPressed: onContinue, child: const Text('Tiếp tục')),
        ],
      ),
    ),
  );
}
