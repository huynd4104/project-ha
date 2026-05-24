import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

class AppTextStyles {
  static TextStyle get display => GoogleFonts.nunito(
    fontSize: 34,
    fontWeight: FontWeight.w900,
    color: AppColors.text,
    letterSpacing: 0,
  );
  static TextStyle get headline => GoogleFonts.nunito(
    fontSize: 30,
    fontWeight: FontWeight.w900,
    color: AppColors.text,
    letterSpacing: 0,
  );
  static TextStyle get title => GoogleFonts.nunito(
    fontSize: 22,
    fontWeight: FontWeight.w900,
    color: AppColors.text,
    letterSpacing: 0,
  );
  static TextStyle get subtitle => GoogleFonts.nunito(
    fontSize: 18,
    fontWeight: FontWeight.w800,
    color: AppColors.text,
    letterSpacing: 0,
  );
  static TextStyle get body => GoogleFonts.nunito(
    fontSize: 16,
    color: AppColors.text,
    height: 1.35,
    letterSpacing: 0,
  );
  static TextStyle get muted => GoogleFonts.nunito(
    fontSize: 14,
    color: AppColors.muted,
    height: 1.35,
    letterSpacing: 0,
  );
  static TextStyle get caption => GoogleFonts.nunito(
    fontSize: 12,
    color: AppColors.muted,
    height: 1.3,
    letterSpacing: 0,
  );
}
