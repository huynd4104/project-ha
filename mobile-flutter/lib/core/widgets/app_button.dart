import 'package:flutter/material.dart';

import '../services/sound_service.dart';
import '../theme/app_colors.dart';
import '../theme/app_radius.dart';
import '../theme/app_shadows.dart';

enum AppButtonVariant { primary, secondary, reward, danger, ghost }

class AppButton extends StatefulWidget {
  const AppButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.variant = AppButtonVariant.primary,
    this.backgroundColor,
    this.foregroundColor,
    this.loading = false,
    this.fullWidth = true,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final AppButtonVariant variant;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final bool loading;
  final bool fullWidth;

  @override
  State<AppButton> createState() => _AppButtonState();
}

class _AppButtonState extends State<AppButton> {
  bool pressed = false;

  @override
  Widget build(BuildContext context) {
    final enabled = widget.onPressed != null && !widget.loading;
    final colors = _colors();
    final bg = widget.backgroundColor ?? colors.$1;
    final fg = widget.foregroundColor ?? colors.$2;
    return AnimatedScale(
      duration: const Duration(milliseconds: 90),
      scale: pressed ? 0.98 : 1,
      child: GestureDetector(
        onTapDown: enabled ? (_) => setState(() => pressed = true) : null,
        onTapCancel: enabled ? () => setState(() => pressed = false) : null,
        onTapUp: enabled ? (_) => setState(() => pressed = false) : null,
        child: DecoratedBox(
          decoration: BoxDecoration(
            boxShadow: enabled && widget.variant != AppButtonVariant.ghost
                ? AppShadows.button
                : const [],
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
          child: FilledButton.icon(
            onPressed: !enabled
                ? null
                : () {
                    SoundService.instance.play('tap');
                    widget.onPressed?.call();
                  },
            icon: widget.loading
                ? SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2, color: fg),
                  )
                : Icon(widget.icon ?? Icons.arrow_forward_rounded),
            label: Text(widget.label, textAlign: TextAlign.center),
            style: FilledButton.styleFrom(
              minimumSize: Size(widget.fullWidth ? double.infinity : 0, 58),
              backgroundColor: bg,
              disabledBackgroundColor: AppColors.border,
              foregroundColor: fg,
              disabledForegroundColor: AppColors.muted,
              textStyle: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w900,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
            ),
          ),
        ),
      ),
    );
  }

  (Color, Color) _colors() => switch (widget.variant) {
    AppButtonVariant.primary => (AppColors.primary, Colors.white),
    AppButtonVariant.secondary => (AppColors.sky, Colors.white),
    AppButtonVariant.reward => (AppColors.yellow, AppColors.text),
    AppButtonVariant.danger => (AppColors.coral, Colors.white),
    AppButtonVariant.ghost => (Colors.white, AppColors.text),
  };
}
