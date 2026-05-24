import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

class MicrophoneButton extends StatelessWidget {
  const MicrophoneButton({super.key, this.onPressed, this.active = false});
  final VoidCallback? onPressed;
  final bool active;

  @override
  Widget build(BuildContext context) => InkWell(
    borderRadius: BorderRadius.circular(99),
    onTap: onPressed,
    child: Container(
      width: 112,
      height: 112,
      decoration: BoxDecoration(
        color: active ? AppColors.coral : AppColors.sky,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: (active ? AppColors.coral : AppColors.sky).withValues(
              alpha: .25,
            ),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: const Icon(Icons.mic_rounded, color: Colors.white, size: 48),
    ),
  );
}
