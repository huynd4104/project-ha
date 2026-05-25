import { useEffect, useState } from "react";
import { adminApi } from "../api/adminApi";
import { ToggleSwitch } from "../components/ToggleSwitch";
import { CSVImportModal } from "../components/import/CSVImportModal";
import { lessonsImportConfig } from "../components/import/importConfigs";
import { batchImport } from "../services/batchImportService";
import { downloadExcelTemplate, toExcelTemplateFilename } from "../utils/csv";
import { LESSON_TYPES, getLessonTypeLabel } from "../utils/lessonTypes";

interface NPC {
  id: string;
  name: string;
  imageUrl: string;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  type: "MATH" | "DIALOGUE" | "FLASHCARD" | "THINKING" | "SPELLING" | "RHYME";
  orderIndex: number;
  npcId?: string | null;
  isActive: boolean;
}

export function LessonsPage() {
  const [items, setItems] = useState<Lesson[]>([]);
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [filtered, setFiltered] = useState<Lesson[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal & form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Lesson | null>(null);
  const [toastMsg, setToastMsg] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<Lesson["type"]>("MATH");
  const [npcId, setNpcId] = useState("");
  const [orderIndex, setOrderIndex] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function loadData() {
    setLoading(true);
    try {
      const [lessonRes, npcRes] = await Promise.all([
        adminApi.list("/lessons"),
        adminApi.list("/npcs")
      ]);
      setItems(lessonRes.data.data || []);
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
      setFiltered(items.filter((item) => item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)));
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
    setTitle("");
    setDescription("");
    setType("MATH");
    setNpcId("");
    setOrderIndex(items.length ? Math.max(...items.map(i => i.orderIndex ?? 0)) + 10 : 10);
    setIsActive(true);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item: Lesson) => {
    setEditingItem(item);
    setTitle(item.title || "");
    setDescription(item.description || "");
    setType(item.type || "MATH");
    setNpcId(item.npcId || "");
    setOrderIndex(item.orderIndex ?? 0);
    setIsActive(item.isActive !== false);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const [mathRes, dialogueRes, flashcardRes] = await Promise.all([
        adminApi.list("/math-questions"),
        adminApi.list("/dialogues"),
        adminApi.list("/flashcards")
      ]);

      const mathSnap = (mathRes.data.data || []).filter((q: any) => q.lessonId === id);
      const dialogueSnap = (dialogueRes.data.data || []).filter((d: any) => d.lessonId === id);
      const flashcardSnap = (flashcardRes.data.data || []).filter((f: any) => f.lessonId === id);

      if (mathSnap.length > 0 || dialogueSnap.length > 0 || flashcardSnap.length > 0) {
        alert(
          `Không thể xóa bài học này vì đang có dữ liệu liên kết tồn tại:\n` +
          `• Câu hỏi toán: ${mathSnap.length} câu\n` +
          `• Câu hội thoại: ${dialogueSnap.length} câu\n` +
          `• Thẻ học (Flashcard): ${flashcardSnap.length} thẻ\n\n` +
          `Vui lòng xóa các câu hỏi/thẻ học liên quan trước khi xóa bài học.`
        );
        return;
      }

      if (!window.confirm("Bạn có chắc chắn muốn xóa bài học này?")) return;
      await adminApi.remove("/lessons", id);
      loadData();
    } catch (e: any) {
      console.error(e);
      alert("Lỗi khi kiểm tra liên kết bài học: " + (e.message || e));
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Tiêu đề bài học không được để trống.";
    if (!description.trim()) errs.description = "Mô tả bài học không được để trống.";
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
      npcId: npcId || null,
      orderIndex: Number(orderIndex),
      isActive
    };

    try {
      if (editingItem) {
        await adminApi.update("/lessons", editingItem.id, payload);
      } else {
        await adminApi.create("/lessons", payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const getNpcInfo = (id?: string | null) => {
    if (!id) return null;
    return npcs.find((n) => n.id === id);
  };

  const importConfig = lessonsImportConfig(npcs, items);

  const handleImport = async (rows: any[]) => {
    await batchImport("lessons", rows);
    showToast(`Import CSV thành công ${rows.length} bài học.`);
    await loadData();
  };

  return (
    <div>
      <div className="toolbar">
        <div>
          <h1>Thư viện bài học</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "4px" }}>Kho bài học có thể dùng làm nguồn tham chiếu hoặc tách thành hoạt động trong kiến trúc mới.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="secondary" onClick={() => setIsImportOpen(true)}>Import</button>
          <button onClick={openAddModal}>➕ Thêm Bài Học</button>
        </div>
      </div>

      <div className="panel" style={{ padding: "14px 16px", marginBottom: "16px", color: "var(--text-muted)" }}>
        Đây là thư viện nội dung học có thể tái sử dụng. Không cần xóa dữ liệu hiện có khi chuyển sang cấu trúc chương trình, lộ trình, bài học và hoạt động.
      </div>

      <div className="panel" style={{ padding: "16px", marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Tìm kiếm bài học..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <p>Đang tải danh sách bài học...</p>
      ) : filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "var(--text-muted)" }}>Không có bài học nào.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: "80px" }}>Thứ tự</th>
                <th>Tiêu đề bài học</th>
                <th>Mô tả</th>
                <th>Loại bài</th>
                <th>Mascot</th>
                <th style={{ width: "120px" }}>Trạng thái</th>
                <th style={{ width: "150px" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const npc = getNpcInfo(item.npcId);
                const badgeClass = item.type === "MATH" || item.type === "THINKING" ? "blue" : item.type === "FLASHCARD" ? "purple" : item.type === "SPELLING" ? "green" : item.type === "RHYME" ? "yellow" : "";
                return (
                  <tr key={item.id}>
                    <td style={{ fontWeight: "700", textAlign: "center" }}>{item.orderIndex}</td>
                    <td style={{ fontWeight: "600" }}>{item.title}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: "13px" }}>{item.description}</td>
                    <td>
                      <span className={`badge ${badgeClass}`}>
                        {getLessonTypeLabel(item.type)}
                      </span>
                    </td>
                    <td>
                      {npc ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {npc.imageUrl && <img src={npc.imageUrl} alt="" style={{ width: "24px", height: "24px", borderRadius: "4px", objectFit: "cover" }} />}
                          <span style={{ fontSize: "13px" }}>{npc.name}</span>
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>Chưa gắn nhân vật</span>
                      )}
                    </td>
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "min(560px, 95vw)" }}>
            <div className="modal-header">
              <h2>{editingItem ? "Chỉnh sửa bài học" : "Thêm bài học"}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="field">
                  <label>Tiêu đề bài học *</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Đếm táo cùng Mimi"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  {errors.title && <span className="error-msg">{errors.title}</span>}
                </div>

                <div className="field">
                  <label>Mô tả bài học *</label>
                  <textarea
                    placeholder="Bài học này giúp bé nhận biết các số từ 1 đến 5..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  {errors.description && <span className="error-msg">{errors.description}</span>}
                </div>

                <div className="form-grid">
                  <div className="field">
                    <label>Loại bài học *</label>
                    <select value={type} onChange={(e) => setType(e.target.value as Lesson["type"])} disabled={!!editingItem}>
                      {LESSON_TYPES.map((lessonType) => (
                        <option key={lessonType} value={lessonType}>{lessonType} ({getLessonTypeLabel(lessonType)})</option>
                      ))}
                    </select>
                    {editingItem && <span className="helper">Không thể thay đổi loại bài sau khi tạo.</span>}
                  </div>

                  <div className="field">
                     <label>Mascot (tùy chọn)</label>
                    <select value={npcId} onChange={(e) => setNpcId(e.target.value)}>
                      <option value="">-- Không có nhân vật --</option>
                      {npcs.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.name}
                        </option>
                      ))}
                    </select>
                    <span className="helper">Mascot, trợ giúp giảng giải.</span>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="field">
                    <label>Thứ tự hiển thị *</label>
                    <input
                      type="number"
                      value={orderIndex}
                      onChange={(e) => setOrderIndex(Number(e.target.value))}
                    />
                    <span className="helper">Số nhỏ hiển thị trước trong lộ trình học.</span>
                  </div>

                  <div className="field" style={{ justifyContent: "end" }}>
                    <ToggleSwitch id="isActiveLesson" label="Bài học này đang hoạt động" checked={isActive} onChange={setIsActive} />
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
