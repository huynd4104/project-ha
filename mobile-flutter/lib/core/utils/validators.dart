class Validators {
  static String? required(String? value, [String label = 'Trường này']) {
    if (value == null || value.trim().isEmpty)
      return '$label không được để trống.';
    return null;
  }

  static String? email(String? value) {
    final text = value?.trim() ?? '';
    if (text.isEmpty) return 'Email không được để trống.';
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(text))
      return 'Email chưa hợp lệ.';
    return null;
  }

  static String? password(String? value) {
    final text = value ?? '';
    if (text.length < 6) return 'Mật khẩu cần tối thiểu 6 ký tự.';
    return null;
  }

  static int passwordScore(String value) {
    var score = 0;
    if (value.length >= 6) score++;
    if (RegExp(r'[A-Z]').hasMatch(value)) score++;
    if (RegExp(r'[0-9]').hasMatch(value)) score++;
    if (RegExp(r'[^A-Za-z0-9]').hasMatch(value)) score++;
    return score;
  }
}
