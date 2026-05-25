interface Props {
  message?: string;
}

export function FormError({ message }: Props) {
  if (!message) return null;
  return (
    <div 
      className="error-banner"
      style={{
        backgroundColor: "#fee2e2",
        border: "1px solid #fca5a5",
        color: "#b91c1c",
        padding: "12px 16px",
        borderRadius: "var(--radius-md)",
        fontSize: "14px",
        fontWeight: 600,
        margin: "12px 0",
        display: "flex",
        alignItems: "center",
        gap: "8px"
      }}
    >
      <span>⚠️</span>
      <div>{message}</div>
    </div>
  );
}
