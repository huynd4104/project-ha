import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_button.dart';

enum FeedbackType { correct, wrong, nearCorrect }

class FeedbackPanel extends StatelessWidget {
  const FeedbackPanel({
    super.key,
    required this.type,
    required this.message,
    required this.ctaLabel,
    required this.onPressed,
  });

  final FeedbackType type;
  final String message;
  final String ctaLabel;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final color = switch (type) {
      FeedbackType.correct => AppColors.success,
      FeedbackType.wrong => AppColors.coral,
      FeedbackType.nearCorrect => AppColors.orange,
    };
    final title = switch (type) {
      FeedbackType.correct => 'Đúng rồi!',
      FeedbackType.wrong => 'Gần đúng rồi',
      FeedbackType.nearCorrect => 'Con làm gần đúng rồi!',
    };
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .12),
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(AppRadius.lg),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: color,
                  child: Icon(
                    type == FeedbackType.correct
                        ? Icons.check_rounded
                        : Icons.favorite_rounded,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    title,
                    style: AppTextStyles.title.copyWith(color: color),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(message, style: AppTextStyles.body),
            const SizedBox(height: 14),
            AppButton(
              label: ctaLabel,
              icon: type == FeedbackType.correct
                  ? Icons.arrow_forward_rounded
                  : Icons.refresh_rounded,
              backgroundColor: color,
              onPressed: onPressed,
            ),
          ],
        ),
      ),
    );
  }
}
