import 'package:flutter/material.dart';

import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/progress_bar.dart';
import '../data/gamification_repository.dart';

class LevelCard extends StatelessWidget {
  const LevelCard({super.key, required this.stats});
  final LevelStats stats;
  @override
  Widget build(BuildContext context) => AppCard(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Level ${stats.level}',
          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900),
        ),
        const SizedBox(height: 8),
        ProgressBar(value: stats.xpInLevel / stats.xpToNextLevel),
        const SizedBox(height: 6),
        Text('${stats.totalXp} XP tổng'),
      ],
    ),
  );
}
