import 'package:flutter/material.dart';

import '../services/sound_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_radius.dart';

class AppIconButton extends StatelessWidget {
  const AppIconButton({
    super.key,
    required this.icon,
    required this.tooltip,
    required this.onPressed,
    this.color = Colors.white,
    this.foregroundColor = AppColors.text,
  });

  final IconData icon;
  final String tooltip;
  final VoidCallback? onPressed;
  final Color color;
  final Color foregroundColor;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: InkWell(
        borderRadius: BorderRadius.circular(AppRadius.md),
        onTap: onPressed == null
            ? null
            : () {
                SoundService.instance.play('tap');
                onPressed?.call();
              },
        child: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(AppRadius.md),
            border: Border.all(color: AppColors.border),
          ),
          child: Icon(icon, color: foregroundColor),
        ),
      ),
    );
  }
}
