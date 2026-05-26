import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/mascot_assets.dart';
import '../../../core/constants/mascot_reaction.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/mascot_image.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.sizeOf(context);
    final isSmall = size.height < 720;

    // Responsive mascot sizing
    final mascotWidth = size.width < 380
        ? 180.0
        : isSmall
            ? 200.0
            : 240.0;

    // Responsive mascot vertical position (% from top)
    final mascotTop = isSmall ? size.height * 0.05 : size.height * 0.08;

    // Build animated mascot separately to avoid parser ambiguity
    final animatedMascot = Animate(
      effects: [
        FadeEffect(duration: 500.ms),
        ScaleEffect(
          begin: const Offset(0.9, 0.9),
          end: const Offset(1.0, 1.0),
          duration: 600.ms,
          curve: Curves.easeOutBack,
        ),
      ],
      child: MascotImage(
        reaction: MascotReaction.welcome,
        width: mascotWidth,
        fit: BoxFit.contain,
        semanticLabel: 'Bạn đồng hành chào đón bé',
      ),
    );

    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          // ── Layer 1: Full-screen background ──────────────────────────
          Positioned.fill(
            child: Image.asset(
              MascotAssets.onboardingBackground,
              fit: BoxFit.cover,
              alignment: Alignment.topCenter,
              excludeFromSemantics: true,
              errorBuilder: (_, _, _) => const ColoredBox(
                color: Color(0xFFDCFCE7),
              ),
            ),
          ),

          // ── Layer 2: Gradient overlay — top clear, bottom opaque ─────
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  stops: const [0.0, 0.42, 0.65, 1.0],
                  colors: [
                    Colors.white.withValues(alpha: 0.04), // near-transparent
                    Colors.white.withValues(alpha: 0.28), // light veil
                    AppColors.cream.withValues(alpha: 0.88), // warm cream
                    AppColors.cream.withValues(alpha: 0.98), // near-opaque
                  ],
                ),
              ),
            ),
          ),

          // ── Layer 3: Mascot — transparent PNG floating in hero area ──
          Positioned(
            top: mascotTop,
            left: 0,
            right: 0,
            child: Center(child: animatedMascot),
          ),

          // ── Layer 4: Bottom content panel ────────────────────────────
          Align(
            alignment: Alignment.bottomCenter,
            child: SafeArea(
              top: false,
              child: SingleChildScrollView(
                padding: EdgeInsets.fromLTRB(22, 0, 22, isSmall ? 28 : 64),
                child: _BottomPanel(isSmall: isSmall),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _BottomPanel extends StatelessWidget {
  const _BottomPanel({required this.isSmall});

  final bool isSmall;

  // CTA: AppColors.teal (#19C7A6) — warm, matches mascot palette
  static const _ctaColor = AppColors.teal;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        20,
        isSmall ? 18 : 24,
        20,
        isSmall ? 16 : 20,
      ),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.88),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(
          color: AppColors.border.withValues(alpha: 0.6),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // ── Title ─────────────────────────────────────────────────────
          Text(
            'Chào mừng con đến\nvới hành trình học tập!',
            style: TextStyle(
              fontSize: isSmall ? 26 : 32,
              fontWeight: FontWeight.w900,
              color: AppColors.text,
              letterSpacing: -0.3,
              height: 1.28,
            ),
            textAlign: TextAlign.center,
          ).animate().fadeIn(delay: 80.ms),

          const SizedBox(height: 8),

          // ── Subtitle ──────────────────────────────────────────────────
          Text(
            'Mình cùng học từng bước nhỏ nhé.',
            style: TextStyle(
              fontSize: isSmall ? 16 : 18,
              fontWeight: FontWeight.w600,
              color: AppColors.muted,
            ),
            textAlign: TextAlign.center,
          ).animate().fadeIn(delay: 130.ms),

          SizedBox(height: isSmall ? 16 : 22),

          // ── Safety notice ─────────────────────────────────────────────
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFFFFFBEB),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: const Color(0xFFFDE68A),
                width: 1.5,
              ),
            ),
            child: const Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  Icons.info_outline_rounded,
                  size: 16,
                  color: Color(0xFFD97706),
                ),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Ứng dụng hỗ trợ phụ huynh đồng hành cùng trẻ tại nhà, không chẩn đoán, không điều trị và không thay thế chuyên gia.',
                    style: TextStyle(
                      fontSize: 13,
                      color: Color(0xFF92400E),
                      height: 1.5,
                    ),
                  ),
                ),
              ],
            ),
          ).animate().fadeIn(delay: 180.ms),

          SizedBox(height: isSmall ? 18 : 26),

          // ── Primary CTA ───────────────────────────────────────────────
          AppButton(
            label: 'Bắt đầu',
            icon: Icons.play_arrow_rounded,
            backgroundColor: _ctaColor,
            onPressed: () => context.go('/register'),
          ).animate().fadeIn(delay: 240.ms).slideY(
                begin: 0.06,
                delay: 240.ms,
                curve: Curves.easeOut,
              ),

          const SizedBox(height: 12),

          // ── Secondary: login ──────────────────────────────────────────
          OutlinedButton.icon(
            onPressed: () => context.go('/login'),
            icon: const Icon(Icons.login_rounded, size: 18),
            label: const Text('Đăng nhập'),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size.fromHeight(52),
              side: const BorderSide(color: AppColors.border, width: 1.5),
              foregroundColor: AppColors.text,
              textStyle: const TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 15,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              backgroundColor: Colors.white,
              elevation: 0,
            ),
          ).animate().fadeIn(delay: 290.ms),
        ],
      ),
    );
  }
}
