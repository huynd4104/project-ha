import 'package:flutter/material.dart';

import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/widgets/app_card.dart';
import '../../../data/models/ai_conversation_session_history.dart';

class AiSessionHistoryCard extends StatelessWidget {
  const AiSessionHistoryCard({super.key, required this.session, this.onTap});

  final AiConversationSessionHistory session;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => AppCard(
    onTap: onTap,
    child: Row(
      children: [
        const CircleAvatar(
          backgroundColor: Color(0xFFE0F2FE),
          child: Icon(Icons.record_voice_over_rounded, color: AppColors.sky),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                session.topicTitle,
                style: const TextStyle(fontWeight: FontWeight.w900),
              ),
              const SizedBox(height: 3),
              Text(
                '${session.answeredQuestions} câu • ${session.durationSeconds ~/ 60} phút',
                style: const TextStyle(color: AppColors.muted, fontSize: 12),
              ),
            ],
          ),
        ),
        const Icon(Icons.chevron_right_rounded),
      ],
    ),
  );
}
