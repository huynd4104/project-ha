import '../api/api_client.dart';

String friendlyApiError(Object error) {
  if (error is ApiException) {
    return error.message;
  }
  final message = error.toString().replaceFirst('Exception: ', '');
  if (message.contains('SocketException') ||
      message.contains('Connection refused')) {
    return 'Không kết nối được backend. Vui lòng kiểm tra API_BASE_URL và server.';
  }
  return message;
}
