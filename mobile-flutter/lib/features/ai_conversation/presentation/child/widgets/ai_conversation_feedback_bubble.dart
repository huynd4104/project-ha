import 'package:flutter/material.dart';

import '../../../../../core/theme/app_colors.dart';

class AiConversationFeedbackBubble extends StatelessWidget {
  const AiConversationFeedbackBubble({super.key, required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    if (text.trim().isEmpty) return const SizedBox.shrink();
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF0FDF4),
        border: Border.all(color: AppColors.teal.withValues(alpha: .25)),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: Color(0xFF166534),
          fontSize: 16,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }
}
