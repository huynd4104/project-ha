import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

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
import '../../lessons/widgets/mascot_message_bubble.dart';

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
                      const Text(
                        'Hôm nay mình cùng học nhé!',
                        style: AppTextStyles.headline,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        child == null
                            ? (state.appUser?.fullName ?? 'Phụ huynh')
                            : '${child.name} • ${child.age} tuổi',
                        style: AppTextStyles.muted.copyWith(
                           fontWeight: FontWeight.w800,
                        ),
                      ),
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
                        child: state.activeNpc != null
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
                              ),
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
                  ? (state.activeNpc!.defaultDialogue.isNotEmpty
                      ? state.activeNpc!.defaultDialogue
                      : 'Hôm nay mình cùng học nhé!')
                  : 'Bé chưa có bạn đồng hành nào. Hãy quét mã QR trên đồ chơi để mở khóa bạn nhỏ nhé!',
            ).animate().fadeIn().slideY(begin: .08),
            const SizedBox(height: 14),
            AppCard(
              borderColor: AppColors.sky.withValues(alpha: .25),
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
                          children: const [
                            Text(
                              'Hoạt động hôm nay',
                              style: AppTextStyles.title,
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Bài ngắn • khoảng 3 phút',
                              style: AppTextStyles.muted,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  const Text(
                    'Tiếp tục lộ trình học của bé',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
                  ),
                  const SizedBox(height: 14),
                  AppButton(
                    label: 'Bắt đầu',
                    icon: Icons.play_arrow_rounded,
                    onPressed: () => context.go('/learning'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            FutureBuilder(
              future: GamificationRepository().dailyMissions(
                state.firebaseUser!.uid,
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
                        const Text(
                          'Nhiệm vụ hôm nay',
                          style: AppTextStyles.title,
                        ),
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
            const Text('Đi nhanh', style: AppTextStyles.title),
            const SizedBox(height: 10),
            _ActionCard(
              title: 'Lộ trình',
              subtitle: 'Xem bản đồ bài học',
              icon: Icons.route_rounded,
              color: AppColors.sky,
              onTap: () => context.go('/learning'),
            ),
            _ActionCard(
              title: 'Quét QR',
              subtitle: 'Mở khóa bạn đồng hành',
              icon: Icons.qr_code_scanner_rounded,
              color: AppColors.purple,
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
              color: AppColors.teal,
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
