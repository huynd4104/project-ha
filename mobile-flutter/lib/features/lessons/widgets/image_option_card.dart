import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_image.dart';
import 'answer_option_card.dart';

class ImageOptionCard extends StatelessWidget {
  const ImageOptionCard({
    super.key,
    required this.imageUrl,
    required this.label,
    required this.onTap,
    this.state = AnswerOptionState.normal,
  });

  final String imageUrl;
  final String label;
  final VoidCallback? onTap;
  final AnswerOptionState state;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: state == AnswerOptionState.selected
                ? AppColors.sky
                : AppColors.border,
            width: 2,
          ),
        ),
        child: Column(
          children: [
            Expanded(
              child: imageUrl.isEmpty
                  ? const Icon(
                      Icons.image_rounded,
                      size: 54,
                      color: AppColors.sky,
                    )
                  : AppImage(imageUrl: imageUrl, fit: BoxFit.contain),
            ),
            const SizedBox(height: 8),
            Text(label, style: const TextStyle(fontWeight: FontWeight.w900)),
          ],
        ),
      ),
    );
  }
}
