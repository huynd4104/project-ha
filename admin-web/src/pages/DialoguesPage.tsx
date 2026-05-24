import { useEffect, useState } from "react";
import { adminApi } from "../api/adminApi";
import { CSVImportModal } from "../components/import/CSVImportModal";
import { dialoguesImportConfig } from "../components/import/importConfigs";
import { MediaPicker } from "../components/MediaPicker";
import { batchImport } from "../services/batchImportService";
import { downloadExcelTemplate, toExcelTemplateFilename } from "../utils/csv";

interface Lesson {
  id: string;
  title: string;
  type: string;
}

interface Dialogue {
  id: string;
  lessonId: string;
  title: string;
  sceneText: string;
  audioUrl?: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  orderIndex: number;
}

export function DialoguesPage() {
  const [items, setItems] = useState<Dialogue[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [filtered, setFiltered] = useState<Dialogue[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal & Edit states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Dialogue | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Form states
  const [lessonId, setLessonId] = useState("");
  const [title, setTitle] = useState("");
  const [sceneText, setSceneText] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctOption, setCorrectOption] = useState<"A" | "B" | "C" | "D">("A");
  const [orderIndex, setOrderIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function loadData() {
    setLoading(true);
    try {
      const [dialoguesRes, lessonsRes] = await Promise.all([
        adminApi.list("/dialogues"),
        adminApi.list("/lessons")
      ]);
      setItems(dialoguesRes.data.data || []);
      const allLessons = lessonsRes.data.data || [];
      setAllLessons(allLessons);
      setLessons(allLessons.filter((l: any) => l.type === "DIALOGUE"));
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
      setFiltered(items.filter((item) => item.title.toLowerCase().includes(q) || item.sceneText.toLowerCase().includes(q) || item.questionText.toLowerCase().includes(q)));
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
    setLessonId(lessons[0]?.id || "");
    setTitle("");
    setSceneText("");
    setAudioUrl("");
    setQuestionText("");
    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");
    setCorrectOption("A");
    setOrderIndex(items.length ? Math.max(...items.map(i => i.orderIndex ?? 0)) + 10 : 10);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item: Dialogue) => {
    setEditingItem(item);
    setLessonId(item.lessonId || "");
    setTitle(item.title || "");
    setSceneText(item.sceneText || "");
    setAudioUrl(item.audioUrl || "");
    setQuestionText(item.questionText || "");
    setOptionA(item.optionA || "");
    setOptionB(item.optionB || "");
    setOptionC(item.optionC || "");
    setOptionD(item.optionD || "");
    setCorrectOption(item.correctOption || "A");
    setOrderIndex(item.orderIndex ?? 0);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa hội thoại này?")) return;
    await adminApi.remove("/dialogues", id);
    loadData();
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!lessonId) errs.lessonId = "Vui lòng chọn bài học hội thoại.";
    if (!title.trim()) errs.title = "Tiêu đề hội thoại không được để trống.";
    if (!sceneText.trim()) errs.sceneText = "Bối cảnh hội thoại không được để trống.";
    if (!questionText.trim()) errs.questionText = "Nội dung câu hỏi không được để trống.";
    if (!optionA.trim()) errs.optionA = "Đáp án A không được để trống.";
    if (!optionB.trim()) errs.optionB = "Đáp án B không được để trống.";
    if (!optionC.trim()) errs.optionC = "Đáp án C không được để trống.";
    if (!optionD.trim()) errs.optionD = "Đáp án D không được để trống.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      lessonId,
      title: title.trim(),
      sceneText: sceneText.trim(),
      audioUrl: audioUrl.trim() || null,
      questionText: questionText.trim(),
      optionA: optionA.trim(),
      optionB: optionB.trim(),
      optionC: optionC.trim(),
      optionD: optionD.trim(),
      correctOption,
      orderIndex: Number(orderIndex)
    };

    try {
      if (editingItem) {
        await adminApi.update("/dialogues", editingItem.id, payload);
      } else {
        await adminApi.create("/dialogues", payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const getLessonTitle = (id: string) => {
    return lessons.find((l) => l.id === id)?.title || "Bài học hội thoại";
  };

  const importConfig = dialoguesImportConfig(allLessons);

  const handleImport = async (rows: any[]) => {
    await batchImport("dialogues", rows);
    showToast(`Import CSV thành công ${rows.length} hội thoại.`);
    await loadData();
  };

  return (
    <div>
      <div className="toolbar">
        <h1>Chi tiết Hội thoại</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="secondary" onClick={() => downloadExcelTemplate(toExcelTemplateFilename(importConfig.templateFilename), importConfig.templateHeaders, importConfig.templateExampleRows)}>Download Template</button>
          <button className="secondary" onClick={() => setIsImportOpen(true)}>Import CSV</button>
          <button onClick={openAddModal} disabled={lessons.length === 0}>➕ Thêm Hội Thoại</button>
        </div>
      </div>

      {lessons.length === 0 && (
        <div className="panel" style={{ background: "#fffbeb", border: "1px solid #fef3c7", color: "#b45309" }}>
          ⚠️ <strong>Lưu ý:</strong> Cần tạo ít nhất một bài học có loại là <strong>DIALOGUE</strong> trước khi thêm chi tiết hội thoại.
        </div>
      )}

      <div className="panel" style={{ padding: "16px", marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Tìm kiếm hội thoại..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <p>Đang tải danh sách hội thoại...</p>
      ) : filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "var(--text-muted)" }}>Không có hội thoại nào.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: "80px" }}>Thứ tự</th>
                <th>Bài học</th>
                <th>Tiêu đề hội thoại</th>
                <th>Bối cảnh</th>
                <th>Âm thanh</th>
                <th>Câu hỏi/Đáp án đúng</th>
                <th style={{ width: "150px" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: "700", textAlign: "center" }}>{item.orderIndex}</td>
                  <td style={{ fontWeight: "600", fontSize: "13px" }}>{getLessonTitle(item.lessonId)}</td>
                  <td style={{ fontWeight: "600" }}>{item.title}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: "13px" }}>{item.sceneText}</td>
                  <td>
                    {item.audioUrl ? (
                      <audio src={item.audioUrl} controls style={{ maxWidth: "150px", height: "24px" }} />
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>Không có</span>
                    )}
                  </td>
                  <td style={{ fontSize: "13px" }}>
                    <div><strong>Q:</strong> {item.questionText}</div>
                    <div style={{ marginTop: "4px" }}>
                      <span className="badge active" style={{ padding: "2px 6px", fontSize: "11px" }}>
                        Đúng: {item.correctOption}. {(item as any)[`option${item.correctOption}`]}
                      </span>
                    </div>
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

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "min(880px, 95vw)" }}>
            <div className="modal-header">
              <h2>{editingItem ? "Cập Nhật Hội Thoại" : "Thêm Hội Thoại Mới"}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="drawer-container">
                  <div className="drawer-main" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div className="field">
                      <label>Bài học hội thoại *</label>
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
                      <label>Tiêu đề hội thoại (Bối cảnh chính) *</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Gặp gỡ ở nông trại"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                      {errors.title && <span className="error-msg">{errors.title}</span>}
                    </div>

                    <div className="field">
                      <label>Lời thoại/Bối cảnh dẫn dắt *</label>
                      <textarea
                        placeholder="Ví dụ: Mèo Mimi: 'Chào bé, nông trại nhà mình có nhiều vật nuôi lắm nhé!'"
                        value={sceneText}
                        onChange={(e) => setSceneText(e.target.value)}
                      />
                      {errors.sceneText && <span className="error-msg">{errors.sceneText}</span>}
                    </div>

                    <div className="field">
                      <label>File âm thanh đi kèm (Tùy chọn)</label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          type="text"
                          placeholder="Chọn audio từ thư viện"
                          value={audioUrl}
                          onChange={(e) => setAudioUrl(e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <button type="button" className="secondary" onClick={() => setShowMediaPicker(true)}>Thư viện</button>
                      </div>
                      <span className="helper">Giọng nói đọc hội thoại hoặc âm thanh mẫu.</span>
                    </div>

                    <div className="field">
                      <label>Câu hỏi trắc nghiệm sau thoại *</label>
                      <textarea
                        placeholder="Ví dụ: Động vật nào kêu 'Meo meo' nhỉ?"
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                      />
                      {errors.questionText && <span className="error-msg">{errors.questionText}</span>}
                    </div>

                    <div style={{ border: "1px solid var(--border)", padding: "16px", borderRadius: "8px", background: "#f8fafc" }}>
                      <strong style={{ display: "block", marginBottom: "12px", fontSize: "14px" }}>Đáp án Câu Hỏi</strong>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div className="field">
                          <label>Đáp án A *</label>
                          <input type="text" placeholder="Đáp án A" value={optionA} onChange={(e) => setOptionA(e.target.value)} />
                          {errors.optionA && <span className="error-msg">{errors.optionA}</span>}
                        </div>
                        <div className="field">
                          <label>Đáp án B *</label>
                          <input type="text" placeholder="Đáp án B" value={optionB} onChange={(e) => setOptionB(e.target.value)} />
                          {errors.optionB && <span className="error-msg">{errors.optionB}</span>}
                        </div>
                        <div className="field">
                          <label>Đáp án C *</label>
                          <input type="text" placeholder="Đáp án C" value={optionC} onChange={(e) => setOptionC(e.target.value)} />
                          {errors.optionC && <span className="error-msg">{errors.optionC}</span>}
                        </div>
                        <div className="field">
                          <label>Đáp án D *</label>
                          <input type="text" placeholder="Đáp án D" value={optionD} onChange={(e) => setOptionD(e.target.value)} />
                          {errors.optionD && <span className="error-msg">{errors.optionD}</span>}
                        </div>
                      </div>

                      <div className="field" style={{ marginTop: "12px" }}>
                        <label>Đáp án đúng *</label>
                        <div style={{ display: "flex", gap: "20px" }}>
                          {(["A", "B", "C", "D"] as const).map((opt) => (
                            <label key={opt} style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer", fontWeight: "normal" }}>
                              <input
                                type="radio"
                                name="correctOptionDialogue"
                                checked={correctOption === opt}
                                onChange={() => setCorrectOption(opt)}
                                style={{ width: "16px", height: "16px" }}
                              />
                              Đáp án {opt}
                            </label>
                          ))}
                        </div>
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

                  {/* Simulator Screen Drawer */}
                  <div className="drawer-aside" style={{ width: "280px" }}>
                    <h3>Mô phỏng Âm thanh</h3>
                    <div style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "16px", marginTop: "12px", background: "#f8fafc", textAlign: "center" }}>
                      <span style={{ fontSize: "40px", display: "block", marginBottom: "8px" }}>🔊</span>
                      <strong>{title || "Tiêu đề hội thoại"}</strong>
                      
                      {audioUrl ? (
                        <div style={{ marginTop: "12px" }}>
                          <audio src={audioUrl} controls style={{ width: "100%" }} />
                          <p style={{ fontSize: "11px", color: "var(--success)", fontWeight: "bold", marginTop: "8px" }}>✓ Đã nạp file âm thanh</p>
                        </div>
                      ) : (
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>
                          Chưa gắn file âm thanh. (Trẻ sẽ đọc bối cảnh bằng chữ).
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
                <button type="submit">{editingItem ? "Cập Nhật" : "Tạo Mới"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMediaPicker && (
        <MediaPicker
          category="DIALOGUE"
          type="AUDIO"
          currentValue={audioUrl}
          onSelect={(url) => setAudioUrl(url)}
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
