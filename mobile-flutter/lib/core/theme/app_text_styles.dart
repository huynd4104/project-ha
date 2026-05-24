import 'package:flutter/material.dart';

import 'app_colors.dart';

class AppTextStyles {
  static const display = TextStyle(
    fontSize: 34,
    fontWeight: FontWeight.w900,
    color: AppColors.text,
    letterSpacing: 0,
  );
  static const headline = TextStyle(
    fontSize: 30,
    fontWeight: FontWeight.w900,
    color: AppColors.text,
    letterSpacing: 0,
  );
  static const title = TextStyle(
    fontSize: 22,
    fontWeight: FontWeight.w900,
    color: AppColors.text,
    letterSpacing: 0,
  );
  static const subtitle = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.w800,
    color: AppColors.text,
    letterSpacing: 0,
  );
  static const body = TextStyle(
    fontSize: 16,
    color: AppColors.text,
    height: 1.35,
    letterSpacing: 0,
  );
  static const muted = TextStyle(
    fontSize: 14,
    color: AppColors.muted,
    height: 1.35,
    letterSpacing: 0,
  );
  static const caption = TextStyle(
    fontSize: 12,
    color: AppColors.muted,
    height: 1.3,
    letterSpacing: 0,
  );
}
