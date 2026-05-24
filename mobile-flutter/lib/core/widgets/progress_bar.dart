import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

class ProgressBar extends StatelessWidget {
  const ProgressBar({
    super.key,
    required this.value,
    this.height = 12,
    this.color = AppColors.primary,
  });

  final double value;
  final double height;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(99),
      child: LinearProgressIndicator(
        minHeight: height,
        value: value.clamp(0, 1),
        backgroundColor: AppColors.border,
        valueColor: AlwaysStoppedAnimation(color),
      ),
    );
  }
}
