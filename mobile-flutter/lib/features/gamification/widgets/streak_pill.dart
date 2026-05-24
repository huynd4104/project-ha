import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';

class StreakPill extends StatelessWidget {
  const StreakPill({super.key, required this.days});
  final int days;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
    decoration: BoxDecoration(
      color: AppColors.orange.withValues(alpha: .14),
      borderRadius: BorderRadius.circular(AppRadius.pill),
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(
          Icons.local_fire_department_rounded,
          color: AppColors.orange,
        ),
        const SizedBox(width: 6),
        Text('$days ngày', style: const TextStyle(fontWeight: FontWeight.w900)),
      ],
    ),
  );
}
