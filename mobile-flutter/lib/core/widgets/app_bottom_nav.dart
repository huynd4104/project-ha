import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../theme/app_colors.dart';

class AppBottomNav extends StatelessWidget {
  const AppBottomNav({super.key, required this.selectedIndex});

  final int selectedIndex;

  @override
  Widget build(BuildContext context) {
    return NavigationBar(
      selectedIndex: selectedIndex,
      indicatorColor: AppColors.primary.withValues(alpha: .16),
      onDestinationSelected: (index) {
        final paths = ['/home', '/learning', '/scan', '/rewards', '/parent'];
        context.go(paths[index]);
      },
      destinations: const [
        NavigationDestination(icon: Icon(Icons.home_rounded), label: 'Home'),
        NavigationDestination(
          icon: Icon(Icons.route_rounded),
          label: 'Lộ trình',
        ),
        NavigationDestination(
          icon: Icon(Icons.qr_code_scanner_rounded),
          label: 'Quét QR',
        ),
        NavigationDestination(
          icon: Icon(Icons.emoji_events_rounded),
          label: 'Thưởng',
        ),
        NavigationDestination(
          icon: Icon(Icons.dashboard_rounded),
          label: 'Phụ huynh',
        ),
      ],
    );
  }
}
