import '../../../core/api/api_client.dart';
import '../../../models/app_user.dart';
import '../../../models/auth/auth_session.dart';

class AuthRepository {
  AuthRepository({ApiClient? api}) : _api = api ?? ApiClient.instance;

  final ApiClient _api;

  AuthSession? get currentSession => _api.session;

  Future<AuthSession?> loadSession() => _api.loadSession();

  Future<AppUser> me() async {
    final data = await _api.get('/api/me') as Map<String, dynamic>;
    return AppUser.fromMap('${data['id']}', data);
  }

  Future<AppUser?> tryMe() async {
    final session = await _api.loadSession();
    if (session == null || !session.isValid) return null;
    return me();
  }

  Future<AppUser> register(
    String fullName,
    String email,
    String password,
  ) async {
    final data = await _api.post('/api/auth/register', {
      'fullName': fullName.trim(),
      'email': email.trim(),
      'password': password,
    }) as Map<String, dynamic>;
    await _saveSession(data);
    final user = Map<String, dynamic>.from(data['user'] as Map);
    return AppUser.fromMap('${user['id']}', user);
  }

  Future<AppUser> login(String email, String password) async {
    final data = await _api.post('/api/auth/login', {
      'email': email.trim(),
      'password': password,
    }) as Map<String, dynamic>;
    await _saveSession(data);
    final user = Map<String, dynamic>.from(data['user'] as Map);
    return AppUser.fromMap('${user['id']}', user);
  }

  Future<void> sendPasswordReset(String email) => _api.post(
    '/api/auth/forgot-password',
    {'email': email.trim()},
  );

  Future<void> resetPassword(
    String email,
    String code,
    String newPassword,
  ) => _api.post('/api/auth/reset-password', {
    'email': email.trim(),
    'code': code.trim(),
    'newPassword': newPassword,
  });

  Future<void> sendOtpVerificationCode() =>
      _api.post('/api/auth/send-verification-code');

  Future<bool> verifyOtpCode(String enteredCode) async {
    await _api.post('/api/auth/verify-email', {'code': enteredCode.trim()});
    return true;
  }

  Future<void> resendVerification() => sendOtpVerificationCode();

  Future<void> reloadUser() async {
    await me();
  }

  Future<void> updateFullName(String value) async {
    await _api.put('/api/me', {'fullName': value.trim()});
  }

  Future<void> changePassword(
    String currentPassword,
    String newPassword,
  ) async {
    await _api.post('/api/auth/change-password', {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    });
  }

  Future<void> logout() async {
    final refreshToken = _api.session?.refreshToken;
    try {
      await _api.post('/api/auth/logout', {'refreshToken': refreshToken});
    } finally {
      await _api.clearSession();
    }
  }

  Future<void> _saveSession(Map<String, dynamic> data) async {
    final session = AuthSession.fromMap(data);
    if (!session.isValid) throw const ApiException('Server không trả về token.');
    await _api.saveSession(session);
  }
}
