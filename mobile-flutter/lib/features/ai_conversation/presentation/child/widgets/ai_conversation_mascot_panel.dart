import 'package:flutter/material.dart';

import '../../../../../core/constants/mascot_assets.dart';
import '../../../../../core/theme/app_colors.dart';
import '../../../../../core/theme/app_text_styles.dart';
import '../../../../../core/widgets/app_card.dart';
import '../../../../../core/widgets/mascot_image.dart';

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
        const SizedBox(
          width: 68,
          height: 68,
          child: MascotImage(
            assetPath: MascotAssets.mascotMain,
            fit: BoxFit.contain,
            animate: false,
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
