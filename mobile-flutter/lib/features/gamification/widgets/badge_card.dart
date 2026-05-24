import 'package:flutter/material.dart';

import '../../../models/badge.dart' as model;

class BadgeCard extends StatelessWidget {
  const BadgeCard({super.key, required this.badge});
  final model.Badge badge;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: badge.isEarned ? Colors.white : const Color(0xFFF3F4F6),
      borderRadius: BorderRadius.circular(18),
      border: Border.all(color: const Color(0xFFE5E7EB)),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(
          badge.isEarned ? Icons.workspace_premium_rounded : Icons.lock_rounded,
          size: 32,
        ),
        const SizedBox(height: 8),
        Text(badge.name, style: const TextStyle(fontWeight: FontWeight.w900)),
        Text(badge.description, maxLines: 2, overflow: TextOverflow.ellipsis),
      ],
    ),
  );
}
