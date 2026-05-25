import { useEffect, useState } from "react";
import { adminApi } from "../api/adminApi";
import { ToggleSwitch } from "../components/ToggleSwitch";
import { CSVImportModal } from "../components/import/CSVImportModal";
import { npcsImportConfig } from "../components/import/importConfigs";
import { MediaPicker } from "../components/MediaPicker";
import { batchImport } from "../services/batchImportService";
import { downloadExcelTemplate, toExcelTemplateFilename } from "../utils/csv";

interface NPC {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  animationUrl?: string;
  defaultDialogue: string;
  isActive: boolean;
}

export function NPCsPage() {
  const [items, setItems] = useState<NPC[]>([]);
  const [filtered, setFiltered] = useState<NPC[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<NPC | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [showPickerFor, setShowPickerFor] = useState<"image" | "animation" | null>(null);
  const [toastMsg, setToastMsg] = useState("");

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [animationUrl, setAnimationUrl] = useState("");
  const [defaultDialogue, setDefaultDialogue] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function loadData() {
    setLoading(true);
    try {
      const res = await adminApi.list("/npcs");
      setItems(res.data.data || []);
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
      setFiltered(items.filter((item) => item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)));
    } else {
      setFiltered(items);
    }
  }, [items, search]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setName("");
    setDescription("");
    setImageUrl("");
    setAnimationUrl("");
    setDefaultDialogue("");
    setIsActive(true);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item: NPC) => {
    setEditingItem(item);
    setName(item.name || "");
    setDescription(item.description || "");
    setImageUrl(item.imageUrl || "");
    setAnimationUrl(item.animationUrl || "");
    setDefaultDialogue(item.defaultDialogue || "");
    setIsActive(item.isActive !== false);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const qrRes = await adminApi.list("/qr-codes");
      const qrSnap = (qrRes.data.data || []).filter((q: any) => q.targetId === id || q.npcId === id);
      if (qrSnap.length > 0) {
        alert(`Không thể xóa nhân vật này vì đang có ${qrSnap.length} mã QR được liên kết. Vui lòng cập nhật hoặc xóa các mã QR đó trước.`);
        return;
      }
      if (!window.confirm("Bạn có chắc chắn muốn xóa nhân vật này?")) return;
      await adminApi.remove("/npcs", id);
      loadData();
    } catch (e: any) {
      console.error(e);
      alert("Lỗi khi kiểm tra liên kết QR: " + (e.message || e));
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Tên nhân vật không được để trống.";
    if (!description.trim()) errs.description = "Mô tả không được để trống.";
    if (!imageUrl.trim()) errs.imageUrl = "Vui lòng chọn hình ảnh cho nhân vật.";
    if (!defaultDialogue.trim()) errs.defaultDialogue = "Lời thoại mặc định không được để trống.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: name.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      animationUrl: animationUrl.trim() || null,
      defaultDialogue: defaultDialogue.trim(),
      isActive
    };

    try {
      if (editingItem) {
        await adminApi.update("/npcs", editingItem.id, payload);
      } else {
        await adminApi.create("/npcs", payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const importConfig = npcsImportConfig(items);

  const handleImport = async (rows: any[]) => {
    await batchImport("npcs", rows);
    showToast(`Import CSV thành công ${rows.length} nhân vật.`);
    await loadData();
  };

  return (
    <div>
      <div className="toolbar">
        <div>
          <h1>Thư viện nhân vật</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "4px" }}>Kho nhân vật có thể tái sử dụng làm người đồng hành trong bài học và hoạt động mới.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="secondary" onClick={() => setIsImportOpen(true)}>Import</button>
          <button onClick={openAddModal}>➕ Thêm Nhân Vật</button>
        </div>
      </div>

      <div className="panel" style={{ padding: "16px", marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Tìm kiếm nhân vật..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <p>Đang tải danh sách nhân vật...</p>
      ) : filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "var(--text-muted)" }}>Không có nhân vật nào.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: "80px" }}>Ảnh</th>
                <th>Tên nhân vật</th>
                <th>Mô tả</th>
                <th>Thoại mặc định</th>
                <th style={{ width: "120px" }}>Trạng thái</th>
                <th style={{ width: "150px" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "8px", background: "#f1f5f9" }} />
                    ) : (
                      <div style={{ width: "48px", height: "48px", borderRadius: "8px", background: "#e2e8f0", display: "grid", placeItems: "center", fontSize: "20px" }}>🤖</div>
                    )}
                  </td>
                  <td style={{ fontWeight: "600" }}>{item.name}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: "13px" }}>{item.description}</td>
                  <td style={{ fontSize: "13px" }}>{item.defaultDialogue}</td>
                  <td>
                    <span className={`badge ${item.isActive ? "active" : "inactive"}`}>
                      {item.isActive ? "Hoạt động" : "Tạm khóa"}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button className="secondary" onClick={() => openEditModal(item)}>Sửa</button>
                      <button className="danger" onClick={() => handleDelete(item.id)}>Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "min(680px, 95vw)" }}>
            <div className="modal-header">
              <h2>{editingItem ? "Chỉnh sửa nhân vật" : "Thêm nhân vật"}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="drawer-container">
                  <div className="drawer-main" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div className="field">
                      <label>Tên nhân vật *</label>
                      <input
                        type="text"
                        placeholder="Mèo Mimi"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                      {errors.name && <span className="error-msg">{errors.name}</span>}
                    </div>

                    <div className="field">
                      <label>Mô tả nhân vật *</label>
                      <textarea
                        placeholder="Mô tả tính cách hoặc vai trò..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                      {errors.description && <span className="error-msg">{errors.description}</span>}
                      <span className="helper">Mô tả này giúp phụ huynh hiểu rõ hơn về nhân vật.</span>
                    </div>

                    <div className="field">
                      <label>Hình ảnh đại diện *</label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          type="text"
                          placeholder="Chọn từ thư viện hoặc dán link"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <button type="button" className="secondary" onClick={() => setShowPickerFor("image")}>Thư viện</button>
                      </div>
                      {errors.imageUrl && <span className="error-msg">{errors.imageUrl}</span>}
                      <span className="helper">Ảnh nhân vật sẽ hiển thị trong bộ sưu tập của trẻ.</span>
                    </div>

                    <div className="field">
                      <label>Đường dẫn hoạt ảnh (Tùy chọn)</label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          type="text"
                          placeholder="Lottie JSON hoặc Gif URL"
                          value={animationUrl}
                          onChange={(e) => setAnimationUrl(e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <button type="button" className="secondary" onClick={() => setShowPickerFor("animation")}>Thư viện</button>
                      </div>
                      <span className="helper">Hoạt ảnh khi tương tác hoặc vẫy chào.</span>
                    </div>

                    <div className="field">
                      <label>Thoại mặc định *</label>
                      <textarea
                        placeholder="Xin chào bạn nhỏ! Mình là Mimi..."
                        value={defaultDialogue}
                        onChange={(e) => setDefaultDialogue(e.target.value)}
                      />
                      {errors.defaultDialogue && <span className="error-msg">{errors.defaultDialogue}</span>}
                      <span className="helper">Lời thoại mặc định là câu thoại ngắn đầu tiên khi trẻ tương tác.</span>
                    </div>

                    <div className="field">
                      <ToggleSwitch id="isActive" label="Nhân vật này đang hoạt động" checked={isActive} onChange={setIsActive} />
                    </div>
                  </div>

                  {/* Character visual preview panel */}
                  <div className="drawer-aside" style={{ width: "240px" }}>
                    <h3>Mô phỏng nhân vật</h3>
                    <div style={{ border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden", marginTop: "12px", background: "#f8fafc", textAlign: "center" }}>
                      <div style={{ height: "150px", background: "#eff6ff", display: "grid", placeItems: "center" }}>
                        {imageUrl ? (
                          <img src={imageUrl} alt="Mascot Preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        ) : (
                          <span style={{ fontSize: "48px" }}>🤖</span>
                        )}
                      </div>
                      <div style={{ padding: "12px", textAlign: "left" }}>
                        <strong style={{ display: "block", fontSize: "14px" }}>{name || "Tên nhân vật"}</strong>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", lineHeight: "1.4" }}>
                          {defaultDialogue ? `💬 "${defaultDialogue}"` : "💬 Chưa có câu thoại mặc định."}
                        </p>
                      </div>
                    </div>
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

      {/* Media Pickers */}
      {showPickerFor === "image" && (
        <MediaPicker
          category="NPC"
          type="IMAGE"
          currentValue={imageUrl}
          onSelect={(url) => setImageUrl(url)}
          onClose={() => setShowPickerFor(null)}
        />
      )}
      {showPickerFor === "animation" && (
        <MediaPicker
          category="NPC"
          type="IMAGE"
          currentValue={animationUrl}
          onSelect={(url) => setAnimationUrl(url)}
          onClose={() => setShowPickerFor(null)}
        />
      )}

      <CSVImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        {...importConfig}
        onImport={handleImport}
        onRefresh={loadData}
      />

      {toastMsg && <div className="toast"><span>✨</span> {toastMsg}</div>}
    </div>
  );
}
