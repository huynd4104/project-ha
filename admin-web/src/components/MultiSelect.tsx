import { useState, useRef, useEffect } from "react";

type Option = { value: string; label: string };

interface MultiSelectProps {
  label: React.ReactNode;
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export function MultiSelect({ label, options, selected, onChange, placeholder = "Chọn..." }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = options.filter(
    (o) => o.label.toLowerCase().includes(search.toLowerCase()) && !selected.includes(o.value)
  );

  const toggle = (value: string) => {
    if (selected.includes(value)) onChange(selected.filter((s) => s !== value));
    else onChange([...selected, value]);
  };

  const selectedLabels = selected
    .map((s) => options.find((o) => o.value === s))
    .filter(Boolean) as Option[];

  return (
    <div className="field" ref={ref}>
      <label>{label}</label>
      <div className="ms-wrap" onClick={() => setOpen(true)}>
        {selectedLabels.length === 0 && <span className="ms-placeholder">{placeholder}</span>}
        <div className="ms-chips">
          {selectedLabels.map((o) => (
            <span key={o.value} className="ms-chip">
              {o.label}
              <button
                type="button"
                className="ms-chip-x"
                onClick={(e) => { e.stopPropagation(); toggle(o.value); }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
      {open && (
        <div className="ms-dropdown">
          <input
            type="text"
            className="ms-search"
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className="ms-options">
            {filtered.length === 0 ? (
              <div className="ms-empty">Không có mục nào</div>
            ) : (
              filtered.map((o) => (
                <div key={o.value} className="ms-option" onClick={() => toggle(o.value)}>
                  {o.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
