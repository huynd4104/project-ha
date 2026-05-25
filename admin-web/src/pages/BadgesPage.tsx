import { useEffect, useState } from "react";
import { adminApi } from "../api/adminApi";
import { TableControls } from "../components/TableControls";
import { ToggleSwitch } from "../components/ToggleSwitch";
import { CSVImportModal } from "../components/import/CSVImportModal";
import { badgesImportConfig } from "../components/import/importConfigs";
import { MediaPicker } from "../components/MediaPicker";
import { batchImport } from "../services/batchImportService";
import { downloadExcelTemplate, toExcelTemplateFilename } from "../utils/csv";
import { useTableControls } from "../utils/tableControls";

interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  type: "LESSON" | "STREAK" | "XP" | "NPC" | "MISSION";
  conditionType: "COMPLETE_LESSONS" | "STREAK_DAYS" | "TOTAL_XP" | "UNLOCK_NPCS" | "COMPLETE_DAILY_MISSIONS";
  conditionValue: number;
  isActive: boolean;
}

const BADGE_TYPE_LABELS: Record<string, string> = {
  LESSON: "Bài học",
  STREAK: "streak",
  XP: "XP",
  NPC: "Nhân vật đồng hành",
  MISSION: "Nhiệm vụ"
};

const CONDITION_TYPE_LABELS: Record<string, string> = {
  COMPLETE_LESSONS: "Hoàn thành bài học",
  STREAK_DAYS: "Số ngày streak",
  TOTAL_XP: "Tổng số điểm XP",
  UNLOCK_NPCS: "Mở khóa nhân vật đồng hành",
  COMPLETE_DAILY_MISSIONS: "Hoàn thành nhiệm vụ ngày"
};

export function BadgesPage() {
  const [items, setItems] = useState<Badge[]>([]);
  const [filtered, setFiltered] = useState<Badge[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Badge | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [type, setType] = useState<Badge["type"]>("LESSON");
  const [conditionType, setConditionType] = useState<Badge["conditionType"]>("COMPLETE_LESSONS");
  const [conditionValue, setConditionValue] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function loadData() {
    setLoading(true);
    try {
      const res = await adminApi.list("/badges");
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
  const table = useTableControls(filtered, [
    { value: "name", label: "Tên huy hiệu", getValue: (item) => item.name },
    { value: "type", label: "Phân loại", getValue: (item) => item.type },
    { value: "condition", label: "Yêu cầu đạt", getValue: (item) => item.conditionValue },
    { value: "status", label: "Trạng thái", getValue: (item) => item.isActive !== false }
  ], "name");

  const openAddModal = () => {
    setEditingItem(null);
    setName("");
    setDescription("");
    setIconUrl("");
    setType("LESSON");
    setConditionType("COMPLETE_LESSONS");
    setConditionValue(1);
    setIsActive(true);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item: Badge) => {
    setEditingItem(item);
    setName(item.name || "");
    setDescription(item.description || "");
    setIconUrl(item.iconUrl || "");
    setType(item.type || "LESSON");
    setConditionType(item.conditionType || "COMPLETE_LESSONS");
    setConditionValue(item.conditionValue || 1);
    setIsActive(item.isActive !== false);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa huy hiệu này?")) return;
    try {
      await adminApi.remove("/badges", id);
      loadData();
    } catch (e: any) {
      console.error(e);
      alert("Lỗi khi xóa huy hiệu: " + (e.message || e));
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Tên huy hiệu không được để trống.";
    if (!description.trim()) errs.description = "Mô tả không được để trống.";
    if (!iconUrl.trim()) errs.iconUrl = "Vui lòng chọn hoặc nhập icon huy hiệu.";
    if (conditionValue < 1) errs.conditionValue = "Giá trị điều kiện phải lớn hơn hoặc bằng 1.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: name.trim(),
      description: description.trim(),
      iconUrl: iconUrl.trim(),
      type,
      conditionType,
      conditionValue: Number(conditionValue),
      isActive
    };

    try {
      if (editingItem) {
        await adminApi.update("/badges", editingItem.id, payload);
      } else {
        await adminApi.create("/badges", payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const importConfig = badgesImportConfig(items);

  const handleImport = async (rows: any[]) => {
    await batchImport("badges", rows);
    showToast(`Import CSV thành công ${rows.length} huy hiệu.`);
    await loadData();
  };

  return (
    <div>
      <div className="toolbar">
        <h1>Huy Hiệu Học Tập</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="secondary" onClick={() => downloadExcelTemplate(toExcelTemplateFilename(importConfig.templateFilename), importConfig.templateHeaders, importConfig.templateExampleRows)}>Tải mẫu Excel</button>
          <button className="secondary" onClick={() => setIsImportOpen(true)}>Import CSV</button>
          <button onClick={openAddModal}>➕ Thêm Huy Hiệu</button>
        </div>
      </div>

      <div className="panel" style={{ padding: "16px", marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Tìm kiếm huy hiệu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <p>Đang tải danh sách huy hiệu...</p>
      ) : filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "var(--text-muted)" }}>Không có huy hiệu nào.</p>
        </div>
      ) : (
        <>
        <TableControls {...table} />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: "80px" }}>Biểu tượng</th>
                <th>Tên huy hiệu</th>
                <th>Mô tả</th>
                <th>Phân loại</th>
                <th>Kiểu điều kiện</th>
                <th>Yêu cầu đạt</th>
                <th style={{ width: "120px" }}>Trạng thái</th>
                <th style={{ width: "150px" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {table.pagedItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.iconUrl ? (
                      <img src={item.iconUrl} alt={item.name} style={{ width: "40px", height: "40px", objectFit: "contain", borderRadius: "4px" }} />
                    ) : (
                      <div style={{ width: "40px", height: "40px", borderRadius: "4px", background: "#e2e8f0", display: "grid", placeItems: "center", fontSize: "18px" }}>🏅</div>
                    )}
                  </td>
                  <td style={{ fontWeight: "600" }}>{item.name}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: "13px" }}>{item.description}</td>
                  <td><span className="badge info">{BADGE_TYPE_LABELS[item.type] || item.type}</span></td>
                  <td>{CONDITION_TYPE_LABELS[item.conditionType] || item.conditionType}</td>
                  <td style={{ fontWeight: "bold" }}>{item.conditionValue}</td>
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
        </>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "min(680px, 95vw)" }}>
            <div className="modal-header">
              <h2>{editingItem ? "Chỉnh sửa huy hiệu" : "Thêm huy hiệu mới"}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="drawer-container">
                  <div className="drawer-main" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div className="field">
                      <label>Tên huy hiệu *</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Bước đầu tiên"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                      {errors.name && <span className="error-msg">{errors.name}</span>}
                    </div>

                    <div className="field">
                      <label>Mô tả nỗ lực *</label>
                      <textarea
                        placeholder="Ví dụ: Hoàn thành 1 bài học đầu tiên..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                      {errors.description && <span className="error-msg">{errors.description}</span>}
                    </div>

                    <div className="field">
                      <label>Biểu tượng huy hiệu (Icon URL) *</label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          type="text"
                          placeholder="Dán link hoặc chọn từ Media Library"
                          value={iconUrl}
                          onChange={(e) => setIconUrl(e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <button type="button" className="secondary" onClick={() => setShowMediaPicker(true)}>Thư viện</button>
                      </div>
                      {errors.iconUrl && <span className="error-msg">{errors.iconUrl}</span>}
                    </div>

                    <div className="field">
                      <label>Phân loại huy hiệu</label>
                      <select value={type} onChange={(e) => setType(e.target.value as any)}>
                        <option value="LESSON">Bài học</option>
                        <option value="STREAK">streak</option>
                        <option value="XP">XP</option>
                        <option value="NPC">Nhân vật đồng hành</option>
                        <option value="MISSION">Nhiệm vụ</option>
                      </select>
                    </div>

                    <div className="field">
                      <label>Kiểu điều kiện kích hoạt</label>
                      <select value={conditionType} onChange={(e) => setConditionType(e.target.value as any)}>
                        <option value="COMPLETE_LESSONS">Hoàn thành bài học</option>
                        <option value="STREAK_DAYS">Số ngày streak</option>
                        <option value="TOTAL_XP">Tổng số điểm XP</option>
                        <option value="UNLOCK_NPCS">Mở khóa nhân vật đồng hành</option>
                        <option value="COMPLETE_DAILY_MISSIONS">Hoàn thành nhiệm vụ ngày</option>
                      </select>
                    </div>

                    <div className="field">
                      <label>Giá trị yêu cầu đạt *</label>
                      <input
                        type="number"
                        min="1"
                        value={conditionValue}
                        onChange={(e) => setConditionValue(Number(e.target.value))}
                      />
                      {errors.conditionValue && <span className="error-msg">{errors.conditionValue}</span>}
                    </div>

                    <div className="field">
                      <ToggleSwitch id="isActive" label="Huy hiệu này đang hoạt động" checked={isActive} onChange={setIsActive} />
                    </div>
                  </div>

                  {/* Visual preview card */}
                  <div className="drawer-aside" style={{ width: "240px" }}>
                    <h3>Mô phỏng hiển thị</h3>
                    <div style={{ border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden", marginTop: "12px", background: "white", padding: "16px", textAlign: "center" }}>
                      <div style={{ width: "80px", height: "80px", margin: "0 auto 12px", background: "#f8fafc", borderRadius: "40px", display: "grid", placeItems: "center" }}>
                        {iconUrl ? (
                          <img src={iconUrl} alt="Badge Preview" style={{ width: "64px", height: "64px", objectFit: "contain" }} />
                        ) : (
                          <span style={{ fontSize: "36px" }}>🏅</span>
                        )}
                      </div>
                      <strong style={{ display: "block", fontSize: "14px", color: "var(--text-color)" }}>{name || "Tên huy hiệu"}</strong>
                      <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px", lineHeight: "1.4" }}>
                        {description || "Mô tả điều kiện để trẻ nhận được huy hiệu."}
                      </p>
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

      {showMediaPicker && (
        <MediaPicker
          type="IMAGE"
          currentValue={iconUrl}
          onSelect={(url) => setIconUrl(url)}
          onClose={() => setShowMediaPicker(false)}
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
