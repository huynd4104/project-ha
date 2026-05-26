import 'package:flutter/material.dart';

import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/widgets/app_card.dart';
import '../../../data/models/ai_conversation_topic_progress.dart';

class AiTopicProgressCard extends StatelessWidget {
  const AiTopicProgressCard({super.key, required this.progress, this.onTap});

  final AiConversationTopicProgress progress;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => AppCard(
    onTap: onTap,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                progress.topicTitle,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
            Text('${(progress.averageScore * 100).round()}%'),
          ],
        ),
        const SizedBox(height: 10),
        ClipRRect(
          borderRadius: BorderRadius.circular(99),
          child: LinearProgressIndicator(
            value: progress.averageScore.clamp(0, 1),
            minHeight: 10,
            backgroundColor: AppColors.border,
            color: progress.needsPractice ? AppColors.orange : AppColors.teal,
          ),
        ),
      ],
    ),
  );
}
