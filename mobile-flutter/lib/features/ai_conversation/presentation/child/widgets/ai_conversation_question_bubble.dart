import 'package:flutter/material.dart';

import '../../../../../core/theme/app_colors.dart';

class AiConversationQuestionBubble extends StatelessWidget {
  const AiConversationQuestionBubble({super.key, required this.question});

  final String question;

  @override
  Widget build(BuildContext context) => Container(
    width: double.infinity,
    padding: const EdgeInsets.all(18),
    decoration: BoxDecoration(
      color: Colors.white,
      border: Border.all(color: AppColors.sky.withValues(alpha: .28)),
      borderRadius: BorderRadius.circular(20),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withValues(alpha: .04),
          blurRadius: 14,
          offset: const Offset(0, 6),
        ),
      ],
    ),
    child: Text(
      question,
      style: const TextStyle(
        fontSize: 22,
        height: 1.28,
        fontWeight: FontWeight.w900,
        color: AppColors.text,
      ),
    ),
  );
}
