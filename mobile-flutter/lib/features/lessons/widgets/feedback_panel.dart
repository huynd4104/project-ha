import 'package:flutter/material.dart';

import '../../../core/constants/mascot_reaction.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/mascot_image.dart';

enum FeedbackType { correct, wrong, nearCorrect }

extension _FeedbackTypeX on FeedbackType {
  Color get color => switch (this) {
    FeedbackType.correct => AppColors.success,
    FeedbackType.wrong => AppColors.coral,
    FeedbackType.nearCorrect => AppColors.orange,
  };

  String get title => switch (this) {
    FeedbackType.correct => 'Đúng rồi!',
    FeedbackType.wrong => 'Thử lại nhé!',
    FeedbackType.nearCorrect => 'Con làm gần đúng rồi!',
  };

  MascotReaction get mascotReaction => switch (this) {
    FeedbackType.correct => MascotReaction.correct,
    FeedbackType.wrong => MascotReaction.tryAgain,
    FeedbackType.nearCorrect => MascotReaction.almostCorrect,
  };

  IconData get ctaIcon => switch (this) {
    FeedbackType.correct => Icons.arrow_forward_rounded,
    FeedbackType.wrong => Icons.refresh_rounded,
    FeedbackType.nearCorrect => Icons.refresh_rounded,
  };
}

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
    final color = type.color;
    return Container(
      padding: const EdgeInsets.fromLTRB(18, 12, 18, 18),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .10),
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(AppRadius.lg),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // ── Mascot reaction image ──────────────────────────────────────
            MascotImage(reaction: type.mascotReaction, width: 88, height: 88),
            const SizedBox(height: 6),

            // ── Feedback title row ─────────────────────────────────────────
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: color,
                  radius: 18,
                  child: Icon(
                    type == FeedbackType.correct
                        ? Icons.check_rounded
                        : Icons.favorite_rounded,
                    color: Colors.white,
                    size: 18,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    type.title,
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
              icon: type.ctaIcon,
              backgroundColor: color,
              onPressed: onPressed,
            ),
          ],
        ),
      ),
    );
  }
}
