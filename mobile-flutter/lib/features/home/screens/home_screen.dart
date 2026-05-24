import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/config/app_config.dart';
import '../../../core/services/app_state.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_card.dart';
import '../../../core/widgets/progress_bar.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final child = state.activeChild;
    final level = state.levelStats;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Trang chủ'),
        actions: [
          IconButton(
            onPressed: () => context.push('/profile'),
            icon: const Icon(Icons.account_circle_rounded),
            tooltip: 'Tài khoản',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: state.refresh,
        child: ListView(
          padding: const EdgeInsets.all(18),
          children: [
            Text(
              'Xin chào ${state.appUser?.fullName ?? 'phụ huynh'}',
              style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w900),
            ),
            if (!state.emailVerified && !AppConfig.requireEmailVerification)
              const Padding(
                padding: EdgeInsets.only(top: 10),
                child: AppCard(
                  color: Color(0xFFFFFBEB),
                  child: Text(
                    'Email chưa xác thực. Demo vẫn cho phép vào app, nhưng nên xác thực để bảo vệ tài khoản.',
                    style: TextStyle(fontWeight: FontWeight.w800),
                  ),
                ),
              ),
            const SizedBox(height: 14),
            AppCard(
              color: AppColors.primary,
              child: Row(
                children: [
                  const CircleAvatar(
                    radius: 34,
                    backgroundColor: Colors.white,
                    child: Icon(
                      Icons.child_care_rounded,
                      color: AppColors.primary,
                      size: 38,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Text(
                      child == null
                          ? 'Chưa có hồ sơ bé'
                          : '${child.name}, ${child.age} tuổi',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                ],
              ),
            ).animate().fadeIn().slideY(begin: .08),
            const SizedBox(height: 14),
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Level ${level.level}',
                        style: const TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 20,
                        ),
                      ),
                      Text('${level.xpInLevel}/100 XP'),
                    ],
                  ),
                  const SizedBox(height: 10),
                  ProgressBar(value: level.xpInLevel / level.xpToNextLevel),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: [
                      _Pill(
                        icon: Icons.local_fire_department_rounded,
                        label:
                            '${state.streak?.currentStreak ?? 0} ngày streak',
                        color: AppColors.orange,
                      ),
                      _Pill(
                        icon: Icons.emoji_events_rounded,
                        label: 'Nhiệm vụ hôm nay',
                        color: AppColors.yellow,
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            _ActionCard(
              title: 'Tiếp tục lộ trình',
              subtitle: 'Học bài hiện tại trên bản đồ zigzag',
              icon: Icons.route_rounded,
              color: AppColors.sky,
              onTap: () => context.go('/learning'),
            ),
            _ActionCard(
              title: 'Quét mã mở khóa',
              subtitle: 'Scan QR hoặc nhập mã thủ công',
              icon: Icons.qr_code_scanner_rounded,
              color: AppColors.purple,
              onTap: () => context.go('/scan'),
            ),
            _ActionCard(
              title: 'Bộ sưu tập Mascot',
              subtitle: 'Xem các bạn đồng hành đã mở khóa',
              icon: Icons.auto_awesome_rounded,
              color: AppColors.pink,
              onTap: () => context.push('/npcs'),
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
