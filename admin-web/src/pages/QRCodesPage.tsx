import { useEffect, useRef, useState } from "react";
import QRCodeLib from "qrcode";
import { adminApi } from "../api/adminApi";
import { CSVImportModal } from "../components/import/CSVImportModal";
import { qrCodesImportConfig } from "../components/import/importConfigs";
import { batchImport } from "../services/batchImportService";
import { downloadExcelTemplate, toExcelTemplateFilename } from "../utils/csv";

interface NPC {
  id: string;
  name: string;
  imageUrl: string;
}

interface QRCodeRecord {
  id: string;
  code: string;
  label: string;
  npcId: string;
  maxUses?: number | null;
  usedCount: number;
  isActive: boolean;
}

export function QRCodesPage() {
  const [items, setItems] = useState<QRCodeRecord[]>([]);
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [filtered, setFiltered] = useState<QRCodeRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Modal & Edit states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<QRCodeRecord | null>(null);
  const [previewCode, setPreviewCode] = useState<QRCodeRecord | null>(null);

  // Form states
  const [label, setLabel] = useState("");
  const [code, setCode] = useState("");
  const [npcId, setNpcId] = useState("");
  const [maxUses, setMaxUses] = useState<number | "">("");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toastMsg, setToastMsg] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [qrRes, npcRes] = await Promise.all([
        adminApi.list("/qr-codes"),
        adminApi.list("/npcs")
      ]);
      setItems(qrRes.data.data || []);
      setNpcs(npcRes.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (search.trim()) {
      const q = search.toLowerCase();
      setFiltered(items.filter((item) => item.label.toLowerCase().includes(q) || item.code.toLowerCase().includes(q)));
    } else {
      setFiltered(items);
    }
  }, [items, search]);

  // Render QR Code onto canvas in side-drawer or dialog
  useEffect(() => {
    if (previewCode && canvasRef.current) {
      QRCodeLib.toCanvas(
        canvasRef.current,
        previewCode.code,
        { width: 220, margin: 2, color: { dark: "#0f172a", light: "#ffffff" } },
        (error) => {
          if (error) console.error(error);
        }
      );
    }
  }, [previewCode]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleGenerateCode = () => {
    const randomHex = Math.floor(100000 + Math.random() * 900000);
    setCode(`NPC_QR_${randomHex}`);
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Đã sao chép mã QR vào clipboard!");
  };

  const handleDownloadQR = () => {
    if (!canvasRef.current || !previewCode) return;
    const url = canvasRef.current.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `QR-${previewCode.label.replace(/\s+/g, "_")}-${previewCode.code}.png`;
    link.href = url;
    link.click();
    showToast("Tải ảnh QR thành công!");
  };

  const handlePrintQR = () => {
    if (!canvasRef.current || !previewCode) return;
    const url = canvasRef.current.toDataURL("image/png");
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    const npcName = npcs.find((n) => n.id === previewCode.npcId)?.name || "Nhân vật";

    printWindow.document.write(`
      <html>
        <head>
          <title>In mã QR: ${previewCode.label}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 40px; }
            .card { border: 2px solid #333; border-radius: 12px; padding: 20px; display: inline-block; }
            img { width: 250px; height: 250px; }
            h2 { margin: 10px 0 5px; color: #111; }
            p { margin: 0; color: #666; font-size: 14px; font-weight: bold; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="card">
            <h2>${previewCode.label}</h2>
            <img src="${url}" />
            <p>Mã: ${previewCode.code}</p>
            <p>Nhân vật: ${npcName}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const openAddModal = () => {
    setEditingItem(null);
    setLabel("");
    setCode("");
    setNpcId(npcs[0]?.id || "");
    setMaxUses("");
    setIsActive(true);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item: QRCodeRecord) => {
    setEditingItem(item);
    setLabel(item.label || "");
    setCode(item.code || "");
    setNpcId(item.npcId || "");
    setMaxUses(item.maxUses ?? "");
    setIsActive(item.isActive !== false);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa mã QR này?")) return;
    await adminApi.remove("/qr-codes", id);
    loadData();
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!label.trim()) errs.label = "Nhãn nhãn dán không được để trống.";
    if (!code.trim()) errs.code = "Mã code QR không được để trống.";
    if (!npcId) errs.npcId = "Vui lòng chọn nhân vật liên kết.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      label: label.trim(),
      code: code.trim(),
      npcId,
      maxUses: maxUses === "" ? null : Number(maxUses),
      isActive
    };

    try {
      if (editingItem) {
        await adminApi.update("/qr-codes", editingItem.id, payload);
      } else {
        await adminApi.create("/qr-codes", payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const getNpcInfo = (id: string) => {
    return npcs.find((n) => n.id === id);
  };

  const importConfig = qrCodesImportConfig(npcs, items);

  const handleImport = async (rows: any[]) => {
    await batchImport("qrCodes", rows);
    showToast(`Import CSV thành công ${rows.length} mã QR.`);
    await loadData();
  };

  return (
    <div>
      <div className="toolbar">
        <h1>Mã QR Đồ Chơi/Thẻ Học</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="secondary" onClick={() => downloadExcelTemplate(toExcelTemplateFilename(importConfig.templateFilename), importConfig.templateHeaders, importConfig.templateExampleRows)}>Tải mẫu Excel</button>
          <button className="secondary" onClick={() => setIsImportOpen(true)}>Import CSV</button>
          <button onClick={openAddModal}>➕ Thêm Mã QR</button>
        </div>
      </div>

      <div className="panel" style={{ padding: "16px", marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Tìm kiếm mã QR theo nhãn hoặc code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <p>Đang tải danh sách mã QR...</p>
      ) : filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "var(--text-muted)" }}>Không có mã QR nào.</p>
        </div>
      ) : (
        <div className="drawer-container">
          <div className="drawer-main">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nhãn thẻ/đồ chơi</th>
                    <th>Mã định danh</th>
                    <th>Nhân vật liên kết</th>
                    <th>Lượt dùng</th>
                    <th style={{ width: "110px" }}>Trạng thái</th>
                    <th style={{ width: "230px" }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => {
                    const npc = getNpcInfo(item.npcId);
                    return (
                      <tr key={item.id} style={{ cursor: "pointer" }} onClick={() => setPreviewCode(item)}>
                        <td style={{ fontWeight: "600" }}>{item.label}</td>
                        <td>
                          <code style={{ background: "#f1f5f9", padding: "4px 8px", borderRadius: "4px", fontSize: "12px" }}>{item.code}</code>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {npc?.imageUrl && <img src={npc.imageUrl} alt="" style={{ width: "24px", height: "24px", borderRadius: "4px", objectFit: "cover" }} />}
                            <span style={{ fontSize: "13px" }}>{npc?.name || "Không rõ"}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: "13px" }}>
                          <strong>{item.usedCount ?? 0}</strong> / {item.maxUses ?? "∞"}
                        </td>
                        <td>
                          <span className={`badge ${item.isActive ? "active" : "inactive"}`}>
                            {item.isActive ? "Hoạt động" : "Tạm khóa"}
                          </span>
                        </td>
                        <td>
                          <div className="actions" onClick={(e) => e.stopPropagation()}>
                            <button className="secondary" onClick={() => setPreviewCode(item)}>Xem QR</button>
                            <button className="secondary" onClick={() => openEditModal(item)}>Sửa</button>
                            <button className="danger" onClick={() => handleDelete(item.id)}>Xóa</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* QR Preview Side Drawer */}
          {previewCode && (
            <div className="drawer-aside" style={{ width: "280px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "10px", marginBottom: "12px" }}>
                <h3 style={{ margin: 0, fontSize: "16px" }}>Bản In QR Code</h3>
                <button className="modal-close" onClick={() => setPreviewCode(null)} style={{ fontSize: "16px", width: "24px", height: "24px" }}>&times;</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", textAlign: "center" }}>
                <strong style={{ fontSize: "15px", color: "#0f172a" }}>{previewCode.label}</strong>
                <canvas ref={canvasRef} style={{ border: "1px solid var(--border)", borderRadius: "8px", background: "white", padding: "8px" }}></canvas>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%", marginTop: "10px" }}>
                  <button onClick={handlePrintQR}>🖨️ In nhãn QR</button>
                  <button className="secondary" onClick={handleDownloadQR}>💾 Tải xuống PNG</button>
                  <button className="secondary" onClick={() => handleCopyCode(previewCode.code)}>📋 Copy Code</button>
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px", textAlign: "left", width: "100%" }}>
                  <p>• Code: <code>{previewCode.code}</code></p>
                  <p>• Nhân vật: {getNpcInfo(previewCode.npcId)?.name || "Chưa gắn"}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "min(500px, 95vw)" }}>
            <div className="modal-header">
              <h2>{editingItem ? "Chỉnh sửa mã QR cũ" : "Thêm mã QR cũ"}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="field">
                  <label>Nhãn dán QR *</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Thẻ đồ chơi Mèo Mimi"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                  />
                  {errors.label && <span className="error-msg">{errors.label}</span>}
                  <span className="helper">Tên mô tả nhãn dán dán trên đồ chơi hoặc flashcard vật lý.</span>
                </div>

                <div className="field">
                  <label>Mã định danh QR *</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      placeholder="Mã code (Ví dụ: NHANVAT_MIMI_01)"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button type="button" className="secondary" onClick={handleGenerateCode}>Sinh mã</button>
                  </div>
                  {errors.code && <span className="error-msg">{errors.code}</span>}
                  <span className="helper">Mã này sẽ được mã hóa vào hình QR. Bấm "Sinh mã" để tự tạo ngẫu nhiên.</span>
                </div>

                <div className="field">
                  <label>Nhân vật liên kết *</label>
                  <select value={npcId} onChange={(e) => setNpcId(e.target.value)}>
                    <option value="">-- Chọn nhân vật --</option>
                    {npcs.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name}
                      </option>
                    ))}
                  </select>
                  {errors.npcId && <span className="error-msg">{errors.npcId}</span>}
                  <span className="helper">Khi quét QR này, trẻ sẽ mở khóa nhân vật tương ứng.</span>
                </div>

                <div className="field">
                  <label>Lượt sử dụng tối đa (Tùy chọn)</label>
                  <input
                    type="number"
                    placeholder="Không giới hạn"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                  <span className="helper">Giới hạn số lần quét mã. Để trống nếu muốn cho phép quét vô hạn.</span>
                </div>

                <div className="field check-row">
                  <input
                    type="checkbox"
                    id="isActiveQR"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <label htmlFor="isActiveQR" style={{ fontWeight: "normal", cursor: "pointer" }}>Mã QR này đang hoạt động</label>
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

      <CSVImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        {...importConfig}
        onImport={handleImport}
        onRefresh={loadData}
      />

      {/* Toast Alert */}
      {toastMsg && <div className="toast"><span>✨</span> {toastMsg}</div>}
    </div>
  );
}
