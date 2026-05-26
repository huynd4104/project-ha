import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { adminApi } from "../api/adminApi";
import { AnyRecord } from "../api/client";

const resources = [
  { key: "users", label: "Người dùng" },
  { key: "children", label: "Trẻ em" },
  { key: "npcs", label: "Mascot" },
  { key: "qr-codes", label: "Mã QR" },
  { key: "development-categories", label: "Nhóm trẻ" },
  { key: "learning-goals", label: "Mục tiêu học tập" },
  { key: "skills", label: "Kỹ năng" },
  { key: "programs", label: "Chương trình" },
  { key: "learning-paths", label: "Lộ trình học" },
  { key: "path-items", label: "Mục lộ trình" },
  { key: "activities", label: "Hoạt động" },
  { key: "activation-codes", label: "Mã kích hoạt" },
  { key: "lessons", label: "Bài học" },
  { key: "math-questions", label: "Câu hỏi toán" },
  { key: "flashcards", label: "Thẻ học" },
  { key: "badges", label: "Huy hiệu" },
  { key: "daily-missions", label: "Nhiệm vụ hàng ngày" },
  { key: "audit-logs", label: "Nhật ký hệ thống" }
];

export function ResourcePage() {
  const { resource = "users" } = useParams();
  const title = resources.find((item: any) => item.key === resource)?.label ?? resource;
  const [items, setItems] = useState<AnyRecord[]>([]);
  const [selected, setSelected] = useState<AnyRecord | null>(null);
  const [json, setJson] = useState("{}");
  const [error, setError] = useState("");
  const readOnly = resource === "audit-logs";

  const columns = useMemo(() => {
    const keys = new Set<string>();
    items.slice(0, 20).forEach((item) => Object.keys(item).slice(0, 8).forEach((key) => keys.add(key)));
    return [...keys];
  }, [items]);

  async function load() {
    setError("");
    try {
      const res = await adminApi.list(resource);
      setItems(res.data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load data");
    }
  }

  useEffect(() => {
    setSelected(null);
    setJson("{}");
    load();
  }, [resource]);

  function edit(item: AnyRecord) {
    setSelected(item);
    const copy = { ...item };
    delete copy.id;
    delete copy.createdAt;
    delete copy.updatedAt;
    setJson(JSON.stringify(copy, null, 2));
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    const payload = JSON.parse(json);
    if (selected?.id) {
      await adminApi.update(resource, String(selected.id), payload);
    } else {
      await adminApi.create(resource, payload);
    }
    setSelected(null);
    setJson("{}");
    await load();
  }

  async function remove(item: AnyRecord) {
    if (!item.id) return;
    await adminApi.remove(resource, String(item.id));
    await load();
  }

  return (
    <section className="page">
      <div className="page-head">
        <h1>{title}</h1>
        {!readOnly && <button onClick={() => { setSelected(null); setJson("{}"); }}>New</button>}
      </div>
      {error && <p className="error">{error}</p>}
      <div className="admin-grid">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {columns.map((column) => <th key={column}>{column}</th>)}
                {!readOnly && <th />}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={String(item.id ?? JSON.stringify(item))}>
                  {columns.map((column) => <td key={column}>{format(item[column])}</td>)}
                  {!readOnly && (
                    <td className="actions">
                      <button onClick={() => edit(item)}>Edit</button>
                      <button onClick={() => remove(item)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!readOnly && (
          <form className="editor" onSubmit={save}>
            <h2>{selected ? "Edit JSON" : "Create JSON"}</h2>
            <textarea value={json} onChange={(event) => setJson(event.target.value)} spellCheck={false} />
            <button>Save</button>
          </form>
        )}
      </div>
    </section>
  );
}

function format(value: unknown) {
  if (value == null) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
