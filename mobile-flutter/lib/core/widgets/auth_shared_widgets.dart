import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

/// A small chip-style back button for auth screens.
class AuthBackChip extends StatelessWidget {
  const AuthBackChip({super.key, required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.arrow_back_ios_new_rounded, size: 14, color: AppColors.text),
            SizedBox(width: 4),
            Text(
              'Quay lại',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.text,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// An inline text link with optional highlighted portion and hover underline.
class AuthTextLink extends StatefulWidget {
  const AuthTextLink({
    super.key,
    required this.label,
    this.highlight,
    required this.onTap,
  });
  final String label;
  final String? highlight;
  final VoidCallback onTap;

  @override
  State<AuthTextLink> createState() => _AuthTextLinkState();
}

class _AuthTextLinkState extends State<AuthTextLink> {
  bool _hover = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() => _hover = true),
      onExit: (_) => setState(() => _hover = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: RichText(
          text: TextSpan(
            style: const TextStyle(fontSize: 14, color: AppColors.muted),
            children: [
              TextSpan(text: widget.label),
              if (widget.highlight != null)
                TextSpan(
                  text: widget.highlight,
                  style: TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                    decoration:
                        _hover ? TextDecoration.underline : TextDecoration.none,
                    decorationColor: AppColors.primary,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// A styled error/info banner.
class AuthBanner extends StatelessWidget {
  const AuthBanner({
    super.key,
    required this.message,
    this.isSuccess = false,
  });
  final String message;
  final bool isSuccess;

  @override
  Widget build(BuildContext context) {
    final color = isSuccess ? AppColors.primary : AppColors.error;
    final bg = isSuccess ? const Color(0xFFF0FDF4) : const Color(0xFFFFF1F2);
    final border = isSuccess ? const Color(0xFFBBF7D0) : const Color(0xFFFECACA);
    final icon = isSuccess
        ? Icons.check_circle_outline_rounded
        : Icons.error_outline_rounded;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: TextStyle(
                fontSize: 13,
                color: color,
                fontWeight: FontWeight.w600,
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
