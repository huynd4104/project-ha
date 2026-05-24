import 'package:flutter/material.dart';

import 'app_colors.dart';

class AppTextStyles {
  static const headline = TextStyle(
    fontSize: 30,
    fontWeight: FontWeight.w900,
    color: AppColors.text,
  );
  static const title = TextStyle(
    fontSize: 22,
    fontWeight: FontWeight.w900,
    color: AppColors.text,
  );
  static const body = TextStyle(
    fontSize: 16,
    color: AppColors.text,
    height: 1.35,
  );
  static const muted = TextStyle(
    fontSize: 14,
    color: AppColors.muted,
    height: 1.35,
  );
}
