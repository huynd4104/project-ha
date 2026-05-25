class AuthSession {
  const AuthSession({
    required this.accessToken,
    required this.refreshToken,
  });

  final String accessToken;
  final String refreshToken;

  factory AuthSession.fromMap(Map<String, dynamic> map) => AuthSession(
    accessToken: '${map['accessToken'] ?? ''}',
    refreshToken: '${map['refreshToken'] ?? ''}',
  );

  Map<String, dynamic> toMap() => {
    'accessToken': accessToken,
    'refreshToken': refreshToken,
  };

  bool get isValid => accessToken.isNotEmpty && refreshToken.isNotEmpty;
}
