import '../../models/models.dart';

class AccessCheck {
  /// Checks if the user's subscription is currently active and not expired.
  static bool isSubscriptionActive(SubscriptionSummary? summary) {
    if (summary == null) return false;
    final plan = summary.plan;
    if (plan != 'PREMIUM' && plan != 'TRIAL') return false;
    if (summary.status != 'ACTIVE') return false;

    if (summary.expiresAt != null) {
      if (summary.expiresAt!.isBefore(DateTime.now())) {
        return false; // Expired
      }
    }
    return true;
  }

  /// Checks access permissions based on content AccessType and user SubscriptionSummary.
  static bool canAccessContent({
    required AccessType accessType,
    required SubscriptionSummary? summary,
    String entitlementType = 'premiumContent',
  }) {
    if (accessType == AccessType.free) return true;

    if (!isSubscriptionActive(summary)) return false;

    final ents = summary!.entitlements;
    switch (entitlementType) {
      case 'premiumContent':
        return ents.premiumContent;
      case 'premiumNpcs':
        return ents.premiumNpcs;
      case 'voiceQuiz':
        return ents.voiceQuiz;
      case 'advancedReports':
        return ents.advancedReports;
      default:
        return ents.premiumContent;
    }
  }
}
