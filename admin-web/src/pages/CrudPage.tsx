import { FormEvent, useEffect, useMemo, useState } from "react";
import { adminApi } from "../api/adminApi";
import { DataTable } from "../components/DataTable";
import { FormInput } from "../components/FormInput";

export type Field = { key: string; label: string; type?: string; defaultValue?: string | number | boolean };

export function CrudPage({ title, path, fields, columns, readonly = false }: { title: string; path: string; fields: Field[]; columns: string[]; readonly?: boolean }) {
  const empty = useMemo(() => Object.fromEntries(fields.map((field) => [field.key, field.defaultValue ?? ""])), [fields]);
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState<any>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function load() {
    const res = await adminApi.list(path);
    setRows(res.data.data);
  }
  useEffect(() => { load(); }, [path]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const payload = normalize(form, fields);
    if (editingId) await adminApi.update(path, editingId, payload);
    else await adminApi.create(path, payload);
    setForm(empty);
    setEditingId(null);
    load();
  }

  return (
    <div>
      <h1>{title}</h1>
      {!readonly && (
        <form className="panel form-grid" onSubmit={submit}>
          {fields.map((field) => <FormInput key={field.key} label={field.label} type={field.type} value={form[field.key]} onChange={(value) => setForm({ ...form, [field.key]: value })} />)}
          <button>{editingId ? "Cập nhật" : "Tạo mới"}</button>
          {title === "Mã QR" && <button type="button" onClick={() => setForm({ ...form, code: `QR_${Date.now()}` })}>Tạo mã</button>}
        </form>
      )}
      <DataTable
        rows={rows}
        columns={columns}
        onEdit={readonly ? undefined : (row) => { setEditingId(row.id); setForm({ ...empty, ...row }); }}
        onDelete={readonly ? undefined : async (row) => { await adminApi.remove(path, row.id); load(); }}
      />
    </div>
  );
}

function normalize(form: any, fields: Field[]) {
  const payload: any = {};
  fields.forEach((field) => {
    const value = form[field.key];
    if (value === "") return;
    if (field.key === "maxUses" && (value === undefined || value === null)) return;
    payload[field.key] = field.type === "number" ? Number(value) : value;
  });
  return payload;
}
