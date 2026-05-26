import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../services/sound_service.dart';
import '../theme/app_colors.dart';

class AppBottomNav extends StatelessWidget {
  const AppBottomNav({super.key, required this.selectedIndex});

  final int selectedIndex;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        height: 76,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: AppColors.border, width: 2),
          boxShadow: [
            BoxShadow(
              color: AppColors.text.withValues(alpha: 0.06),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: List.generate(5, (index) => _buildNavItem(context, index)),
        ),
      ),
    );
  }

  Widget _buildNavItem(BuildContext context, int index) {
    final isActive = selectedIndex == index;
    final info = _getTabInfo(index);
    final color = info.color;

    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () {
          if (!isActive) {
            SoundService.instance.play('tap');
            final paths = [
              '/home',
              '/learning',
              '/ai-conversations/topics',
              '/rewards',
              '/parent',
            ];
            context.go(paths[index]);
          }
        },
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              curve: Curves.easeOutBack,
              transform: Matrix4.translationValues(0.0, isActive ? -4.0 : 0.0, 0.0),
              child: AnimatedScale(
                scale: isActive ? 1.15 : 1.0,
                duration: const Duration(milliseconds: 250),
                curve: Curves.easeOutBack,
                child: Icon(
                  info.icon,
                  color: isActive ? color : AppColors.muted,
                  size: 26,
                ),
              ),
            ),
            const SizedBox(height: 2),
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: isActive ? 12 : 0,
              height: 3,
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(1.5),
              ),
            ),
            const SizedBox(height: 2),
            AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 200),
              style: GoogleFonts.nunito(
                fontSize: 11,
                fontWeight: isActive ? FontWeight.w900 : FontWeight.w700,
                color: isActive ? color : AppColors.muted,
              ),
              child: Text(info.label),
            ),
          ],
        ),
      ),
    );
  }

  _TabInfo _getTabInfo(int index) {
    switch (index) {
      case 0:
        return const _TabInfo(
          label: 'Home',
          icon: Icons.home_rounded,
          color: AppColors.primary,
        );
      case 1:
        return const _TabInfo(
          label: 'Lộ trình',
          icon: Icons.route_rounded,
          color: AppColors.sky,
        );
      case 2:
        return const _TabInfo(
          label: 'AI',
          icon: Icons.psychology_rounded,
          color: AppColors.teal,
        );
      case 3:
        return const _TabInfo(
          label: 'Thưởng',
          icon: Icons.emoji_events_rounded,
          color: AppColors.orange,
        );
      case 4:
      default:
        return const _TabInfo(
          label: 'Phụ huynh',
          icon: Icons.dashboard_rounded,
          color: AppColors.purple,
        );
    }
  }
}

class _TabInfo {
  final String label;
  final IconData icon;
  final Color color;

  const _TabInfo({
    required this.label,
    required this.icon,
    required this.color,
  });
}
