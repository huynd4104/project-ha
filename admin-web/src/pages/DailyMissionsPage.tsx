import { useEffect, useState } from "react";
import { adminApi } from "../api/adminApi";
import { TableControls } from "../components/TableControls";
import { ToggleSwitch } from "../components/ToggleSwitch";
import { CSVImportModal } from "../components/import/CSVImportModal";
import { dailyMissionsImportConfig } from "../components/import/importConfigs";
import { batchImport } from "../services/batchImportService";
import { downloadExcelTemplate, toExcelTemplateFilename } from "../utils/csv";
import { useTableControls } from "../utils/tableControls";

interface DailyMission {
  id: string;
  title: string;
  description: string;
  type: "COMPLETE_LESSON" | "REVIEW_FLASHCARD" | "SCAN_QR" | "COMPLETE_DIALOGUE" | "COMPLETE_MATH";
  targetValue: number;
  rewardXp: number;
  isActive: boolean;
}

export function DailyMissionsPage() {
  const [items, setItems] = useState<DailyMission[]>([]);
  const [filtered, setFiltered] = useState<DailyMission[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<DailyMission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<DailyMission["type"]>("COMPLETE_LESSON");
  const [targetValue, setTargetValue] = useState(1);
  const [rewardXp, setRewardXp] = useState(10);
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function loadData() {
    setLoading(true);
    try {
      const res = await adminApi.list("/daily-missions");
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
      setFiltered(items.filter((item) => item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)));
    } else {
      setFiltered(items);
    }
  }, [items, search]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };
  const table = useTableControls(filtered, [
    { value: "title", label: "Tiêu đề", getValue: (item) => item.title },
    { value: "type", label: "Phân loại", getValue: (item) => item.type },
    { value: "target", label: "Mục tiêu", getValue: (item) => item.targetValue },
    { value: "reward", label: "Phần thưởng", getValue: (item) => item.rewardXp },
    { value: "status", label: "Trạng thái", getValue: (item) => item.isActive !== false }
  ], "title");

  const openAddModal = () => {
    setEditingItem(null);
    setTitle("");
    setDescription("");
    setType("COMPLETE_LESSON");
    setTargetValue(1);
    setRewardXp(10);
    setIsActive(true);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item: DailyMission) => {
    setEditingItem(item);
    setTitle(item.title || "");
    setDescription(item.description || "");
    setType(item.type || "COMPLETE_LESSON");
    setTargetValue(item.targetValue || 1);
    setRewardXp(item.rewardXp || 10);
    setIsActive(item.isActive !== false);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa nhiệm vụ ngày này?")) return;
    try {
      await adminApi.remove("/daily-missions", id);
      loadData();
    } catch (e: any) {
      console.error(e);
      alert("Lỗi khi xóa nhiệm vụ: " + (e.message || e));
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Tiêu đề nhiệm vụ không được để trống.";
    if (!description.trim()) errs.description = "Mô tả không được để trống.";
    if (targetValue < 1) errs.targetValue = "Mục tiêu cần hoàn thành phải từ 1 trở lên.";
    if (rewardXp < 1) errs.rewardXp = "Phần thưởng kinh nghiệm (XP) phải từ 1 trở lên.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      title: title.trim(),
      description: description.trim(),
      type,
      targetValue: Number(targetValue),
      rewardXp: Number(rewardXp),
      isActive
    };

    try {
      if (editingItem) {
        await adminApi.update("/daily-missions", editingItem.id, payload);
      } else {
        await adminApi.create("/daily-missions", payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const importConfig = dailyMissionsImportConfig(items);

  const handleImport = async (rows: any[]) => {
    await batchImport("dailyMissions", rows);
    showToast(`Import CSV thành công ${rows.length} nhiệm vụ ngày.`);
    await loadData();
  };

  return (
    <div>
      <div className="toolbar">
        <h1>Nhiệm Vụ Hàng Ngày</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="secondary" onClick={() => setIsImportOpen(true)}>Import</button>
          <button onClick={openAddModal}>➕ Thêm Nhiệm Vụ</button>
        </div>
      </div>

      <div className="panel" style={{ padding: "16px", marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Tìm kiếm nhiệm vụ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <p>Đang tải danh sách nhiệm vụ...</p>
      ) : filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "var(--text-muted)" }}>Không có nhiệm vụ ngày nào.</p>
        </div>
      ) : (
        <>
        <TableControls {...table} />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Mô tả chi tiết</th>
                <th>Phân loại hành động</th>
                <th>Mục tiêu số lần</th>
                <th>Phần thưởng</th>
                <th style={{ width: "120px" }}>Trạng thái</th>
                <th style={{ width: "150px" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {table.pagedItems.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: "600" }}>{item.title}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: "13px" }}>{item.description}</td>
                  <td><span className="badge info">{item.type}</span></td>
                  <td style={{ fontWeight: "bold" }}>{item.targetValue} lần</td>
                  <td><strong style={{ color: "#22c55e" }}>+{item.rewardXp} XP</strong></td>
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "min(600px, 95vw)" }}>
            <div className="modal-header">
              <h2>{editingItem ? "Chỉnh sửa nhiệm vụ hằng ngày" : "Thêm nhiệm vụ mới"}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="field">
                  <label>Tiêu đề nhiệm vụ *</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Làm 1 bài toán"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  {errors.title && <span className="error-msg">{errors.title}</span>}
                </div>

                <div className="field">
                  <label>Mô tả chi tiết *</label>
                  <textarea
                    placeholder="Ví dụ: Vượt qua câu hỏi của 1 bài học Toán hôm nay..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  {errors.description && <span className="error-msg">{errors.description}</span>}
                </div>

                <div className="field">
                  <label>Phân loại hành động</label>
                  <select value={type} onChange={(e) => setType(e.target.value as any)}>
                    <option value="COMPLETE_LESSON">COMPLETE_LESSON (Hoàn thành bài học nói chung)</option>
                    <option value="REVIEW_FLASHCARD">REVIEW_FLASHCARD (Ôn tập thẻ học Flashcard)</option>
                    <option value="SCAN_QR">Quét QR mở khóa nhân vật</option>
                    <option value="COMPLETE_DIALOGUE">COMPLETE_DIALOGUE (Hoàn thành bài Hội thoại)</option>
                    <option value="COMPLETE_MATH">COMPLETE_MATH (Hoàn thành bài Toán)</option>
                  </select>
                </div>

                <div className="field">
                  <label>Mục tiêu số lần hành động *</label>
                  <input
                    type="number"
                    min="1"
                    value={targetValue}
                    onChange={(e) => setTargetValue(Number(e.target.value))}
                  />
                  {errors.targetValue && <span className="error-msg">{errors.targetValue}</span>}
                </div>

                <div className="field">
                  <label>Phần thưởng XP nhận được *</label>
                  <input
                    type="number"
                    min="1"
                    value={rewardXp}
                    onChange={(e) => setRewardXp(Number(e.target.value))}
                  />
                  {errors.rewardXp && <span className="error-msg">{errors.rewardXp}</span>}
                </div>

                <div className="field">
                  <ToggleSwitch id="isActive" label="Nhiệm vụ này đang hoạt động" checked={isActive} onChange={setIsActive} />
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

      {toastMsg && <div className="toast"><span>✨</span> {toastMsg}</div>}
    </div>
  );
}
