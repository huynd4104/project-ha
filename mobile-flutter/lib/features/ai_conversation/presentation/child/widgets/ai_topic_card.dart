import 'package:flutter/material.dart';

import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_text_styles.dart';
import '../../../../../core/widgets/app_card.dart';
import '../../../data/models/ai_conversation_topic.dart';

class AiTopicCard extends StatelessWidget {
  const AiTopicCard({super.key, required this.topic, required this.onTap});

  final AiConversationTopic topic;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => AppCard(
    onTap: onTap,
    color: const Color(0xFFF8FAFC),
    child: Row(
      children: [
        CircleAvatar(
          radius: 30,
          backgroundColor: AppColors.sky.withValues(alpha: .16),
          child: Icon(_iconFor(topic.iconName), color: AppColors.sky, size: 32),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(topic.title, style: AppTextStyles.title),
              const SizedBox(height: 4),
              Text(
                topic.description,
                style: AppTextStyles.caption.copyWith(
                  fontWeight: FontWeight.w700,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        const Icon(Icons.chevron_right_rounded),
      ],
    ),
  );

  IconData _iconFor(String name) {
    final normalized = name.toLowerCase();
    if (normalized.contains('family')) {
      return Icons.family_restroom_rounded;
    }
    if (normalized.contains('emotion')) {
      return Icons.sentiment_satisfied_rounded;
    }
    if (normalized.contains('color')) {
      return Icons.palette_rounded;
    }
    if (normalized.contains('object')) {
      return Icons.widgets_rounded;
    }
    return Icons.waving_hand_rounded;
  }
}
