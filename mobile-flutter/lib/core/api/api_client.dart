import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

import '../config/app_config.dart';
import '../../models/auth/auth_session.dart';

class ApiException implements Exception {
  const ApiException(this.message, {this.statusCode});
  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class ApiClient {
  ApiClient._();

  static final ApiClient instance = ApiClient._();

  final _storage = const FlutterSecureStorage();
  final _client = http.Client();

  AuthSession? _session;
  bool _refreshing = false;

  String get baseUrl => AppConfig.apiBaseUrl.replaceFirst(RegExp(r'/$'), '');
  AuthSession? get session => _session;

  Future<AuthSession?> loadSession() async {
    final accessToken = await _storage.read(key: 'access_token');
    final refreshToken = await _storage.read(key: 'refresh_token');
    if (accessToken == null || refreshToken == null) {
      _session = null;
      return null;
    }
    _session = AuthSession(accessToken: accessToken, refreshToken: refreshToken);
    return _session;
  }

  Future<void> saveSession(AuthSession session) async {
    _session = session;
    await _storage.write(key: 'access_token', value: session.accessToken);
    await _storage.write(key: 'refresh_token', value: session.refreshToken);
  }

  Future<void> clearSession() async {
    _session = null;
    await _storage.delete(key: 'access_token');
    await _storage.delete(key: 'refresh_token');
  }

  Future<dynamic> get(String path) => request('GET', path);
  Future<dynamic> post(String path, [Map<String, dynamic>? body]) =>
      request('POST', path, body: body);
  Future<dynamic> put(String path, [Map<String, dynamic>? body]) =>
      request('PUT', path, body: body);
  Future<dynamic> delete(String path) => request('DELETE', path);

  Future<dynamic> request(
    String method,
    String path, {
    Map<String, dynamic>? body,
    bool retryOnUnauthorized = true,
  }) async {
    _session ??= await loadSession();
    final response = await _send(method, path, body);
    if (response.statusCode == 401 && retryOnUnauthorized && !_refreshing) {
      final refreshed = await refreshToken();
      if (refreshed) {
        return request(
          method,
          path,
          body: body,
          retryOnUnauthorized: false,
        );
      }
    }
    return _decode(response);
  }

  Future<bool> refreshToken() async {
    final refreshToken = _session?.refreshToken;
    if (refreshToken == null || refreshToken.isEmpty) return false;
    _refreshing = true;
    try {
      final response = await _send(
        'POST',
        '/api/auth/refresh',
        {'refreshToken': refreshToken},
        attachAuth: false,
      );
      final data = _decode(response) as Map<String, dynamic>;
      final session = AuthSession.fromMap(data);
      if (!session.isValid) return false;
      await saveSession(session);
      return true;
    } catch (_) {
      await clearSession();
      return false;
    } finally {
      _refreshing = false;
    }
  }

  Future<http.Response> _send(
    String method,
    String path,
    Map<String, dynamic>? body, {
    bool attachAuth = true,
  }) {
    final uri = Uri.parse('$baseUrl$path');
    final headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      if (attachAuth && _session?.accessToken.isNotEmpty == true)
        'Authorization': 'Bearer ${_session!.accessToken}',
    };
    final encoded = body == null ? null : jsonEncode(body);
    return switch (method) {
      'GET' => _client.get(uri, headers: headers),
      'POST' => _client.post(uri, headers: headers, body: encoded),
      'PUT' => _client.put(uri, headers: headers, body: encoded),
      'DELETE' => _client.delete(uri, headers: headers),
      _ => throw ApiException('HTTP method không hỗ trợ: $method'),
    };
  }

  dynamic _decode(http.Response response) {
    dynamic data;
    final isSuccess = response.statusCode >= 200 && response.statusCode < 300;
    if (response.body.isNotEmpty) {
      try {
        data = jsonDecode(utf8.decode(response.bodyBytes));
      } catch (e) {
        if (isSuccess) {
          rethrow;
        }
      }
    }
    if (!isSuccess) {
      final message = data is Map
          ? '${data['message'] ?? data['error'] ?? 'Lỗi kết nối server.'}'
          : 'Lỗi kết nối server (${response.statusCode}).';
      throw ApiException(message, statusCode: response.statusCode);
    }
    return data;
  }
}
