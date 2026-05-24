import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

class LessonConnector extends StatelessWidget {
  const LessonConnector({super.key, required this.completed});
  final bool completed;

  @override
  Widget build(BuildContext context) => SizedBox(
    height: 54,
    child: Center(
      child: Container(
        width: 6,
        height: 54,
        decoration: BoxDecoration(
          color: completed ? AppColors.primary : AppColors.border,
          borderRadius: BorderRadius.circular(9),
        ),
      ),
    ),
  );
}
