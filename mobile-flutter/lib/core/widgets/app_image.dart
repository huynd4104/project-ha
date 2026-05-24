import 'dart:convert';
import 'dart:typed_data';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../theme/app_colors.dart';

class AppImage extends StatelessWidget {
  const AppImage({
    super.key,
    required this.imageUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.placeholderIcon = Icons.image_rounded,
    this.color,
  });

  final String imageUrl;
  final double? width;
  final double? height;
  final BoxFit fit;
  final IconData placeholderIcon;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final cleanUrl = imageUrl.trim();

    if (cleanUrl.isEmpty) {
      return _buildPlaceholder();
    }

    // Handle Data URI (Base64)
    if (cleanUrl.startsWith('data:image/')) {
      try {
        final commaIndex = cleanUrl.indexOf(',');
        if (commaIndex != -1) {
          final base64Data = cleanUrl.substring(commaIndex + 1);
          final bytes = base64Decode(base64Data);
          if (cleanUrl.contains('image/svg+xml')) {
            return SvgPicture.memory(
              bytes,
              width: width,
              height: height,
              fit: fit,
              colorFilter: color != null
                  ? ColorFilter.mode(color!, BlendMode.srcIn)
                  : null,
            );
          } else {
            return Image.memory(
              bytes,
              width: width,
              height: height,
              fit: fit,
              color: color,
            );
          }
        }
      } catch (e) {
        debugPrint('Error decoding base64 image: $e');
        return _buildPlaceholder();
      }
    }

    // Handle SVG URLs
    if (cleanUrl.toLowerCase().endsWith('.svg') || cleanUrl.contains('twemoji') || cleanUrl.contains('/svg/')) {
      return SvgPicture.network(
        cleanUrl,
        width: width,
        height: height,
        fit: fit,
        colorFilter: color != null
            ? ColorFilter.mode(color!, BlendMode.srcIn)
            : null,
        placeholderBuilder: (_) => _buildLoadingIndicator(),
      );
    }

    // Handle standard network images
    return CachedNetworkImage(
      imageUrl: cleanUrl,
      width: width,
      height: height,
      fit: fit,
      color: color,
      placeholder: (_, __) => _buildLoadingIndicator(),
      errorWidget: (_, __, ___) => _buildPlaceholder(),
    );
  }

  Widget _buildPlaceholder() {
    return SizedBox(
      width: width,
      height: height,
      child: Center(
        child: Icon(
          placeholderIcon,
          size: width != null ? (width! * 0.5).clamp(24.0, 64.0) : 34.0,
          color: AppColors.muted,
        ),
      ),
    );
  }

  Widget _buildLoadingIndicator() {
    return SizedBox(
      width: width,
      height: height,
      child: const Center(
        child: SizedBox(
          width: 24.0,
          height: 24.0,
          child: CircularProgressIndicator(
            strokeWidth: 2.0,
            valueColor: AlwaysStoppedAnimation<Color>(AppColors.sky),
          ),
        ),
      ),
    );
  }
}
