import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_icon_button.dart';
import 'lesson_progress_bar.dart';

class LessonHeader extends StatelessWidget {
  const LessonHeader({
    super.key,
    required this.title,
    required this.progress,
    required this.activityLabel,
    required this.onBack,
    this.onHelp,
  });

  final String title;
  final double progress;
  final String activityLabel;
  final VoidCallback onBack;
  final VoidCallback? onHelp;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 8),
        child: Row(
          children: [
            AppIconButton(
              icon: Icons.close_rounded,
              tooltip: 'Dừng bài học',
              onPressed: onBack,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    activityLabel,
                    style: const TextStyle(
                      color: AppColors.muted,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 6),
                  LessonProgressBar(value: progress),
                ],
              ),
            ),
            const SizedBox(width: 12),
            AppIconButton(
              icon: Icons.volume_up_rounded,
              tooltip: 'Nghe hướng dẫn',
              onPressed: onHelp,
            ),
          ],
        ),
      ),
    );
  }
}
