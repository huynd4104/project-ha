import 'package:flutter/material.dart';

import '../../../core/constants/mascot_assets.dart';
import '../../../core/constants/mascot_reaction.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_image.dart';
import '../../../core/widgets/mascot_image.dart';
import '../../../models/npc.dart';

class MascotMessageBubble extends StatelessWidget {
  const MascotMessageBubble({
    super.key,
    required this.message,
    this.npc,
    this.mascotReaction,
    this.icon = Icons.auto_awesome_rounded,
  });

  final String message;
  final NPC? npc;

  /// Reaction shown when no NPC image is available.
  /// Defaults to [MascotReaction.welcome] when null and npc has no image.
  final MascotReaction? mascotReaction;

  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        _MascotAvatar(npc: npc, mascotReaction: mascotReaction, icon: icon),
        const SizedBox(width: 10),
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(
                AppRadius.lg,
              ).copyWith(bottomLeft: const Radius.circular(6)),
              border: Border.all(color: AppColors.border),
            ),
            child: Text(message, style: AppTextStyles.subtitle),
          ),
        ),
      ],
    );
  }
}

class _MascotAvatar extends StatelessWidget {
  const _MascotAvatar({
    required this.npc,
    required this.mascotReaction,
    required this.icon,
  });
  final NPC? npc;
  final MascotReaction? mascotReaction;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final imageUrl = npc?.imageUrl ?? '';

    // 1. NPC has a network image — show it (original behavior)
    if (imageUrl.isNotEmpty) {
      return CircleAvatar(
        radius: 31,
        backgroundColor: AppColors.yellow,
        child: ClipOval(
          child: AppImage(
            imageUrl: imageUrl,
            width: 62,
            height: 62,
            fit: BoxFit.cover,
            placeholderIcon: icon,
          ),
        ),
      );
    }

    // 2. No NPC image — use local mascot asset
    final reaction = mascotReaction ?? MascotReaction.welcome;
    return SizedBox(
      width: 62,
      height: 62,
      child: MascotImage(
        assetPath: reaction == MascotReaction.welcome
            ? MascotAssets.appIconAvatar
            : reaction.assetPath,
        width: 62,
        height: 62,
        fit: BoxFit.contain,
        semanticLabel: '',
      ),
    );
  }
}
