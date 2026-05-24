import 'package:flutter/material.dart';

import '../../../core/services/sound_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';

enum AnswerOptionState { normal, selected, correct, wrong, disabled }

class AnswerOptionCard extends StatefulWidget {
  const AnswerOptionCard({
    super.key,
    required this.label,
    required this.text,
    required this.onTap,
    this.state = AnswerOptionState.normal,
    this.icon,
  });

  final String label;
  final String text;
  final VoidCallback? onTap;
  final AnswerOptionState state;
  final IconData? icon;

  @override
  State<AnswerOptionCard> createState() => _AnswerOptionCardState();
}

class _AnswerOptionCardState extends State<AnswerOptionCard> {
  bool pressed = false;

  @override
  Widget build(BuildContext context) {
    final color = switch (widget.state) {
      AnswerOptionState.selected => AppColors.sky,
      AnswerOptionState.correct => AppColors.success,
      AnswerOptionState.wrong => AppColors.coral,
      AnswerOptionState.disabled => AppColors.border,
      AnswerOptionState.normal => AppColors.border,
    };
    final fill = switch (widget.state) {
      AnswerOptionState.selected => AppColors.sky.withValues(alpha: .12),
      AnswerOptionState.correct => AppColors.success.withValues(alpha: .14),
      AnswerOptionState.wrong => AppColors.coral.withValues(alpha: .12),
      AnswerOptionState.disabled => const Color(0xFFF3F4F6),
      AnswerOptionState.normal => Colors.white,
    };
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: AnimatedScale(
        duration: const Duration(milliseconds: 90),
        scale: pressed ? .98 : 1,
        child: InkWell(
          borderRadius: BorderRadius.circular(AppRadius.md),
          onTap: widget.onTap == null
              ? null
              : () {
                  SoundService.instance.play('ui-choice');
                  widget.onTap?.call();
                },
          onTapDown: widget.onTap == null
              ? null
              : (_) => setState(() => pressed = true),
          onTapCancel: widget.onTap == null
              ? null
              : () => setState(() => pressed = false),
          onTapUp: widget.onTap == null
              ? null
              : (_) => setState(() => pressed = false),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 160),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: fill,
              borderRadius: BorderRadius.circular(AppRadius.md),
              border: Border.all(color: color, width: 2),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 22,
                  backgroundColor: color == AppColors.border
                      ? AppColors.sky
                      : color,
                  child: Icon(
                    widget.icon ?? _icon(),
                    color: Colors.white,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    widget.text.isEmpty ? widget.label : widget.text,
                    style: const TextStyle(
                      color: AppColors.text,
                      fontSize: 17,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  IconData _icon() => switch (widget.state) {
    AnswerOptionState.correct => Icons.check_rounded,
    AnswerOptionState.wrong => Icons.refresh_rounded,
    AnswerOptionState.disabled => Icons.lock_rounded,
    _ => Icons.touch_app_rounded,
  };
}
