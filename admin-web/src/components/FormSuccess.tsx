interface Props {
  message?: string;
}

export function FormSuccess({ message }: Props) {
  if (!message) return null;
  return (
    <div 
      className="success-banner"
      style={{
        backgroundColor: "#d1fae5",
        border: "1px solid #6ee7b7",
        color: "#047857",
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
      <span>🎉</span>
      <div>{message}</div>
    </div>
  );
}
