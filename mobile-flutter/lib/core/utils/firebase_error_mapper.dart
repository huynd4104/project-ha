import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';

String friendlyFirebaseError(Object error) {
  if (error is FirebaseAuthException) {
    switch (error.code) {
      case 'invalid-email':
        return 'Email chưa hợp lệ.';
      case 'user-disabled':
        return 'Tài khoản đã bị khóa.';
      case 'user-not-found':
      case 'wrong-password':
      case 'invalid-credential':
        return 'Email hoặc mật khẩu chưa đúng.';
      case 'email-already-in-use':
        return 'Email này đã được đăng ký.';
      case 'weak-password':
        return 'Mật khẩu cần mạnh hơn.';
      case 'requires-recent-login':
        return 'Vui lòng đăng nhập lại trước khi đổi mật khẩu.';
    }
  }
  if (error is FirebaseFunctionsException) {
    return error.message ?? 'Không thể xử lý yêu cầu. Vui lòng thử lại.';
  }
  final text = error.toString();
  if (text.contains('FIREBASE_PROJECT_ID') || text.contains('projectId')) {
    return 'Flutter Firebase chưa được cấu hình. Hãy chạy flutterfire configure hoặc truyền --dart-define.';
  }
  return text.replaceFirst('Exception: ', '');
}
