import 'package:flutter/material.dart';

Widget createWebImageWidget(String url, double? width, double? height, BoxFit fit, Color? color) {
  return Image.network(
    url,
    width: width,
    height: height,
    fit: fit,
    color: color,
  );
}
