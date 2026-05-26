import 'package:flutter/material.dart';

import '../../../../../core/theme/app_colors.dart';
import '../../../data/models/ai_conversation_daily_progress.dart';

class AiDailyProgressChart extends StatelessWidget {
  const AiDailyProgressChart({super.key, required this.items});

  final List<AiConversationDailyProgress> items;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return const Text(
        'Chưa có dữ liệu theo ngày.',
        style: TextStyle(color: AppColors.muted),
      );
    }
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: items.take(7).map((item) {
        final height = 24 + (item.completedSessions.clamp(0, 5) * 12);
        return Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 3),
            child: Container(
              height: height.toDouble(),
              decoration: BoxDecoration(
                color: AppColors.sky.withValues(alpha: .75),
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
