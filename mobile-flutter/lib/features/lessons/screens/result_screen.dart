import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/progress_bar.dart';
import '../../gamification/widgets/reward_badge.dart';
import '../../learning_path/data/lesson_repository.dart';
import '../../qr_unlock/data/activation_repository.dart';

class ResultScreen extends StatelessWidget {
  const ResultScreen({super.key, this.extra, this.unlockMode = false});
  final Object? extra;
  final bool unlockMode;

  @override
  Widget build(BuildContext context) {
    final lesson = extra is LessonResult ? extra as LessonResult : null;
    final unlock = extra is UnlockResult ? extra as UnlockResult : null;
    return Scaffold(
      body: ListView(
        padding: const EdgeInsets.fromLTRB(24, 56, 24, 24),
        children: [
          AppCard(
            color: unlockMode ? AppColors.purple : AppColors.cream,
            borderColor: unlockMode ? AppColors.purple : AppColors.yellow,
            child: Column(
              children: [
                Icon(
                  unlockMode
                      ? Icons.auto_awesome_rounded
                      : Icons.emoji_events_rounded,
                  size: 72,
                  color: unlockMode ? Colors.white : AppColors.orange,
                ),
                const SizedBox(height: 10),
                Text(
                  unlockMode
                      ? (unlock?.message ?? 'Mở khóa thành công!')
                      : 'Hoàn thành bài học!',
                  textAlign: TextAlign.center,
                  style: AppTextStyles.headline.copyWith(
                    color: unlockMode ? Colors.white : AppColors.text,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  unlockMode
                      ? 'Bạn đã có thêm một bạn đồng hành mới.'
                      : 'Hôm nay con đã rất cố gắng!',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: unlockMode ? Colors.white : AppColors.muted,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                if (unlock != null)
                  Text(
                    unlock.npc.name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: 18,
                  runSpacing: 14,
                  alignment: WrapAlignment.spaceAround,
                  children: [
                    if (lesson != null)
                      RewardBadge(
                        label: '${lesson.score}% điểm',
                        icon: Icons.check_circle_rounded,
                      ),
                    RewardBadge(
                      label: '+${lesson?.xpGained ?? unlock?.xpGained ?? 0} XP',
                      icon: Icons.bolt_rounded,
                    ),
                    RewardBadge(
                      label:
                          '${lesson?.streak.currentStreak ?? unlock?.streak?.currentStreak ?? 0} ngày',
                      icon: Icons.local_fire_department_rounded,
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                if (lesson != null)
                  Text(
                    'Đúng ${lesson.correctAnswers}/${lesson.totalQuestions}',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                const SizedBox(height: 10),
                ProgressBar(
                  value:
                      ((lesson?.levelStats.xpInLevel ??
                          unlock?.levelStats?.xpInLevel ??
                          0) /
                      100),
                ),
                const SizedBox(height: 8),
                Text(
                  'Level ${lesson?.levelStats.level ?? unlock?.levelStats?.level ?? '-'}',
                ),
                Text(
                  'Badge mới: ${(lesson?.newBadges.length ?? unlock?.newBadges.length ?? 0)}',
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          AppButton(
            label: unlockMode ? 'Xem bộ sưu tập' : 'Tiếp tục',
            icon: unlockMode ? Icons.auto_awesome_rounded : Icons.route_rounded,
            onPressed: () => context.go(unlockMode ? '/npcs' : '/learning'),
          ),
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: () => context.go('/rewards'),
            icon: const Icon(Icons.emoji_events_rounded),
            label: const Text('Xem phần thưởng'),
          ),
          OutlinedButton.icon(
            onPressed: () => context.go('/home'),
            icon: const Icon(Icons.home_rounded),
            label: const Text('Về trang chủ'),
          ),
        ],
      ),
    );
  }
}
