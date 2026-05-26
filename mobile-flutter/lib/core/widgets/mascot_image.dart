import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../constants/mascot_assets.dart';
import '../constants/mascot_reaction.dart';

/// Displays a mascot image with an optional gentle entrance animation.
///
/// Accepts either a [MascotReaction] (preferred) or a raw [assetPath].
/// Exactly one of the two must be provided.
///
/// Example:
/// ```dart
/// MascotImage(reaction: MascotReaction.welcome, width: 160)
/// MascotImage(assetPath: MascotAssets.mascotMain, width: 120)
/// ```
class MascotImage extends StatelessWidget {
  const MascotImage({
    super.key,
    this.reaction,
    this.assetPath,
    this.width,
    this.height,
    this.fit = BoxFit.contain,
    this.alignment = Alignment.center,
    this.animate = true,
    this.semanticLabel,
  }) : assert(
          reaction != null || assetPath != null,
          'Provide either reaction or assetPath.',
        );

  /// The emotional state to display. Resolved to an asset path automatically.
  final MascotReaction? reaction;

  /// Direct asset path — use only when a specific image outside the enum is needed.
  final String? assetPath;

  final double? width;
  final double? height;
  final BoxFit fit;
  final AlignmentGeometry alignment;

  /// Whether to play the entrance fade+scale animation.
  /// Set to false for images that are already visible without a transition.
  final bool animate;

  /// Override the auto-generated semantic label. Pass an empty string
  /// to mark the image as decorative (excluded from semantics).
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final path = reaction?.assetPath ?? assetPath!;
    final label = semanticLabel ?? reaction?.semanticLabel ?? '';

    Widget image = Image.asset(
      path,
      width: width,
      height: height,
      fit: fit,
      alignment: alignment,
      semanticLabel: label.isEmpty ? null : label,
      excludeFromSemantics: label.isEmpty,
      filterQuality: FilterQuality.medium,
      gaplessPlayback: true,
      errorBuilder: (_, _, _) => _MascotFallback(
        width: width,
        height: height,
      ),
    );

    if (animate) {
      image = image
          .animate()
          .fadeIn(duration: 350.ms, curve: Curves.easeOut)
          .scale(
            begin: const Offset(0.88, 0.88),
            end: const Offset(1.0, 1.0),
            duration: 350.ms,
            curve: Curves.easeOut,
          );
    }

    return image;
  }
}

/// Fallback widget shown when the mascot image fails to load.
class _MascotFallback extends StatelessWidget {
  const _MascotFallback({this.width, this.height});

  final double? width;
  final double? height;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      height: height,
      child: Center(
        child: Image.asset(
          MascotAssets.appIconAvatar,
          width: (width ?? 120) * 0.65,
          height: (height ?? 120) * 0.65,
          fit: BoxFit.contain,
          errorBuilder: (_, _, _) => Icon(
            Icons.auto_awesome_rounded,
            size: (width ?? 120) * 0.45,
            color: const Color(0xFFFFC800),
          ),
        ),
      ),
    );
  }
}
