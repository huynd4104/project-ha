import 'package:flutter/material.dart';

import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/widgets/app_card.dart';
import '../../../data/models/ai_conversation_progress_overview.dart';

class AiProgressOverviewCard extends StatelessWidget {
  const AiProgressOverviewCard({super.key, required this.overview});

  final AiConversationProgressOverview overview;

  @override
  Widget build(BuildContext context) => AppCard(
    color: const Color(0xFFF8FAFC),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Tổng quan hội thoại AI',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
        ),
        const SizedBox(height: 10),
        Text(
          overview.strongTopics.isEmpty
              ? 'Bé đang bắt đầu luyện nói qua các chủ đề ngắn.'
              : 'Bé đang tiến bộ tốt ở: ${overview.strongTopics.join(", ")}.',
          style: const TextStyle(color: AppColors.text, height: 1.35),
        ),
        if (overview.needsPracticeTopics.isNotEmpty) ...[
          const SizedBox(height: 6),
          Text(
            'Nên luyện thêm: ${overview.needsPracticeTopics.join(", ")}.',
            style: const TextStyle(color: AppColors.muted, height: 1.35),
          ),
        ],
      ],
    ),
  );
}
