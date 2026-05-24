import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/progress_bar.dart';
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
      appBar: AppBar(
        title: Text(unlockMode ? 'Mở khóa thành công' : 'Kết quả'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          AppCard(
            color: unlockMode ? AppColors.purple : AppColors.primary,
            child: Column(
              children: [
                Icon(
                  unlockMode
                      ? Icons.auto_awesome_rounded
                      : Icons.emoji_events_rounded,
                  size: 72,
                  color: Colors.white,
                ),
                const SizedBox(height: 10),
                Text(
                  unlock?.message ?? 'Hoàn thành bài học',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
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
                if (lesson != null)
                  Text(
                    'Điểm: ${lesson.score}%',
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                Text(
                  '+${lesson?.xpGained ?? unlock?.xpGained ?? 0} XP',
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    color: AppColors.primary,
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
                  'Streak: ${lesson?.streak.currentStreak ?? unlock?.streak?.currentStreak ?? 0} ngày',
                ),
                Text(
                  'Badge mới: ${(lesson?.newBadges.length ?? unlock?.newBadges.length ?? 0)}',
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          AppButton(
            label: 'Tiếp tục học',
            icon: Icons.route_rounded,
            onPressed: () => context.go('/learning'),
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
