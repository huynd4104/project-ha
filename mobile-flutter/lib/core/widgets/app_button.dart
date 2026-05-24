import 'package:flutter/material.dart';

import '../services/sound_service.dart';
import '../theme/app_colors.dart';

class AppButton extends StatefulWidget {
  const AppButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.backgroundColor = AppColors.primary,
    this.foregroundColor = Colors.white,
    this.loading = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final Color backgroundColor;
  final Color foregroundColor;
  final bool loading;

  @override
  State<AppButton> createState() => _AppButtonState();
}

class _AppButtonState extends State<AppButton> {
  bool pressed = false;

  @override
  Widget build(BuildContext context) {
    return AnimatedScale(
      duration: const Duration(milliseconds: 90),
      scale: pressed ? 0.98 : 1,
      child: FilledButton.icon(
        onPressed: widget.loading || widget.onPressed == null
            ? null
            : () {
                SoundService.instance.play('tap');
                widget.onPressed?.call();
              },
        onHover: (_) {},
        onLongPress: null,
        icon: widget.loading
            ? SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: widget.foregroundColor,
                ),
              )
            : Icon(widget.icon ?? Icons.arrow_forward_rounded),
        label: Text(widget.label),
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(54),
          backgroundColor: widget.backgroundColor,
          foregroundColor: widget.foregroundColor,
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
        ),
      ),
    );
  }
}
