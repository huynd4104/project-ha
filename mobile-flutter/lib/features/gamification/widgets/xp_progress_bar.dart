import 'package:flutter/material.dart';

import '../../../core/widgets/progress_bar.dart';
import '../data/gamification_repository.dart';

class XpProgressBar extends StatelessWidget {
  const XpProgressBar({super.key, required this.stats});
  final LevelStats stats;

  @override
  Widget build(BuildContext context) =>
      ProgressBar(value: stats.xpInLevel / stats.xpToNextLevel, height: 14);
}
