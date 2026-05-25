import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const { user, emailVerified, logout } = useAuth();
  const navigate = useNavigate();
  
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      {/* Email Verification Warning Banner */}
      {!emailVerified && (
        <div 
          style={{ 
            backgroundColor: "#fffbeb", 
            borderBottom: "1px solid #fde68a", 
            color: "#b45309", 
            padding: "8px 32px", 
            fontSize: "13px", 
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <span>⚠️ Email quản trị chưa được xác thực. Vui lòng xác minh địa chỉ email trong email gửi từ Firebase.</span>
        </div>
      )}
      
      <header className="topbar" style={{ borderTop: !emailVerified ? "none" : undefined }}>
        <span>Quản lý hệ thống</span>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {user && (
            <span style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: "600" }}>
              👤 {user.email}
            </span>
          )}
          <Link 
            to="/change-password" 
            style={{ 
              color: "var(--primary)", 
              textDecoration: "none", 
              fontWeight: "600", 
              fontSize: "14px" 
            }}
          >
            Đổi mật khẩu
          </Link>
          <button
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
            className="secondary"
            style={{ padding: "6px 12px" }}
          >
            Đăng xuất
          </button>
        </div>
      </header>
    </div>
  );
}
