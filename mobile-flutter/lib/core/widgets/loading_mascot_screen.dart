import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../theme/app_colors.dart';
import '../theme/app_text_styles.dart';

class LoadingMascotScreen extends StatelessWidget {
  const LoadingMascotScreen({
    super.key,
    this.message = 'Đang chuẩn bị bài học...',
  });

  final String message;

  @override
  Widget build(BuildContext context) => Center(
    child: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 92,
          height: 92,
          decoration: const BoxDecoration(
            color: AppColors.yellow,
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.auto_awesome_rounded,
            size: 48,
            color: AppColors.text,
          ),
        ).animate().scale(duration: 700.ms).fadeIn(),
        const SizedBox(height: 16),
        Text(
          message,
          style: AppTextStyles.subtitle,
          textAlign: TextAlign.center,
        ),
      ],
    ),
  );
}
