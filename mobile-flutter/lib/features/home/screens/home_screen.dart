import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../models/models.dart';
import '../../../core/config/app_config.dart';
import '../../../core/services/app_state.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/app_icon_button.dart';
import '../../../core/widgets/app_image.dart';
import '../../../core/widgets/progress_bar.dart';
import '../../gamification/data/gamification_repository.dart';
import '../../gamification/widgets/daily_mission_card.dart';
import '../../learning_path/data/lesson_repository.dart';
import '../../lessons/widgets/mascot_message_bubble.dart';
import '../../../core/utils/access_check.dart';
import '../../../core/utils/parent_gate.dart';
import '../../parent_dashboard/screens/paywall_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final child = state.activeChild;
    final level = state.levelStats;
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: state.refresh,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(18, 56, 18, 24),
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Hãy cùng cố gắng nào!',
                        style: AppTextStyles.headline,
                      ),
                      if (child == null) ...[
                        const SizedBox(height: 4),
                        Text(
                          state.appUser?.fullName ?? 'Phụ huynh',
                          style: AppTextStyles.muted.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                AppIconButton(
                  icon: Icons.settings_rounded,
                  tooltip: 'Cài đặt',
                  onPressed: () => context.push('/profile'),
                ),
              ],
            ),
            if (!state.emailVerified && !AppConfig.requireEmailVerification)
              Padding(
                padding: const EdgeInsets.only(top: 10),
                child: AppCard(
                  color: const Color(0xFFFFFBEB),
                  onTap: () => context.push('/verify-email'),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.warning_amber_rounded,
                        color: AppColors.orange,
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Text(
                          'Email chưa xác thực. Nhấn vào đây để xác thực ngay.',
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            color: Color(0xFFB45309),
                          ),
                        ),
                      ),
                      const Icon(
                        Icons.chevron_right_rounded,
                        color: AppColors.orange,
                      ),
                    ],
                  ),
                ),
              ),
            const SizedBox(height: 14),
            AppCard(
              color: AppColors.cream,
              borderColor: AppColors.primary.withValues(alpha: .25),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 38,
                        backgroundColor: AppColors.yellow,
                        child: child?.avatarUrl != null && child!.avatarUrl!.isNotEmpty
                            ? ClipOval(
                                child: AppImage(
                                  imageUrl: child.avatarUrl!,
                                  width: 76,
                                  height: 76,
                                  fit: BoxFit.cover,
                                ),
                              )
                            : (state.activeNpc != null
                                ? ClipOval(
                                    child: AppImage(
                                      imageUrl: state.activeNpc!.imageUrl,
                                      width: 76,
                                      height: 76,
                                      fit: BoxFit.cover,
                                    ),
                                  )
                                : const Icon(
                                    Icons.auto_awesome_rounded,
                                    color: AppColors.text,
                                    size: 40,
                                  )),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              child?.name ?? 'Bé yêu',
                              style: AppTextStyles.title,
                            ),
                            Text(
                              'Level ${level.level} • ${level.totalXp} XP',
                              style: AppTextStyles.muted.copyWith(
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                      ),
                      _Pill(
                        icon: Icons.local_fire_department_rounded,
                        label: '${state.streak?.currentStreak ?? 0} ngày',
                        color: AppColors.orange,
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  ProgressBar(value: level.xpInLevel / level.xpToNextLevel),
                  const SizedBox(height: 8),
                  Text(
                    '${level.xpInLevel}/${level.xpToNextLevel} XP để lên level tiếp theo',
                    style: AppTextStyles.caption.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            ).animate().fadeIn().slideY(begin: .08),
            const SizedBox(height: 14),
            MascotMessageBubble(
              npc: state.activeNpc,
              message: state.activeNpc != null
                  ? (state.activeNpc!.dialogueTemplates.welcome.isNotEmpty
                        ? state.activeNpc!.dialogueTemplates.welcome
                        : (state.activeNpc!.defaultDialogue.isNotEmpty
                              ? state.activeNpc!.defaultDialogue
                              : 'Hôm nay mình cùng học nhé!'))
                  : 'Bé chưa có bạn đồng hành nào. Hãy quét mã QR trên đồ chơi để mở khóa bạn nhỏ nhé!',
            ).animate().fadeIn().slideY(begin: .08),
            const SizedBox(height: 14),
            FutureBuilder<({LearningPlan plan, List<UserProgress> progress})>(
              future: child == null
                  ? null
                  : Future.wait([
                      LessonRepository().currentLearningPlan(
                        state.appUser!.id,
                        child.id,
                      ),
                      LessonRepository().progress(state.appUser!.id, child.id),
                    ]).then(
                      (res) => (
                        plan: res[0] as LearningPlan,
                        progress: res[1] as List<UserProgress>,
                      ),
                    ),
              builder: (_, pathSnap) {
                if (child == null) return const SizedBox.shrink();
                if (!pathSnap.hasData) {
                  return const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24.0),
                    child: Center(child: CircularProgressIndicator()),
                  );
                }
                final value = pathSnap.data!;
                final plan = value.plan;
                final List<UserProgress> progressList = List<UserProgress>.from(
                  value.progress,
                );

                // Nếu chưa chọn lộ trình
                if (child.currentPathId == null ||
                    child.currentPathId!.isEmpty) {
                  return AppCard(
                    borderColor: AppColors.orange.withOpacity(.25),
                    color: const Color(0xFFFDF8F6),
                    onTap: () => context.push('/path-selection'),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const CircleAvatar(
                              backgroundColor: AppColors.orange,
                              child: Icon(
                                Icons.explore_outlined,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Đề xuất lộ trình học',
                                    style: AppTextStyles.title,
                                  ),
                                  const SizedBox(height: 2),
                                  const Text(
                                    'Bé chưa chọn lộ trình học phù hợp.',
                                    style: TextStyle(
                                      color: Colors.grey,
                                      fontSize: 13,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'Nhấn vào đây để khám phá các lộ trình học phù hợp nhất cho bé!',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF9A3412),
                          ),
                        ),
                        const SizedBox(height: 12),
                        AppButton(
                          label: 'Khám phá ngay',
                          icon: Icons.chevron_right_rounded,
                          backgroundColor: AppColors.orange,
                          onPressed: () => context.push('/path-selection'),
                        ),
                      ],
                    ),
                  );
                }

                // Nếu đã chọn lộ trình, tìm bài học tiếp theo chưa hoàn thành
                final completedLessonIds = progressList
                    .where((p) => p.status == 'COMPLETED')
                    .map((p) => p.lessonId)
                    .toSet();

                Lesson? nextLesson;
                for (final lesson in plan.lessons) {
                  if (!completedLessonIds.contains(lesson.id)) {
                    nextLesson = lesson;
                    break;
                  }
                }

                final pathName = plan.title;
                final isCompletedAll =
                    nextLesson == null && plan.lessons.isNotEmpty;

                return AppCard(
                  borderColor: AppColors.sky.withOpacity(.25),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const CircleAvatar(
                            backgroundColor: AppColors.sky,
                            child: Icon(
                              Icons.play_arrow_rounded,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Hoạt động hôm nay',
                                  style: AppTextStyles.title,
                                ),
                                const SizedBox(height: 2),
                                Text(pathName, style: AppTextStyles.muted),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      if (isCompletedAll) ...[
                        const Text(
                          'Bé đã hoàn thành xuất sắc tất cả bài học trong lộ trình này! 🎉',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF10B981),
                          ),
                        ),
                        const SizedBox(height: 12),
                        AppButton(
                          label: 'Chọn lộ trình mới',
                          icon: Icons.explore_rounded,
                          onPressed: () => context.push('/path-selection'),
                        ),
                      ] else if (nextLesson != null) ...[
                        Text(
                          'Bài tiếp theo: ${nextLesson.title}',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          nextLesson.description,
                          style: AppTextStyles.caption.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 14),
                        AppButton(
                          label: 'Bắt đầu học',
                          icon: Icons.play_arrow_rounded,
                          onPressed: () {
                            final hasAccess = AccessCheck.canAccessContent(
                              accessType: nextLesson!.accessType,
                              summary: state.appUser?.subscriptionSummary,
                            );
                            if (!hasAccess) {
                              showDialog(
                                context: context,
                                builder: (context) => AlertDialog(
                                  title: const Text('✨ Bài học Premium'),
                                  content: const Text(
                                    'Bài học này cần tài khoản Premium để truy cập. Bé hãy nhờ bố mẹ mở khóa giúp nhé!',
                                  ),
                                  actions: [
                                    TextButton(
                                      onPressed: () =>
                                          Navigator.of(context).pop(),
                                      child: const Text(
                                        'Để sau',
                                        style: TextStyle(color: Colors.grey),
                                      ),
                                    ),
                                    TextButton(
                                      onPressed: () {
                                        Navigator.of(context).pop();
                                        ParentGate.show(context, () {
                                          Navigator.of(context).push(
                                            MaterialPageRoute(
                                              builder: (context) =>
                                                  const PaywallScreen(),
                                            ),
                                          );
                                        });
                                      },
                                      child: const Text(
                                        'Dành cho Bố Mẹ',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            } else {
                              context.push('/lesson/${nextLesson.id}/activity');
                            }
                          },
                        ),
                      ] else ...[
                        const Text(
                          'Chưa có bài học nào trong lộ trình.',
                          style: TextStyle(color: Colors.grey),
                        ),
                        const SizedBox(height: 12),
                        AppButton(
                          label: 'Chọn lộ trình khác',
                          icon: Icons.explore_rounded,
                          onPressed: () => context.push('/path-selection'),
                        ),
                      ],
                    ],
                  ),
                );
              },
            ),
            if (child != null &&
                (child.secondaryDifficulties.isEmpty ||
                    child.interests.isEmpty ||
                    child.learningGoals.isEmpty))
              Padding(
                padding: const EdgeInsets.only(top: 14),
                child: AppCard(
                  color: const Color(0xFFF0FDF4),
                  borderColor: const Color(0xFFBBF7D0),
                  onTap: () => context.push('/child-profile'),
                  child: Row(
                    children: [
                      const CircleAvatar(
                        backgroundColor: Color(0xFFDCFCE7),
                        child: Icon(
                          Icons.edit_note_rounded,
                          color: Color(0xFF10B981),
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Hoàn thiện hồ sơ',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF166534),
                                fontSize: 16,
                              ),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Cập nhật sở thích & khó khăn của trẻ để nhận gợi ý lộ trình tối ưu hơn.',
                              style: TextStyle(
                                fontSize: 12,
                                color: Color(0xFF1E293B),
                              ),
                            ),
                          ],
                        ),
                      ),
                      Icon(
                        Icons.chevron_right_rounded,
                        color: Colors.grey[600],
                      ),
                    ],
                  ),
                ),
              ),
            const SizedBox(height: 14),
            FutureBuilder(
              future: (state.appUser == null || state.activeChild == null)
                  ? null
                  : GamificationRepository().dailyMissions(
                      state.appUser!.id,
                      state.activeChild!.id,
                    ),
              builder: (_, snap) {
                if (!snap.hasData || snap.data!.isEmpty) {
                  return const SizedBox.shrink();
                }
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Nhiệm vụ hôm nay', style: AppTextStyles.title),
                        TextButton(
                          onPressed: () => context.go('/rewards'),
                          child: const Text('Xem thưởng'),
                        ),
                      ],
                    ),
                    for (final mission in snap.data!.take(2))
                      DailyMissionCard(
                        item: mission,
                        onClaim: () => context.go('/rewards'),
                      ),
                  ],
                );
              },
            ),
            const SizedBox(height: 6),
            Text('Đi nhanh', style: AppTextStyles.title),
            const SizedBox(height: 10),
            _ActionCard(
              title: 'Hội thoại cùng AI',
              subtitle: 'Chọn chủ đề và luyện nói 3 phút',
              icon: Icons.record_voice_over_rounded,
              color: AppColors.teal,
              onTap: () => context.push('/ai-conversations/topics'),
            ),
            _ActionCard(
              title: 'Lộ trình học',
              subtitle: 'Xem bản đồ bài học',
              icon: Icons.route_rounded,
              color: AppColors.sky,
              onTap: () => context.go('/learning'),
            ),
            _ActionCard(
              title: 'Đổi lộ trình học',
              subtitle: 'Chọn lộ trình phù hợp cho bé',
              icon: Icons.explore_rounded,
              color: AppColors.orange,
              onTap: () => context.push('/path-selection'),
            ),
            _ActionCard(
              title: 'Quét QR',
              subtitle: 'Mở khóa bạn đồng hành',
              icon: Icons.qr_code_scanner_rounded,
              color: AppColors.primary,
              onTap: () => context.go('/scan'),
            ),
            _ActionCard(
              title: 'Bộ sưu tập Mascot',
              subtitle: 'Xem các bạn đã mở khóa',
              icon: Icons.auto_awesome_rounded,
              color: AppColors.pink,
              onTap: () => context.push('/npcs'),
            ),
            _ActionCard(
              title: 'Phụ huynh',
              subtitle: 'Xem tiến bộ và gợi ý tại nhà',
              icon: Icons.dashboard_rounded,
              color: AppColors.primary,
              onTap: () => context.go('/parent'),
            ),
          ],
        ),
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({required this.icon, required this.label, required this.color});
  final IconData icon;
  final String label;
  final Color color;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
    decoration: BoxDecoration(
      color: color.withValues(alpha: .16),
      borderRadius: BorderRadius.circular(99),
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: color),
        const SizedBox(width: 6),
        Text(label, style: const TextStyle(fontWeight: FontWeight.w900)),
      ],
    ),
  );
}

class _ActionCard extends StatelessWidget {
  const _ActionCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.onTap,
  });
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: AppCard(
      onTap: onTap,
      child: Row(
        children: [
          CircleAvatar(
            radius: 28,
            backgroundColor: color.withValues(alpha: .16),
            child: Icon(icon, color: color),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 18,
                  ),
                ),
                Text(subtitle, style: const TextStyle(color: AppColors.muted)),
              ],
            ),
          ),
          const Icon(Icons.chevron_right_rounded),
        ],
      ),
    ),
  );
}
