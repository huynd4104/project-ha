import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../api/authApi";
import { FormError } from "../components/FormError";
import { FormSuccess } from "../components/FormSuccess";
import { LoadingButton } from "../components/LoadingButton";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Vui lòng nhập địa chỉ email.");
      return;
    }

    try {
      setLoading(true);
      await authApi.forgotPassword(email.trim());
      setSuccess("Nếu email đã tồn tại trong hệ thống, mã đặt lại mật khẩu đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.");
      setEmail("");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/invalid-email") {
        setError("Định dạng email chưa chính xác.");
      } else {
        setError("Có lỗi xảy ra: " + (err.message || "Không thể gửi email."));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Khôi phục mật khẩu</h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: "-10px 0 10px 0", lineHeight: "1.5" }}>
          Nhập email quản trị của bạn. Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu qua email.
        </p>
        
        <FormError message={error} />
        <FormSuccess message={success} />

        <input 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="Email của bạn" 
          type="email"
          disabled={loading}
        />
        
        <LoadingButton type="submit" loading={loading}>
          Gửi yêu cầu
        </LoadingButton>

        <div style={{ textAlign: "center", marginTop: "10px" }}>
          <Link to="/login" style={{ color: "var(--primary)", fontWeight: "600", textDecoration: "none", fontSize: "14px" }}>
            Quay lại Đăng nhập
          </Link>
        </div>
      </form>
    </main>
  );
}
