import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/widgets/app_image.dart';
import '../../../models/npc.dart';

class MascotMessageBubble extends StatelessWidget {
  const MascotMessageBubble({
    super.key,
    required this.message,
    this.npc,
    this.icon = Icons.auto_awesome_rounded,
  });

  final String message;
  final NPC? npc;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        _MascotAvatar(npc: npc, icon: icon),
        const SizedBox(width: 10),
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(
                AppRadius.lg,
              ).copyWith(bottomLeft: const Radius.circular(6)),
              border: Border.all(color: AppColors.border),
            ),
            child: Text(message, style: AppTextStyles.subtitle),
          ),
        ),
      ],
    );
  }
}

class _MascotAvatar extends StatelessWidget {
  const _MascotAvatar({required this.npc, required this.icon});
  final NPC? npc;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final imageUrl = npc?.imageUrl ?? '';
    return CircleAvatar(
      radius: 31,
      backgroundColor: AppColors.yellow,
      child: ClipOval(
        child: imageUrl.isEmpty
            ? Icon(icon, size: 34, color: AppColors.text)
            : AppImage(
                imageUrl: imageUrl,
                width: 62,
                height: 62,
                fit: BoxFit.cover,
                placeholderIcon: icon,
              ),
      ),
    );
  }
}
