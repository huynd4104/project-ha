import 'mascot_assets.dart';

/// Emotional reaction states the mascot can display.
///
/// Use [MascotReactionX.assetPath] to resolve the asset path,
/// or pass a [MascotReaction] directly to [MascotImage].
enum MascotReaction {
  welcome,
  letsStart,
  correct,
  greatJob,
  tryAgain,
  almostCorrect,
  lessonComplete,
  rewardUnlocked,
  listening,
  sleeping,
}

/// Maps each [MascotReaction] to its corresponding asset path.
extension MascotReactionX on MascotReaction {
  String get assetPath {
    switch (this) {
      case MascotReaction.welcome:
        return MascotAssets.welcome;
      case MascotReaction.letsStart:
        return MascotAssets.letsStart;
      case MascotReaction.correct:
        return MascotAssets.correct;
      case MascotReaction.greatJob:
        return MascotAssets.greatJob;
      case MascotReaction.tryAgain:
        return MascotAssets.tryAgain;
      case MascotReaction.almostCorrect:
        return MascotAssets.almostCorrect;
      case MascotReaction.lessonComplete:
        return MascotAssets.lessonComplete;
      case MascotReaction.rewardUnlocked:
        return MascotAssets.rewardUnlocked;
      case MascotReaction.listening:
        return MascotAssets.listening;
      case MascotReaction.sleeping:
        return MascotAssets.sleeping;
    }
  }

  /// Human-readable semantic label for accessibility.
  String get semanticLabel {
    switch (this) {
      case MascotReaction.welcome:
        return 'Mascot chào đón';
      case MascotReaction.letsStart:
        return 'Mascot sẵn sàng bắt đầu';
      case MascotReaction.correct:
        return 'Mascot vui khi trả lời đúng';
      case MascotReaction.greatJob:
        return 'Mascot khen ngợi';
      case MascotReaction.tryAgain:
        return 'Mascot khuyến khích thử lại';
      case MascotReaction.almostCorrect:
        return 'Mascot gần đúng rồi';
      case MascotReaction.lessonComplete:
        return 'Mascot hoàn thành bài học';
      case MascotReaction.rewardUnlocked:
        return 'Mascot mở khóa phần thưởng';
      case MascotReaction.listening:
        return 'Mascot đang lắng nghe';
      case MascotReaction.sleeping:
        return 'Mascot đang nghỉ ngơi';
    }
  }
}
