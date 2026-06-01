import 'dart:html' as html;
import 'dart:ui' as ui;
import 'package:flutter/material.dart';

final Set<String> _registeredViews = {};

Widget createWebImageWidget(String url, double? width, double? height, BoxFit fit, Color? color) {
  // Use a unique view type for each unique image URL and fit configuration
  final String viewType = 'web-image-${url.hashCode}-${fit.index}';

  if (!_registeredViews.contains(viewType)) {
    _registeredViews.add(viewType);
    // ignore: undefined_prefixed_name
    ui.platformViewRegistry.registerViewFactory(viewType, (int viewId) {
      final html.ImageElement element = html.ImageElement()
        ..src = url
        ..style.border = 'none'
        ..style.width = '100%'
        ..style.height = '100%';

      // Map BoxFit to CSS object-fit
      switch (fit) {
        case BoxFit.cover:
          element.style.objectFit = 'cover';
          break;
        case BoxFit.contain:
          element.style.objectFit = 'contain';
          break;
        case BoxFit.fill:
          element.style.objectFit = 'fill';
          break;
        case BoxFit.fitHeight:
          element.style.objectFit = 'contain'; // fallback
          break;
        case BoxFit.fitWidth:
          element.style.objectFit = 'contain'; // fallback
          break;
        case BoxFit.scaleDown:
          element.style.objectFit = 'scale-down';
          break;
        case BoxFit.none:
          element.style.objectFit = 'none';
          break;
      }

      // If color is specified, we can apply a CSS filter or wrap it.
      // For simplicity, a standard CSS tint / filter can be applied if color is not null, 
      // but simple image rendering is usually sufficient.
      return element;
    });
  }

  return SizedBox(
    width: width,
    height: height,
    child: HtmlElementView(viewType: viewType),
  );
}
