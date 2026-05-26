/// Centralized asset paths for the app mascot system.
///
/// Use [MascotReaction] and [MascotReactionX] for enum-based access,
/// or reference these constants directly when you need a specific image.
class MascotAssets {
  MascotAssets._();

  // ── Main mascot ───────────────────────────────────────────────────────────
  static const mascotMain =
      'assets/images/mascot/mascot_main.png';
  static const appIconAvatar =
      'assets/images/mascot/app_icon_avatar.png';
  static const onboardingBackground =
      'assets/images/mascot/onboarding_background.webp';

  // ── Reaction states ───────────────────────────────────────────────────────
  static const welcome =
      'assets/images/mascot/gifs/mascot_welcome.gif';
  static const letsStart =
      'assets/images/mascot/reactions/mascot_lets_start.png';
  static const correct =
      'assets/images/mascot/reactions/mascot_correct.png';
  static const greatJob =
      'assets/images/mascot/reactions/mascot_great_job.png';
  static const tryAgain =
      'assets/images/mascot/reactions/mascot_try_again.png';
  static const almostCorrect =
      'assets/images/mascot/reactions/mascot_almost_correct.png';
  static const lessonComplete =
      'assets/images/mascot/reactions/mascot_lesson_complete.png';
  static const rewardUnlocked =
      'assets/images/mascot/reactions/mascot_reward_unlocked.png';
  static const listening =
      'assets/images/mascot/reactions/mascot_listening.png';
  static const sleeping =
      'assets/images/mascot/reactions/mascot_sleeping.png';

  // ── Reference only — do NOT use in production user-facing UI ─────────────
  static const characterSheet =
      'assets/images/mascot/reference/character_sheet.png';
  static const reactionSheet =
      'assets/images/mascot/reference/reaction_sheet.png';
}
