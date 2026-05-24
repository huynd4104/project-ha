import 'model_helpers.dart';

class SubscriptionEntitlements {
  const SubscriptionEntitlements({
    this.premiumContent = false,
    this.voiceQuiz = false,
    this.advancedReports = false,
    this.premiumNpcs = false,
  });

  final bool premiumContent;
  final bool voiceQuiz;
  final bool advancedReports;
  final bool premiumNpcs;

  factory SubscriptionEntitlements.fromMap(Map<String, dynamic> map) =>
      SubscriptionEntitlements(
        premiumContent: map['premiumContent'] == true,
        voiceQuiz: map['voiceQuiz'] == true,
        advancedReports: map['advancedReports'] == true,
        premiumNpcs: map['premiumNpcs'] == true,
      );

  Map<String, dynamic> toMap() => {
        'premiumContent': premiumContent,
        'voiceQuiz': voiceQuiz,
        'advancedReports': advancedReports,
        'premiumNpcs': premiumNpcs,
      };

  SubscriptionEntitlements copyWith({
    bool? premiumContent,
    bool? voiceQuiz,
    bool? advancedReports,
    bool? premiumNpcs,
  }) =>
      SubscriptionEntitlements(
        premiumContent: premiumContent ?? this.premiumContent,
        voiceQuiz: voiceQuiz ?? this.voiceQuiz,
        advancedReports: advancedReports ?? this.advancedReports,
        premiumNpcs: premiumNpcs ?? this.premiumNpcs,
      );
}

class SubscriptionSummary {
  const SubscriptionSummary({
    this.plan = 'FREE',
    this.status = 'NONE',
    this.expiresAt,
    this.entitlements = const SubscriptionEntitlements(),
  });

  final String plan;
  final String status;
  final DateTime? expiresAt;
  final SubscriptionEntitlements entitlements;

  factory SubscriptionSummary.fromMap(Map<String, dynamic> map) =>
      SubscriptionSummary(
        plan: '${map['plan'] ?? 'FREE'}',
        status: '${map['status'] ?? 'NONE'}',
        expiresAt: readDate(map['expiresAt']),
        entitlements: SubscriptionEntitlements.fromMap(
          readMap(map['entitlements']),
        ),
      );

  Map<String, dynamic> toMap() => {
        'plan': plan,
        'status': status,
        'expiresAt': expiresAt,
        'entitlements': entitlements.toMap(),
      };

  SubscriptionSummary copyWith({
    String? plan,
    String? status,
    DateTime? expiresAt,
    SubscriptionEntitlements? entitlements,
  }) =>
      SubscriptionSummary(
        plan: plan ?? this.plan,
        status: status ?? this.status,
        expiresAt: expiresAt ?? this.expiresAt,
        entitlements: entitlements ?? this.entitlements,
      );
}
