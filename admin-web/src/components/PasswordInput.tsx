import { InputHTMLAttributes, useState } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function PasswordInput({ label, error, ...props }: Props) {
  const [visible, setVisible] = useState(false);
  
  return (
    <div className="field" style={{ position: "relative" }}>
      <label>{label}</label>
      <div style={{ position: "relative", width: "100%" }}>
        <input 
          {...props} 
          type={visible ? "text" : "password"} 
          style={{ ...props.style, paddingRight: "40px" }} 
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          style={{
            position: "absolute",
            right: "6px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "transparent",
            border: 0,
            boxShadow: "none",
            color: "var(--text-muted)",
            padding: "4px 8px",
            fontSize: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            height: "100%"
          }}
        >
          {visible ? "🙈" : "👁️"}
        </button>
      </div>
      {error && <span className="error-msg">{error}</span>}
    </div>
  );
}
