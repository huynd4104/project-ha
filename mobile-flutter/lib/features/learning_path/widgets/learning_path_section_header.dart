import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';

class LearningPathSectionHeader extends StatelessWidget {
  const LearningPathSectionHeader({super.key, required this.title});
  final String title;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 16),
    child: Row(
      children: [
        Expanded(child: Divider(color: AppColors.border.withValues(alpha: .8))),
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 10),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: AppColors.sky.withValues(alpha: .12),
            borderRadius: BorderRadius.circular(AppRadius.pill),
          ),
          child: Text(
            title,
            style: const TextStyle(
              color: AppColors.text,
              fontWeight: FontWeight.w900,
            ),
          ),
        ),
        Expanded(child: Divider(color: AppColors.border.withValues(alpha: .8))),
      ],
    ),
  );
}
