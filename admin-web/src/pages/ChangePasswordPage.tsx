import { FormEvent, useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { PasswordInput } from "../components/PasswordInput";
import { FormError } from "../components/FormError";
import { FormSuccess } from "../components/FormSuccess";
import { LoadingButton } from "../components/LoadingButton";

export function ChangePasswordPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!user || !user.email) {
      setError("Tài khoản chưa được xác định.");
      return;
    }

    if (!currentPassword) {
      setError("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Mật khẩu mới phải dài tối thiểu 8 ký tự.");
      return;
    }

    // Letters and numbers validation
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasLetter || !hasNumber) {
      setError("Mật khẩu mới phải chứa cả chữ cái và chữ số.");
      return;
    }

    if (newPassword === currentPassword) {
      setError("Mật khẩu mới phải khác mật khẩu hiện tại.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Nhập lại mật khẩu mới chưa khớp.");
      return;
    }

    try {
      setLoading(true);
      
      // 1. Reauthenticate
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // 2. Update
      await updatePassword(user, newPassword);
      
      setSuccess("Thay đổi mật khẩu thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Mật khẩu hiện tại không chính xác.");
      } else if (err.code === "auth/weak-password") {
        setError("Mật khẩu mới quá yếu.");
      } else {
        setError(err.message || "Không thể đổi mật khẩu.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: "560px", margin: "0 auto" }}>
      <div className="toolbar">
        <h1>Đổi mật khẩu</h1>
      </div>

      <div className="panel">
        <FormError message={error} />
        <FormSuccess message={success} />

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <PasswordInput
            label="Mật khẩu hiện tại *"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Nhập mật khẩu hiện tại"
            disabled={loading}
          />

          <PasswordInput
            label="Mật khẩu mới *"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Tối thiểu 8 ký tự, gồm cả chữ và số"
            disabled={loading}
          />

          <PasswordInput
            label="Nhập lại mật khẩu mới *"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Nhập lại mật khẩu mới để xác nhận"
            disabled={loading}
          />

          <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
            <LoadingButton type="submit" loading={loading}>
              Cập nhật mật khẩu
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
}
