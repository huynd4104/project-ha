import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_card.dart';

class RecommendationCard extends StatelessWidget {
  const RecommendationCard({super.key, required this.text});
  final String text;

  @override
  Widget build(BuildContext context) => AppCard(
    color: AppColors.cream,
    borderColor: AppColors.yellow,
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Icon(Icons.lightbulb_rounded, color: AppColors.orange),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(fontWeight: FontWeight.w800, height: 1.35),
          ),
        ),
      ],
    ),
  );
}
