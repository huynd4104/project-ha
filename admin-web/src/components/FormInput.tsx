type Props = {
  label: string;
  value: string | number | boolean;
  type?: string;
  onChange: (value: string | number | boolean) => void;
};

export function FormInput({ label, value, type = "text", onChange }: Props) {
  if (type === "checkbox") {
    return (
      <label className="check-row">
        <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
        {label}
      </label>
    );
  }
  return (
    <label className="field">
      <span>{label}</span>
      <input value={String(value ?? "")} type={type} onChange={(event) => onChange(type === "number" ? Number(event.target.value) : event.target.value)} />
    </label>
  );
}
