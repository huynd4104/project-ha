export function mapAuthError(error: any): string {
  const code = error?.code || error?.message || "";
  
  if (code.includes("auth/email-already-in-use")) {
    return "Email này đã được đăng ký cho một tài khoản khác.";
  }
  if (code.includes("auth/invalid-email") || code.includes("invalid-email")) {
    return "Định dạng địa chỉ email không hợp lệ.";
  }
  if (code.includes("auth/weak-password")) {
    return "Mật khẩu quá yếu. Mật khẩu cần dài tối thiểu 8 ký tự.";
  }
  if (code.includes("auth/user-not-found") || code.includes("user-not-found")) {
    return "Không tìm thấy tài khoản tương ứng với email này.";
  }
  if (code.includes("auth/wrong-password") || code.includes("wrong-password")) {
    return "Mật khẩu chưa chính xác. Vui lòng thử lại.";
  }
  if (code.includes("auth/invalid-credential") || code.includes("invalid-credential") || code.includes("INVALID_LOGIN_CREDENTIALS")) {
    return "Email hoặc mật khẩu chưa đúng. Vui lòng kiểm tra lại.";
  }
  if (code.includes("auth/too-many-requests")) {
    return "Tài khoản bị khóa tạm thời do nhập sai quá nhiều lần. Vui lòng thử lại sau ít phút.";
  }
  if (code.includes("auth/requires-recent-login")) {
    return "Vui lòng đăng nhập lại trước khi thực hiện thay đổi thông tin quan trọng.";
  }
  if (code.includes("auth/network-request-failed") || code.includes("network-request-failed")) {
    return "Kết nối mạng thất bại. Vui lòng kiểm tra lại internet.";
  }
  if (code.includes("auth/user-disabled")) {
    return "Tài khoản của bạn đã bị khóa hoặc vô hiệu hóa.";
  }
  
  return error?.message || "Đã xảy ra lỗi không xác định. Vui lòng thử lại.";
}

export function isExpectedAuthError(error: any): boolean {
  const code = error?.code || error?.message || "";
  return (
    code.includes("auth/email-already-in-use") ||
    code.includes("auth/invalid-email") ||
    code.includes("invalid-email") ||
    code.includes("auth/weak-password") ||
    code.includes("auth/user-not-found") ||
    code.includes("user-not-found") ||
    code.includes("auth/wrong-password") ||
    code.includes("wrong-password") ||
    code.includes("auth/invalid-credential") ||
    code.includes("invalid-credential") ||
    code.includes("INVALID_LOGIN_CREDENTIALS") ||
    code.includes("auth/too-many-requests") ||
    code.includes("auth/requires-recent-login") ||
    code.includes("auth/network-request-failed") ||
    code.includes("network-request-failed") ||
    code.includes("auth/user-disabled")
  );
}
