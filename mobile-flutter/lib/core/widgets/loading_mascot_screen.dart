import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../constants/mascot_reaction.dart';
import '../theme/app_text_styles.dart';
import 'mascot_image.dart';

class LoadingMascotScreen extends StatelessWidget {
  const LoadingMascotScreen({
    super.key,
    this.message = 'Đang chuẩn bị bài học...',
  });

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Mascot with entrance animation
          Animate(
            effects: [
              FadeEffect(duration: 400.ms),
              ScaleEffect(
                begin: const Offset(0.85, 0.85),
                end: const Offset(1.0, 1.0),
                duration: 700.ms,
                curve: Curves.elasticOut,
              ),
            ],
            child: MascotImage(
              reaction: MascotReaction.letsStart,
              width: 130,
              height: 130,
              animate: false,
            ),
          ),
          const SizedBox(height: 16),
          // Message with delayed fade
          Animate(
            effects: [FadeEffect(delay: 300.ms, duration: 300.ms)],
            child: Text(
              message,
              style: AppTextStyles.subtitle,
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }
}
