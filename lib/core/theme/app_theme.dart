import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static const Color obsidianBg = Color(0xFF131313);
  static const Color obsidianSurface = Color(0xFF1C1C1B);
  static const Color obsidianGold = Color(0xFFF2CA50);

  static const Color auraBg = Color(0xFFFAF9F6);
  static const Color auraPrimary = Color(0xFF72594A); 
  static const Color auraSurface = Color(0xFFFFFFFF);
  static const Color auraText = Color(0xFF1A1C1A);

  static ThemeData getTheme(String themeName) {
    if (themeName == 'aura') {
      return ThemeData(
        brightness: Brightness.light,
        scaffoldBackgroundColor: auraBg,
        primaryColor: auraPrimary,
        cardColor: auraSurface,
        textTheme: GoogleFonts.manropeTextTheme(ThemeData.light().textTheme).copyWith(
          bodyMedium: GoogleFonts.manrope(color: auraText.withOpacity(0.8)),
        ),
        appBarTheme: const AppBarTheme(backgroundColor: Colors.transparent, elevation: 0, centerTitle: true, iconTheme: IconThemeData(color: auraPrimary)),
      );
    }
    
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: obsidianBg,
      primaryColor: obsidianGold,
      cardColor: obsidianSurface,
      textTheme: GoogleFonts.manropeTextTheme(ThemeData.dark().textTheme).copyWith(
        bodyMedium: GoogleFonts.workSans(color: Colors.white70),
      ),
      appBarTheme: const AppBarTheme(backgroundColor: Colors.transparent, elevation: 0, centerTitle: true, iconTheme: IconThemeData(color: obsidianGold)),
    );
  }
}