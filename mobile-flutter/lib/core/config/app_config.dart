class AppConfig {
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:8080',
  );
  static const requireEmailVerification = bool.fromEnvironment(
    'REQUIRE_EMAIL_VERIFICATION',
    defaultValue: true,
  );
  static const allowAllLessonsForDemo = bool.fromEnvironment(
    'ALLOW_ALL_LESSONS_FOR_DEMO',
    defaultValue: true,
  );
  static const enableDemoPremiumUpgrade = bool.fromEnvironment(
    'ENABLE_DEMO_PREMIUM_UPGRADE',
    defaultValue: true,
  );
}
