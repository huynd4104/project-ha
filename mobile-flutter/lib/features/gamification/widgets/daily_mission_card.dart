import 'package:flutter/material.dart';

import '../../../core/widgets/app_card.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/progress_bar.dart';
import '../data/gamification_repository.dart';

class DailyMissionCard extends StatelessWidget {
  const DailyMissionCard({
    super.key,
    required this.item,
    required this.onClaim,
  });
  final MissionWithProgress item;
  final VoidCallback onClaim;

  @override
  Widget build(BuildContext context) {
    final safeTarget = item.progress.targetValue == 0
        ? 1
        : item.progress.targetValue;
    final progress = item.progress.currentValue / safeTarget;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const CircleAvatar(
                  backgroundColor: AppColors.teal,
                  child: Icon(Icons.flag_rounded, color: Colors.white),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    item.mission.title,
                    style: const TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 18,
                    ),
                  ),
                ),
              ],
            ),
            Text(item.mission.description),
            const SizedBox(height: 10),
            ProgressBar(value: progress),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${item.progress.currentValue}/${item.progress.targetValue}',
                ),
                FilledButton.tonal(
                  onPressed:
                      item.progress.isCompleted &&
                          !item.progress.rewardClaimed &&
                          item.progress.id.isNotEmpty
                      ? onClaim
                      : null,
                  child: Text(
                    item.progress.rewardClaimed
                        ? 'Đã nhận'
                        : '+${item.mission.rewardXp} XP',
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
