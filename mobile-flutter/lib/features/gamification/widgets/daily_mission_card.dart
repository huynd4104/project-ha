import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

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
    final isCompleted = item.progress.isCompleted ||
        (item.progress.currentValue >= item.progress.targetValue);
    final isCompletedUnclaimed = isCompleted &&
        !item.progress.rewardClaimed;

    Widget card = AppCard(
      onTap: isCompletedUnclaimed ? onClaim : null,
      color: isCompletedUnclaimed ? const Color(0xFFFFFBEB) : AppColors.surface,
      borderColor: isCompletedUnclaimed ? AppColors.yellow : AppColors.border,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                backgroundColor: isCompletedUnclaimed ? AppColors.yellow : AppColors.teal,
                child: Icon(
                  isCompletedUnclaimed ? Icons.auto_awesome_rounded : Icons.flag_rounded,
                  color: isCompletedUnclaimed ? AppColors.text : Colors.white,
                ),
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
          const SizedBox(height: 4),
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
                onPressed: isCompletedUnclaimed ? onClaim : null,
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
    );

    if (isCompletedUnclaimed) {
      card = card
          .animate(onPlay: (controller) => controller.repeat(reverse: true))
          .shimmer(
            duration: const Duration(seconds: 2),
            color: Colors.white.withOpacity(0.55),
          )
          .scale(
            begin: const Offset(1, 1),
            end: const Offset(1.02, 1.02),
            duration: const Duration(milliseconds: 1200),
            curve: Curves.easeInOut,
          );
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: card,
    );
  }
}
