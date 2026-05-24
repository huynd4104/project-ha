import 'package:flutter/material.dart';

import '../../../core/widgets/app_card.dart';
import '../../../core/theme/app_colors.dart';
import '../data/gamification_repository.dart';
import 'xp_progress_bar.dart';

class LevelCard extends StatelessWidget {
  const LevelCard({super.key, required this.stats});
  final LevelStats stats;
  @override
  Widget build(BuildContext context) => AppCard(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const CircleAvatar(
              backgroundColor: AppColors.yellow,
              child: Icon(Icons.auto_awesome_rounded, color: AppColors.text),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Level ${stats.level}',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
            Text(
              '${stats.totalXp} XP',
              style: const TextStyle(fontWeight: FontWeight.w900),
            ),
          ],
        ),
        const SizedBox(height: 8),
        XpProgressBar(stats: stats),
        const SizedBox(height: 6),
        Text(
          '${stats.xpInLevel}/${stats.xpToNextLevel} XP đến level tiếp theo',
        ),
      ],
    ),
  );
}
