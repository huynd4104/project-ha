import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_image.dart';
import '../../../models/badge.dart' as model;

class BadgeCard extends StatelessWidget {
  const BadgeCard({super.key, required this.badge});
  final model.Badge badge;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: badge.isEarned ? Colors.white : const Color(0xFFF3F4F6),
      borderRadius: BorderRadius.circular(18),
      border: Border.all(
        color: badge.isEarned ? AppColors.yellow : AppColors.border,
        width: 1.5,
      ),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Opacity(
          opacity: badge.isEarned ? 1.0 : 0.4,
          child: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: badge.isEarned ? AppColors.yellow : AppColors.border,
              shape: BoxShape.circle,
            ),
            padding: const EdgeInsets.all(6),
            child: badge.iconUrl.isNotEmpty
                ? AppImage(
                    imageUrl: badge.iconUrl,
                    fit: BoxFit.contain,
                    placeholderIcon: badge.isEarned
                        ? Icons.workspace_premium_rounded
                        : Icons.lock_rounded,
                  )
                : Icon(
                    badge.isEarned
                        ? Icons.workspace_premium_rounded
                        : Icons.lock_rounded,
                    color: badge.isEarned ? AppColors.text : AppColors.muted,
                    size: 24,
                  ),
          ),
        ),
        const SizedBox(height: 8),
        Text(badge.name, style: const TextStyle(fontWeight: FontWeight.w900)),
        Text(badge.description, maxLines: 2, overflow: TextOverflow.ellipsis),
      ],
    ),
  );
}
