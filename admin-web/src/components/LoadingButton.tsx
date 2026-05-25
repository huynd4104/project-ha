import { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export function LoadingButton({ children, loading, ...props }: Props) {
  return (
    <button 
      {...props} 
      disabled={loading || props.disabled} 
      style={{ 
        display: "inline-flex", 
        alignItems: "center", 
        justifyContent: "center", 
        gap: "8px", 
        ...props.style 
      }}
    >
      {loading && (
        <span 
          className="spinner" 
          style={{
            width: "14px",
            height: "14px",
            border: "2px solid currentColor",
            borderBottomColor: "transparent",
            borderRadius: "50%",
            display: "inline-block",
            animation: "spin 0.8s linear infinite"
          }}
        ></span>
      )}
      {loading ? "Đang xử lý..." : children}
    </button>
  );
}
