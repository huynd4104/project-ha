import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';
import 'app_button.dart';

Future<bool> showAppConfirmationDialog(
  BuildContext context, {
  required String title,
  required String message,
  String confirmLabel = 'Đồng ý',
  String cancelLabel = 'Ở lại',
}) async {
  final result = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      backgroundColor: AppColors.background,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
      ),
      titlePadding: const EdgeInsets.fromLTRB(24, 24, 24, 12),
      contentPadding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
      actionsPadding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
      title: Text(
        title,
        style: AppTextStyles.title.copyWith(fontSize: 24),
      ),
      content: Text(
        message,
        style: AppTextStyles.body.copyWith(fontSize: 16),
      ),
      actions: [
        Row(
          children: [
            Expanded(
              child: AppButton(
                label: cancelLabel,
                icon: Icons.play_arrow_rounded,
                variant: AppButtonVariant.primary,
                onPressed: () => Navigator.pop(context, false),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: AppButton(
                label: confirmLabel,
                icon: Icons.close_rounded,
                variant: AppButtonVariant.ghost,
                onPressed: () => Navigator.pop(context, true),
              ),
            ),
          ],
        ),
      ],
    ),
  );
  return result ?? false;
}
