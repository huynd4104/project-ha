class AppConfig {
  static const requireEmailVerification = bool.fromEnvironment(
    'REQUIRE_EMAIL_VERIFICATION',
    defaultValue: false,
  );
  static const allowAllLessonsForDemo = bool.fromEnvironment(
    'ALLOW_ALL_LESSONS_FOR_DEMO',
    defaultValue: true,
  );
}
