import 'model_helpers.dart';
import 'subscription_summary.dart';

class AppUser {
  const AppUser({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
    required this.isActive,
    this.emailVerified = false,
    this.subscriptionSummary = const SubscriptionSummary(),
  });

  final String id;
  final String email;
  final String fullName;
  final String role;
  final bool isActive;
  final bool emailVerified;
  final SubscriptionSummary subscriptionSummary;

  factory AppUser.fromMap(String id, Map<String, dynamic> map) => AppUser(
    id: id,
    email: '${map['email'] ?? ''}',
    fullName: '${map['fullName'] ?? ''}',
    role: '${map['role'] ?? 'PARENT'}',
    isActive: map['isActive'] != false,
    emailVerified: map['emailVerified'] == true,
    subscriptionSummary: SubscriptionSummary.fromMap(
      readMap(map['subscriptionSummary']),
    ),
  );

  Map<String, dynamic> toMap() => {
    'uid': id,
    'email': email,
    'fullName': fullName,
    'role': role,
    'isActive': isActive,
    'emailVerified': emailVerified,
    'subscriptionSummary': subscriptionSummary.toMap(),
  };

  AppUser copyWith({
    String? fullName,
    bool? isActive,
    bool? emailVerified,
    SubscriptionSummary? subscriptionSummary,
  }) => AppUser(
    id: id,
    email: email,
    fullName: fullName ?? this.fullName,
    role: role,
    isActive: isActive ?? this.isActive,
    emailVerified: emailVerified ?? this.emailVerified,
    subscriptionSummary: subscriptionSummary ?? this.subscriptionSummary,
  );
}
