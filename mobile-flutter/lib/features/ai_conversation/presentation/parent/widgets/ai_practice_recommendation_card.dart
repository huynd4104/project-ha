import 'package:flutter/material.dart';

import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/widgets/app_card.dart';
import '../../../data/models/ai_conversation_recommendation.dart';

class AiPracticeRecommendationCard extends StatelessWidget {
  const AiPracticeRecommendationCard({super.key, required this.item});

  final AiConversationRecommendation item;

  @override
  Widget build(BuildContext context) => AppCard(
    color: const Color(0xFFFFFBEB),
    borderColor: AppColors.yellow.withValues(alpha: .35),
    child: Row(
      children: [
        const Icon(Icons.lightbulb_rounded, color: AppColors.orange),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                item.title,
                style: const TextStyle(fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 4),
              Text(
                item.description,
                style: const TextStyle(color: AppColors.muted, height: 1.35),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}
