import 'package:flutter/material.dart';

import '../../../../../core/theme/app_colors.dart';

class AiConversationTimerBar extends StatelessWidget {
  const AiConversationTimerBar({
    super.key,
    required this.remainingSeconds,
    required this.totalSeconds,
  });

  final int remainingSeconds;
  final int totalSeconds;

  @override
  Widget build(BuildContext context) {
    final value = totalSeconds == 0 ? 0.0 : remainingSeconds / totalSeconds;
    final minutes = remainingSeconds ~/ 60;
    final seconds = remainingSeconds % 60;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: LinearProgressIndicator(
            value: value.clamp(0, 1),
            minHeight: 12,
            backgroundColor: AppColors.border,
            color: AppColors.teal,
          ),
        ),
        const SizedBox(height: 6),
        Text('$minutes:${seconds.toString().padLeft(2, '0')}'),
      ],
    );
  }
}
