import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/constants/mascot_assets.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/mascot_image.dart';
import 'number_counting_screen.dart';
import 'number_recognition_screen.dart';
import 'pecs_selection_screen.dart';
import 'shape_intro_screen.dart';
import 'shape_recognition_screen.dart';

class TechnologySelectionScreen extends StatelessWidget {
  const TechnologySelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        leadingWidth: 56,
        leading: BackButton(
          color: AppColors.text,
          onPressed: () {
            if (Navigator.of(context).canPop()) {
              Navigator.of(context).pop();
            } else {
              context.go('/home');
            }
          },
        ),
        title: const Text('Công nghệ học tập'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.transparent,
        foregroundColor: AppColors.text,
        surfaceTintColor: Colors.transparent,
      ),
      body: SafeArea(
        child: ListView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(18, 12, 18, 28),
          children: [
            _buildHeroCard(),
            const SizedBox(height: 20),
            
            Padding(
              padding: const EdgeInsets.only(top: 8, bottom: 10),
              child: Text('Bộ số', style: AppTextStyles.title),
            ),
            _ActionCard(
              title: 'Nhận diện số',
              subtitle: 'Làm quen với các con số',
              icon: Icons.grid_view_rounded,
              color: AppColors.orange,
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const NumberRecognitionScreen()),
              ),
            ),
            _ActionCard(
              title: 'Tập đếm số',
              subtitle: 'Đếm vật thể bằng thẻ NFC',
              icon: Icons.calculate_rounded,
              color: AppColors.orange,
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const NumberCountingScreen()),
              ),
            ),
            
            const SizedBox(height: 10),
            Padding(
              padding: const EdgeInsets.only(top: 8, bottom: 10),
              child: Text('Bộ hình', style: AppTextStyles.title),
            ),
            _ActionCard(
              title: 'Giới thiệu hình',
              subtitle: 'Khám phá các hình khối',
              icon: Icons.auto_awesome_mosaic_rounded,
              color: AppColors.sky,
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ShapeIntroScreen()),
              ),
            ),
            _ActionCard(
              title: 'Nhận diện hình',
              subtitle: 'Thử thách tìm hình bằng thẻ NFC',
              icon: Icons.search_rounded,
              color: AppColors.sky,
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ShapeRecognitionScreen()),
              ),
            ),
            
            const SizedBox(height: 10),
            Padding(
              padding: const EdgeInsets.only(top: 8, bottom: 10),
              child: Text('PECS - Giao tiếp hình ảnh', style: AppTextStyles.title),
            ),
            _ActionCard(
              title: 'Giao tiếp PECS',
              subtitle: 'Giao tiếp bằng cách chạm thẻ hình ảnh',
              icon: Icons.chat_bubble_rounded,
              color: AppColors.teal,
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const PecsSelectionScreen()),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeroCard() {
    return AppCard(
      color: AppColors.cream,
      borderColor: AppColors.primary.withValues(alpha: .25),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(
            width: 72,
            height: 72,
            child: MascotImage(
              assetPath: MascotAssets.mascotMain,
              fit: BoxFit.contain,
              animate: false,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Chọn hoạt động học tập',
                  style: AppTextStyles.title,
                ),
                const SizedBox(height: 4),
                Text(
                  'Chạm vào một chủ đề dưới đây để bắt đầu học tập cùng các thẻ NFC!',
                  style: AppTextStyles.muted,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
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
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: AppCard(
        onTap: onTap,
        child: Row(
          children: [
            CircleAvatar(
              radius: 28,
              backgroundColor: color.withValues(alpha: .16),
              child: Icon(icon, color: color, size: 26),
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
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(color: AppColors.muted),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
          ],
        ),
      ),
    );
  }
}
