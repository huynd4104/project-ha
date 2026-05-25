import { FormEvent, useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { authApi } from "../api/authApi";
import { PasswordInput } from "../components/PasswordInput";
import { FormError } from "../components/FormError";
import { LoadingButton } from "../components/LoadingButton";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { refreshUserProfile } = useAuth();
  const [email, setEmail] = useState("admin@demo.com");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [cooldown, setCooldown] = useState(0);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  
  const routeErrorState = location.state as { error?: string; email?: string } | null;
  const isEmailNotVerified = routeErrorState?.error === "EMAIL_NOT_VERIFIED";
  
  const displayError = isEmailNotVerified 
    ? `Tài khoản quản trị (${routeErrorState?.email}) chưa được xác thực email. Vui lòng kiểm tra hộp thư.`
    : (error || routeErrorState?.error || "");

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [cooldown]);


  const handleResendVerification = async () => {
    alert("Hệ thống đã chuyển sang Supabase. Vui lòng liên hệ quản trị hệ thống.");
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setVerificationSuccess("");

    if (!email.trim()) {
      setError("Vui lòng nhập địa chỉ email.");
      return;
    }
    if (!password) {
      setError("Vui lòng nhập mật khẩu.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Định dạng email chưa chính xác.");
      return;
    }

    try {
      setLoading(true);
      await authApi.login(email.trim(), password);
      await refreshUserProfile();
      navigate("/dashboard");
    } catch (err) {
      console.error("Login failed:", err);
      setError(formatLoginError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <h1>Đăng nhập quản trị</h1>
        
        <FormError message={displayError} />
        {verificationSuccess && (
          <p className="success-msg" style={{ color: "var(--success)", fontSize: "13px", fontWeight: "600" }}>
            🎉 {verificationSuccess}
          </p>
        )}

        <div className="field">
          <label>Địa chỉ Email</label>
          <input 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="admin@example.com" 
            type="email"
            disabled={loading}
          />
        </div>

        <PasswordInput
          label="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nhập mật khẩu"
          disabled={loading}
        />

        <div style={{ textAlign: "right", marginTop: "-4px" }}>
          <Link to="/forgot-password" style={{ color: "var(--primary)", fontWeight: "600", textDecoration: "none", fontSize: "13px" }}>
            Quên mật khẩu?
          </Link>
        </div>

        <LoadingButton type="submit" loading={loading} style={{ marginTop: "8px" }}>
          Đăng nhập hệ thống
        </LoadingButton>

        {isEmailNotVerified && (
          <div style={{ marginTop: "12px", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
            <button
              type="button"
              className="secondary"
              onClick={handleResendVerification}
              disabled={sendingVerification || cooldown > 0}
              style={{ width: "100%", padding: "8px" }}
            >
              {cooldown > 0 ? `Gửi lại email sau ${cooldown}s` : "Gửi lại email xác thực"}
            </button>
          </div>
        )}
      </form>
    </main>
  );
}

function formatLoginError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  
  if (message.includes("auth/invalid-credential") || message.includes("INVALID_LOGIN_CREDENTIALS") || message.includes("auth/wrong-password")) {
    return "Email hoặc mật khẩu chưa đúng, hoặc tài khoản quản trị chưa được cấp quyền.";
  }
  if (message.includes("auth/user-not-found")) {
    return "Tài khoản không tồn tại trên hệ thống.";
  }
  if (message.includes("auth/invalid-email")) {
    return "Định dạng email không hợp lệ.";
  }
  if (message.includes("auth/too-many-requests")) {
    return "Tài khoản đã bị tạm khóa do nhập sai mật khẩu quá nhiều lần. Vui lòng quay lại sau ít phút.";
  }
  if (message.includes("auth/user-disabled")) {
    return "Tài khoản quản trị này đã bị vô hiệu hóa.";
  }
  if (message.includes("network-request-failed") || message.includes("auth/network-request-failed")) {
    return "Lỗi kết nối mạng. Vui lòng kiểm tra lại đường truyền internet.";
  }
  
  // Custom messages thrown by authApi.login
  if (message.includes("Tài khoản này không có quyền quản trị")) {
    return "Tài khoản đăng nhập không có quyền quản trị (ADMIN).";
  }
  if (message.includes("Tài khoản quản trị đã bị khóa")) {
    return "Tài khoản quản trị của bạn đã bị khóa hoạt động.";
  }
  
  return message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập hoặc kết nối hệ thống.";
}
