import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

class RewardBadge extends StatelessWidget {
  const RewardBadge({super.key, required this.label, required this.icon});
  final String label;
  final IconData icon;

  @override
  Widget build(BuildContext context) => Column(
    mainAxisSize: MainAxisSize.min,
    children: [
      CircleAvatar(
        radius: 30,
        backgroundColor: AppColors.yellow,
        child: Icon(icon, color: AppColors.text, size: 30),
      ),
      const SizedBox(height: 6),
      Text(
        label,
        textAlign: TextAlign.center,
        style: const TextStyle(fontWeight: FontWeight.w900),
      ),
    ],
  );
}
