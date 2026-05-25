import 'package:flutter/material.dart';

import '../constants/mascot_reaction.dart';
import '../theme/app_colors.dart';
import 'mascot_image.dart';

class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.title,
    required this.message,
    this.icon = Icons.inbox_rounded,
    this.mascotReaction,
  });

  final String title;
  final String message;

  /// Generic icon fallback. Ignored when [mascotReaction] is provided.
  final IconData icon;

  /// When set, the mascot image is shown instead of the generic [icon].
  final MascotReaction? mascotReaction;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (mascotReaction != null)
              MascotImage(
                reaction: mascotReaction,
                width: 140,
                height: 140,
              )
            else
              Icon(icon, size: 58, color: AppColors.sky),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 6),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.muted, fontSize: 15),
            ),
          ],
        ),
      ),
    );
  }
}
