import { useEffect, useState } from "react";
import { adminApi } from "../api/adminApi";
import { TableControls } from "../components/TableControls";
import { CSVImportModal } from "../components/import/CSVImportModal";
import { flashcardsImportConfig } from "../components/import/importConfigs";
import { MediaPicker } from "../components/MediaPicker";
import { batchImport } from "../services/batchImportService";
import { downloadExcelTemplate, toExcelTemplateFilename } from "../utils/csv";
import { useTableControls } from "../utils/tableControls";

interface Lesson {
  id: string;
  title: string;
}

interface Flashcard {
  id: string;
  lessonId: string;
  frontText: string;
  backText: string;
  imageUrl?: string;
  audioUrl?: string;
  orderIndex: number;
}

export function FlashcardsPage() {
  const [items, setItems] = useState<Flashcard[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [filtered, setFiltered] = useState<Flashcard[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal & Edit states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Flashcard | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState<"image" | "audio" | null>(null);
  const [isPreviewFlipped, setIsPreviewFlipped] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Form states
  const [lessonId, setLessonId] = useState("");
  const [frontText, setFrontText] = useState("");
  const [backText, setBackText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [orderIndex, setOrderIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function loadData() {
    setLoading(true);
    try {
      const [flashRes, lessonsRes] = await Promise.all([
        adminApi.list("/flashcards"),
        adminApi.list("/lessons")
      ]);
      setItems(flashRes.data.data || []);
      setLessons(lessonsRes.data.data || []);
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
      setFiltered(items.filter((item) => item.frontText.toLowerCase().includes(q) || item.backText.toLowerCase().includes(q)));
    } else {
      setFiltered(items);
    }
  }, [items, search]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };
  const getLessonTitle = (id: string) => {
    return lessons.find((l) => l.id === id)?.title || "Bài học liên kết";
  };
  const table = useTableControls(filtered, [
    { value: "order", label: "Thứ tự", getValue: (item) => item.orderIndex },
    { value: "lesson", label: "Bài học", getValue: (item) => getLessonTitle(item.lessonId) },
    { value: "front", label: "Mặt trước", getValue: (item) => item.frontText },
    { value: "back", label: "Mặt sau", getValue: (item) => item.backText }
  ], "order");

  const openAddModal = () => {
    setEditingItem(null);
    setLessonId(lessons[0]?.id || "");
    setFrontText("");
    setBackText("");
    setImageUrl("");
    setAudioUrl("");
    setOrderIndex(items.length ? Math.max(...items.map(i => i.orderIndex ?? 0)) + 10 : 10);
    setIsPreviewFlipped(false);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item: Flashcard) => {
    setEditingItem(item);
    setLessonId(item.lessonId || "");
    setFrontText(item.frontText || "");
    setBackText(item.backText || "");
    setImageUrl(item.imageUrl || "");
    setAudioUrl(item.audioUrl || "");
    setOrderIndex(item.orderIndex ?? 0);
    setIsPreviewFlipped(false);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa thẻ học này?")) return;
    await adminApi.remove("/flashcards", id);
    loadData();
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!lessonId) errs.lessonId = "Vui lòng chọn bài học liên kết.";
    if (!frontText.trim()) errs.frontText = "Mặt trước thẻ học không được để trống.";
    if (!backText.trim()) errs.backText = "Mặt sau thẻ học không được để trống.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      lessonId,
      frontText: frontText.trim(),
      backText: backText.trim(),
      imageUrl: imageUrl.trim() || null,
      audioUrl: audioUrl.trim() || null,
      orderIndex: Number(orderIndex)
    };

    try {
      if (editingItem) {
        await adminApi.update("/flashcards", editingItem.id, payload);
      } else {
        await adminApi.create("/flashcards", payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const importConfig = flashcardsImportConfig(lessons);

  const handleImport = async (rows: any[]) => {
    await batchImport("flashcards", rows);
    showToast(`Import CSV thành công ${rows.length} thẻ học.`);
    await loadData();
  };

  return (
    <div>
      <div className="toolbar">
        <div>
          <h1>Thư viện Flashcard</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "4px" }}>Kho flashcard có thể tái sử dụng để tạo hoạt động học trong bài học mới.</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="secondary" onClick={() => setIsImportOpen(true)}>Import</button>
          <button onClick={openAddModal} disabled={lessons.length === 0}>➕ Thêm Thẻ Học</button>
        </div>
      </div>

      {lessons.length === 0 && (
        <div className="panel" style={{ background: "#fffbeb", border: "1px solid #fef3c7", color: "#b45309" }}>
          ⚠️ <strong>Lưu ý:</strong> Cần tạo ít nhất một bài học trước khi thêm thẻ học.
        </div>
      )}

      <div className="panel" style={{ padding: "16px", marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Tìm kiếm thẻ học theo chữ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <p>Đang tải danh sách thẻ học...</p>
      ) : filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "var(--text-muted)" }}>Không có thẻ học nào.</p>
        </div>
      ) : (
        <>
        <TableControls {...table} />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: "80px" }}>Thứ tự</th>
                <th>Bài học</th>
                <th>Mặt trước</th>
                <th>Mặt sau</th>
                <th>Minh họa</th>
                <th>Âm thanh</th>
                <th style={{ width: "150px" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {table.pagedItems.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: "700", textAlign: "center" }}>{item.orderIndex}</td>
                  <td style={{ fontWeight: "600", fontSize: "13px" }}>{getLessonTitle(item.lessonId)}</td>
                  <td style={{ fontWeight: "700", fontSize: "15px" }}>{item.frontText}</td>
                  <td style={{ fontSize: "15px" }}>{item.backText}</td>
                  <td>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" style={{ width: "32px", height: "32px", objectFit: "cover", borderRadius: "4px", background: "#f1f5f9" }} />
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>Không có</span>
                    )}
                  </td>
                  <td>
                    {item.audioUrl ? (
                      <audio src={item.audioUrl} style={{ width: "120px", height: "24px" }} controls />
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>Không có</span>
                    )}
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

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "min(820px, 95vw)" }}>
            <div className="modal-header">
              <h2>{editingItem ? "Chỉnh sửa flashcard" : "Thêm flashcard"}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="drawer-container">
                  <div className="drawer-main" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div className="field">
                      <label>Bài học liên kết *</label>
                      <select value={lessonId} onChange={(e) => setLessonId(e.target.value)}>
                        <option value="">-- Chọn bài học --</option>
                        {lessons.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.title}
                          </option>
                        ))}
                      </select>
                      {errors.lessonId && <span className="error-msg">{errors.lessonId}</span>}
                    </div>

                    <div className="field">
                      <label>Mặt trước thẻ (Ví dụ: Từ Tiếng Anh / Câu hỏi) *</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Apple"
                        value={frontText}
                        onChange={(e) => setFrontText(e.target.value)}
                      />
                      {errors.frontText && <span className="error-msg">{errors.frontText}</span>}
                    </div>

                    <div className="field">
                      <label>Mặt sau thẻ (Ví dụ: Định nghĩa / Từ Tiếng Việt) *</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Quả Táo"
                        value={backText}
                        onChange={(e) => setBackText(e.target.value)}
                      />
                      {errors.backText && <span className="error-msg">{errors.backText}</span>}
                    </div>

                    <div className="field">
                      <label>Hình ảnh minh họa (Tùy chọn)</label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          type="text"
                          placeholder="Chọn link ảnh từ thư viện"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <button type="button" className="secondary" onClick={() => setShowMediaPicker("image")}>Thư viện</button>
                      </div>
                    </div>

                    <div className="field">
                      <label>File phát âm (Tùy chọn)</label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          type="text"
                          placeholder="Chọn link phát âm từ thư viện"
                          value={audioUrl}
                          onChange={(e) => setAudioUrl(e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <button type="button" className="secondary" onClick={() => setShowMediaPicker("audio")}>Thư viện</button>
                      </div>
                    </div>

                    <div className="field" style={{ maxWidth: "200px" }}>
                      <label>Thứ tự hiển thị</label>
                      <input
                        type="number"
                        value={orderIndex}
                        onChange={(e) => setOrderIndex(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  {/* Flip Card Preview Panel */}
                  <div className="drawer-aside" style={{ width: "260px" }}>
                    <h3>Thử Nghiệm Thẻ Lật</h3>
                    <span className="helper">Bấm vào thẻ bên dưới để lật kiểm tra.</span>
                    
                    <div
                      className={`flashcard-preview-wrap ${isPreviewFlipped ? "flipped" : ""}`}
                      onClick={() => setIsPreviewFlipped(!isPreviewFlipped)}
                    >
                      <div className="flashcard-inner">
                        {/* Front Side */}
                        <div className="flashcard-face">
                          {imageUrl && (
                            <img src={imageUrl} alt="" style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", marginBottom: "8px" }} />
                          )}
                          <strong style={{ fontSize: "20px" }}>{frontText || "Mặt trước"}</strong>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>Mặt trước (Tap để lật)</span>
                        </div>
                        {/* Back Side */}
                        <div className="flashcard-face flashcard-back">
                          <strong style={{ fontSize: "20px" }}>{backText || "Mặt sau"}</strong>
                          {audioUrl && (
                            <span style={{ fontSize: "12px", marginTop: "8px" }}>🔊 Có phát âm</span>
                          )}
                          <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>Mặt sau (Tap để lật)</span>
                        </div>
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

      {showMediaPicker === "image" && (
        <MediaPicker
          category="FLASHCARD"
          type="IMAGE"
          currentValue={imageUrl}
          onSelect={(url) => setImageUrl(url)}
          onClose={() => setShowMediaPicker(null)}
        />
      )}

      {showMediaPicker === "audio" && (
        <MediaPicker
          category="FLASHCARD"
          type="AUDIO"
          currentValue={audioUrl}
          onSelect={(url) => setAudioUrl(url)}
          onClose={() => setShowMediaPicker(null)}
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
