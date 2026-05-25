import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading, isAuthenticated, isAdmin, emailVerified } = useAuth();
  
  const requireVerification = import.meta.env.VITE_REQUIRE_EMAIL_VERIFICATION === "true";

  if (loading) {
    return (
      <div 
        style={{ 
          display: "grid", 
          placeItems: "center", 
          minHeight: "100vh", 
          fontFamily: "var(--font-main, sans-serif)",
          background: "var(--bg-main)"
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ fontWeight: 700, color: "var(--text-muted)", fontSize: "16px" }}>
            Đang xác minh quyền quản trị...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/login" replace state={{ error: "Tài khoản này không có quyền quản trị." }} />;
  }

  if (requireVerification && !emailVerified) {
    return <Navigate to="/login" replace state={{ error: "EMAIL_NOT_VERIFIED", email: user?.email }} />;
  }

  return children;
}
