import { useEffect, useState } from "react";
import { adminApi } from "../api/adminApi";
import { TableControls } from "../components/TableControls";
import { ToggleSwitch } from "../components/ToggleSwitch";
import QRCode from "qrcode";
import type { ActivationType, ActivationSource } from "../types/firebaseModels";
import { ACTIVATION_TYPE_LABELS, uiLabel } from "../utils/adminLabels";
import { useTableControls } from "../utils/tableControls";

const ACTIVATION_TYPES: ActivationType[] = ["NPC", "LESSON", "PATH", "REWARD", "PHYSICAL_TOY"];
const SOURCES: ActivationSource[] = ["QR", "NFC", "MANUAL"];

const TYPE_LABELS: Record<string, string> = {
  ...ACTIVATION_TYPE_LABELS
};

function generateRandomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "HA-";
  for (let i = 0; i < 8; i++) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

function toDateInputString(value: any): string {
  if (!value) return "";
  let date: Date;
  if (typeof value.toDate === "function") {
    date = value.toDate();
  } else if (value instanceof Date) {
    date = value;
  } else {
    date = new Date(value);
  }
  if (isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function formatExpiration(value: any) {
  if (!value) return "Không giới hạn";
  let date: Date;
  if (typeof value.toDate === "function") {
    date = value.toDate();
  } else if (value instanceof Date) {
    date = value;
  } else {
    date = new Date(value);
  }
  if (isNaN(date.getTime())) return "Không giới hạn";
  return date.toLocaleDateString("vi-VN");
}

export function ActivationCodesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [npcs, setNpcs] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [paths, setPaths] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);
  const [qrPreviewCode, setQrPreviewCode] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  const [code, setCode] = useState("");
  const [activationType, setActivationType] = useState<ActivationType>("NPC");
  const [targetId, setTargetId] = useState("");
  const [label, setLabel] = useState("");
  const [active, setActive] = useState(true);
  const [maxUses, setMaxUses] = useState<number | "">("");
  const [perUserLimit, setPerUserLimit] = useState<number | "">("");
  const [source, setSource] = useState<ActivationSource>("QR");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function loadData() {
    setLoading(true);
    try {
      const [acRes, nRes, lRes, lpRes, bRes] = await Promise.all([
        adminApi.list("/activation-codes"),
        adminApi.list("/npcs"), adminApi.list("/lessons"),
        adminApi.list("/learning-paths"), adminApi.list("/badges")
      ]);
      setItems(acRes.data.data || []);
      setNpcs(nRes.data.data || []);
      setLessons(lRes.data.data || []);
      setPaths(lpRes.data.data || []);
      setBadges(bRes.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? items.filter((i) => i.code?.toLowerCase().includes(q) || i.label?.toLowerCase().includes(q)) : items);
  }, [items, search]);

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3000); };
  const table = useTableControls(filtered, [
    { value: "code", label: "Mã", getValue: (item) => item.code },
    { value: "label", label: "Nhãn", getValue: (item) => item.label },
    { value: "type", label: "Loại", getValue: (item) => TYPE_LABELS[item.activationType] || item.activationType },
    { value: "source", label: "Nguồn", getValue: (item) => item.source },
    { value: "expires", label: "Hạn dùng", getValue: (item) => item.expiresAt },
    { value: "used", label: "Đã dùng", getValue: (item) => item.usedCount || 0 },
    { value: "status", label: "Trạng thái", getValue: (item) => item.active !== false }
  ], "code");

  const targetOptions = (): { value: string; label: string }[] => {
    if (activationType === "NPC") return npcs.map((n) => ({ value: n.id, label: n.name }));
    if (activationType === "LESSON") return lessons.map((l) => ({ value: l.id, label: l.title }));
    if (activationType === "PATH") return paths.map((p) => ({ value: p.id, label: p.title }));
    if (activationType === "REWARD") return badges.map((b) => ({ value: b.id, label: b.name }));
    return [];
  };

  const getTargetLabel = (type: string, id: string) => {
    if (type === "NPC") return npcs.find((n) => n.id === id)?.name || id;
    if (type === "LESSON") return lessons.find((l) => l.id === id)?.title || id;
    if (type === "PATH") return paths.find((p) => p.id === id)?.title || id;
    if (type === "REWARD") return badges.find((b) => b.id === id)?.name || id;
    return id || "—";
  };

  const openAddModal = () => {
    setEditingItem(null); setCode(generateRandomCode());
    setActivationType("NPC"); setTargetId(""); setLabel("");
    setActive(true); setMaxUses(""); setPerUserLimit("");
    setSource("QR"); setExpiresAt(""); setErrors({}); setQrPreviewUrl(null); setQrPreviewCode("");
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item); setCode(item.code || "");
    setActivationType(item.activationType || "NPC"); setTargetId(item.targetId || "");
    setLabel(item.label || ""); setActive(item.active !== false);
    setMaxUses(item.maxUses ?? ""); setPerUserLimit(item.perUserLimit ?? "");
    setSource(item.source || "QR"); setExpiresAt(item.expiresAt ? toDateInputString(item.expiresAt) : "");
    setErrors({}); setQrPreviewUrl(null); setQrPreviewCode("");
    setIsModalOpen(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!code.trim()) errs.code = "Mã không được để trống.";
    if (!editingItem) {
      const dup = items.find((i) => i.code?.toLowerCase() === code.trim().toLowerCase());
      if (dup) errs.code = "Mã đã tồn tại.";
    }
    if (!label.trim()) errs.label = "Nhãn không được để trống.";
    if (activationType !== "PHYSICAL_TOY" && !targetId) errs.targetId = "Vui lòng chọn đối tượng.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const payload: any = {
      code: code.trim(), activationType, targetId: targetId || null,
      label: label.trim(), active, source,
      maxUses: maxUses === "" ? null : Number(maxUses),
      perUserLimit: perUserLimit === "" ? null : Number(perUserLimit),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      usedCount: editingItem?.usedCount ?? 0
    };
    try {
      if (editingItem) await adminApi.update("/activation-codes", editingItem.id, payload);
      else await adminApi.create("/activation-codes", payload);
      setIsModalOpen(false);
      showToast(editingItem ? "Cập nhật thành công!" : "Tạo mới thành công!");
      loadData();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa mã QR mở khóa này?")) return;
    await adminApi.remove("/activation-codes", id); showToast("Đã xóa!"); loadData();
  };

  const generateQR = async (codeStr: string) => {
    try {
      const url = await QRCode.toDataURL(codeStr, { width: 256, margin: 2 });
      setQrPreviewUrl(url);
      setQrPreviewCode(codeStr);
    } catch (e) { console.error(e); }
  };

  const downloadQR = async (codeStr: string) => {
    try {
      const canvas = document.createElement("canvas");
      await QRCode.toCanvas(canvas, codeStr, { width: 512, margin: 2 });
      const link = document.createElement("a");
      link.download = `qr-${codeStr}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) { console.error(e); }
  };

  const copyCode = (codeStr: string) => {
    navigator.clipboard.writeText(codeStr);
    showToast("Đã copy mã!");
  };

  const printQR = async (codeStr: string) => {
    const url = await QRCode.toDataURL(codeStr, { width: 512, margin: 2 });
    const win = window.open("", "_blank", "width=520,height=640");
    if (!win) return;
    win.document.write(`<html><head><title>QR ${codeStr}</title></head><body style="font-family:sans-serif;text-align:center;padding:32px"><h2>${codeStr}</h2><img src="${url}" width="360" height="360" /><script>window.onload=()=>window.print()</script></body></html>`);
    win.document.close();
  };

  return (
    <div>
      <div className="toolbar">
        <div>
          <h1>Mã QR mở khóa</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "4px" }}>Tạo mã QR để mở khóa nhân vật hoặc nội dung. Hiện tại hỗ trợ mở khóa nhân vật.</p>
        </div>
        <button onClick={openAddModal}>➕ Thêm mã QR</button>
      </div>

      <div className="panel" style={{ background: "#fffbeb", border: "1px solid #fef3c7", color: "#92400e", padding: "14px 16px", marginBottom: "16px" }}>
        <strong>Lưu ý:</strong> Hiện tại app chỉ mở khóa thật Mascot. Bài học/Lộ trình/Đồ chơi đang ở trạng thái chuẩn bị.
      </div>

      <div className="panel" style={{ padding: "16px", marginBottom: "16px" }}>
        <input type="text" placeholder="Tìm kiếm mã..." value={search} onChange={(e) => setSearch(e.target.value)} className="search-input" />
      </div>

      {loading ? <p>Đang tải dữ liệu...</p> : filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎫</div>
          <h3 style={{ margin: "0 0 8px 0", color: "var(--text-main)", fontWeight: "700" }}>Chưa có mã QR mở khóa nào</h3>
          <p style={{ color: "var(--text-muted)", margin: "0 0 16px 0", fontSize: "14px" }}>
            Mã QR giúp mở khóa mascot hoặc nội dung khi trẻ quét mã.
          </p>
          <button onClick={openAddModal}>➕ Tạo mã QR mới</button>
        </div>
      ) : (
        <>
        <TableControls {...table} />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Nhãn</th>
                <th>Loại</th>
                <th>Đối tượng</th>
                <th>Nguồn</th>
                <th>Hạn dùng</th>
                <th>Đã dùng</th>
                <th style={{ width: "100px" }}>Trạng thái</th>
                <th style={{ width: "200px" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {table.pagedItems.map((item) => (
                <tr key={item.id}>
                  <td><code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px", fontSize: "12px", fontWeight: "700" }}>{item.code}</code></td>
                  <td style={{ fontWeight: "600" }}>{item.label || "—"}</td>
                  <td><span className="badge info">{TYPE_LABELS[item.activationType] || item.activationType}</span></td>
                  <td style={{ fontSize: "13px" }}>{getTargetLabel(item.activationType, item.targetId)}</td>
                  <td><span className="badge yellow">{uiLabel(item.source || "QR")}</span></td>
                  <td>{formatExpiration(item.expiresAt)}</td>
                  <td style={{ fontWeight: "600" }}>{item.usedCount || 0}{item.maxUses ? `/${item.maxUses}` : ""}</td>
                  <td><span className={`badge ${item.active !== false ? "active" : "inactive"}`}>{item.active !== false ? "Đang bật" : "Đang tắt"}</span></td>
                  <td>
                    <div className="actions">
                      <button className="secondary icon-button" onClick={() => generateQR(item.code)} title="Xem QR" aria-label={`Xem QR ${item.code}`}>
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <rect x="4" y="4" width="6" height="6" rx="1" />
                          <rect x="14" y="4" width="6" height="6" rx="1" />
                          <rect x="4" y="14" width="6" height="6" rx="1" />
                          <path d="M14 14h2v2h-2zM18 14h2M14 18h6" />
                        </svg>
                      </button>
                      <button className="secondary" onClick={() => openEditModal(item)}>Sửa</button>
                      <button className="danger" onClick={() => handleDelete(item.id)}>Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {qrPreviewUrl && !isModalOpen && (
        <div className="modal-overlay" onClick={() => setQrPreviewUrl(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "min(420px, 95vw)" }}>
            <div className="modal-header">
              <h2>Xem QR</h2>
              <button className="modal-close" onClick={() => setQrPreviewUrl(null)}>&times;</button>
            </div>
            <div className="modal-body" style={{ textAlign: "center" }}>
              <div className="qr-detail-box">
                <img src={qrPreviewUrl} alt={`QR ${qrPreviewCode}`} />
                <code>{qrPreviewCode}</code>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => copyCode(qrPreviewCode)}>Copy mã</button>
              <button type="button" className="secondary" onClick={() => downloadQR(qrPreviewCode)}>Tải QR PNG</button>
              <button type="button" onClick={() => printQR(qrPreviewCode)}>In QR</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "min(620px, 95vw)" }}>
            <div className="modal-header">
              <h2>{editingItem ? "Chỉnh sửa mã QR mở khóa" : "Thêm mã QR mở khóa"}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div className="field">
                      <label>Mã mở khóa <span style={{ color: "red" }}>*</span></label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input type="text" placeholder="HA-XXXXXXXX" value={code} onChange={(e) => setCode(e.target.value)} style={{ flex: 1, fontFamily: "monospace", fontWeight: "700" }} disabled={!!editingItem} />
                        {!editingItem && <button type="button" className="secondary" onClick={() => setCode(generateRandomCode())}>🎲 Tạo mã</button>}
                      </div>
                      {errors.code && <span className="error-msg">{errors.code}</span>}
                    </div>

                    <div className="field">
                      <label>Nhãn mô tả <span style={{ color: "red" }}>*</span></label>
                      <input type="text" placeholder="VD: QR Mèo Mimi - Sách trang 10" value={label} onChange={(e) => setLabel(e.target.value)} />
                      {errors.label && <span className="error-msg">{errors.label}</span>}
                    </div>

                    <div className="form-grid">
                      <div className="field">
                        <label>Loại mở khóa</label>
                        <select value={activationType} onChange={(e) => { setActivationType(e.target.value as ActivationType); setTargetId(""); }}>
                          {ACTIVATION_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                        </select>
                      </div>
                      <div className="field">
                        <label>Nguồn</label>
                        <select value={source} onChange={(e) => setSource(e.target.value as ActivationSource)}>
                          {SOURCES.map((s) => <option key={s} value={s}>{uiLabel(s)}</option>)}
                        </select>
                      </div>
                    </div>

                    {activationType !== "PHYSICAL_TOY" && (
                      <div className="field">
                        <label>Đối tượng <span style={{ color: "red" }}>*</span></label>
                        <select value={targetId} onChange={(e) => setTargetId(e.target.value)}>
                          <option value="">-- Chọn --</option>
                          {targetOptions().map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        {errors.targetId && <span className="error-msg">{errors.targetId}</span>}
                      </div>
                    )}

                    <div className="form-grid">
                      <div className="field">
                        <label>Số lần dùng tối đa</label>
                        <input type="number" min={0} placeholder="Không giới hạn" value={maxUses} onChange={(e) => setMaxUses(e.target.value === "" ? "" : Number(e.target.value))} />
                      </div>
                      <div className="field">
                        <label>Giới hạn mỗi người dùng</label>
                        <input type="number" min={0} placeholder="Không giới hạn" value={perUserLimit} onChange={(e) => setPerUserLimit(e.target.value === "" ? "" : Number(e.target.value))} />
                      </div>
                    </div>

                    <div className="field">
                      <label>Ngày hết hạn</label>
                      <div className="date-input-wrap">
                        <span aria-hidden="true">📅</span>
                        <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
                        {expiresAt && (
                          <button type="button" className="secondary" onClick={() => setExpiresAt("")}>Bỏ hạn</button>
                        )}
                      </div>
                      <span className="field-help">Để trống nếu mã không có ngày hết hạn.</span>
                    </div>

                    <div className="field">
                      <ToggleSwitch id="acActive" label="Đang hoạt động" checked={active} onChange={setActive} />
                    </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
                <button type="submit">{editingItem ? "Cập nhật" : "Tạo mới"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMsg && <div className="toast"><span>✨</span> {toastMsg}</div>}
    </div>
  );
}
