import 'package:flutter/material.dart';

import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_text_styles.dart';
import '../../../../../core/widgets/app_card.dart';

class AiConversationMascotPanel extends StatelessWidget {
  const AiConversationMascotPanel({
    super.key,
    required this.message,
    this.reaction = 'welcome',
  });

  final String message;
  final String reaction;

  @override
  Widget build(BuildContext context) => AppCard(
    color: const Color(0xFFFFFBEB),
    borderColor: AppColors.yellow.withValues(alpha: .35),
    child: Row(
      children: [
        const CircleAvatar(
          radius: 34,
          backgroundColor: AppColors.yellow,
          child: Icon(
            Icons.auto_awesome_rounded,
            color: AppColors.text,
            size: 34,
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Text(
            message,
            style: AppTextStyles.subtitle.copyWith(height: 1.25),
          ),
        ),
      ],
    ),
  );
}
