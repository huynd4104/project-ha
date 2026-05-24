import { useEffect, useState } from "react";
import { adminApi } from "../api/adminApi";
import { CSVImportModal } from "../components/import/CSVImportModal";
import { mathQuestionsImportConfig } from "../components/import/importConfigs";
import { MediaPicker } from "../components/MediaPicker";
import { batchImport } from "../services/batchImportService";
import { downloadExcelTemplate, toExcelTemplateFilename } from "../utils/csv";
import { QUIZ_LESSON_TYPES, getLessonTypeLabel } from "../utils/lessonTypes";
import { useLocation } from "react-router-dom";
import { getLessonModuleByPath, LESSON_MODULES } from "../utils/lessonModules";

interface Lesson {
  id: string;
  title: string;
  type: string;
}

interface Question {
  id: string;
  lessonId: string;
  questionText: string;
  imageUrl?: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  explanation: string;
  orderIndex: number;
}

export function MathQuestionsPage() {
  const location = useLocation();
  const moduleKey = getLessonModuleByPath(location.pathname);
  const moduleConfig = LESSON_MODULES[moduleKey];
  const [items, setItems] = useState<Question[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [filtered, setFiltered] = useState<Question[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal & form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Question | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const [lessonId, setLessonId] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctOption, setCorrectOption] = useState<"A" | "B" | "C" | "D">("A");
  const [explanation, setExplanation] = useState("");
  const [orderIndex, setOrderIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function loadData() {
    setLoading(true);
    try {
      const [questionsRes, lessonsRes] = await Promise.all([
        adminApi.list("/math-questions"),
        adminApi.list("/lessons")
      ]);
      setItems(questionsRes.data.data || []);
      const allLessons = lessonsRes.data.data || [];
      setAllLessons(allLessons);
      setLessons(allLessons.filter((l: any) => l.type === moduleKey));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [moduleKey]);

  useEffect(() => {
    const moduleQuestions = items.filter((item) => {
      const lesson = allLessons.find((l) => l.id === item.lessonId);
      return lesson && lesson.type === moduleKey;
    });

    if (search.trim()) {
      const q = search.toLowerCase();
      setFiltered(moduleQuestions.filter((item) => item.questionText.toLowerCase().includes(q) || item.explanation.toLowerCase().includes(q)));
    } else {
      setFiltered(moduleQuestions);
    }
  }, [items, allLessons, moduleKey, search]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setLessonId(lessons[0]?.id || "");
    setQuestionText("");
    setImageUrl("");
    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");
    setCorrectOption("A");
    setExplanation("");
    const moduleQuestions = items.filter((item) => {
      const lesson = allLessons.find((l) => l.id === item.lessonId);
      return lesson && lesson.type === moduleKey;
    });
    setOrderIndex(moduleQuestions.length ? Math.max(...moduleQuestions.map(i => i.orderIndex ?? 0)) + 10 : 10);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item: Question) => {
    setEditingItem(item);
    setLessonId(item.lessonId || "");
    setQuestionText(item.questionText || "");
    setImageUrl(item.imageUrl || "");
    setOptionA(item.optionA || "");
    setOptionB(item.optionB || "");
    setOptionC(item.optionC || "");
    setOptionD(item.optionD || "");
    setCorrectOption(item.correctOption || "A");
    setExplanation(item.explanation || "");
    setOrderIndex(item.orderIndex ?? 0);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa câu hỏi này?")) return;
    await adminApi.remove("/math-questions", id);
    loadData();
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!lessonId) errs.lessonId = "Vui lòng chọn một bài học tương tác.";
    if (!questionText.trim()) errs.questionText = "Nội dung câu hỏi không được để trống.";
    if (!optionA.trim()) errs.optionA = "Đáp án A không được để trống.";
    if (!optionB.trim()) errs.optionB = "Đáp án B không được để trống.";
    if (!optionC.trim()) errs.optionC = "Đáp án C không được để trống.";
    if (!optionD.trim()) errs.optionD = "Đáp án D không được để trống.";
    if (!explanation.trim()) errs.explanation = "Lời giải thích đáp án không được để trống.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      lessonId,
      questionText: questionText.trim(),
      imageUrl: imageUrl.trim() || null,
      optionA: optionA.trim(),
      optionB: optionB.trim(),
      optionC: optionC.trim(),
      optionD: optionD.trim(),
      correctOption,
      explanation: explanation.trim(),
      orderIndex: Number(orderIndex)
    };

    try {
      if (editingItem) {
        await adminApi.update("/math-questions", editingItem.id, payload);
      } else {
        await adminApi.create("/math-questions", payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const getLessonTitle = (id: string) => {
    const lesson = lessons.find((l) => l.id === id);
    if (!lesson) return "Bài học tương tác";
    return `${lesson.title} (${getLessonTypeLabel(lesson.type)})`;
  };

  const importConfig = mathQuestionsImportConfig(lessons);
  const libraryTitle = moduleKey === "MATH" ? "Thư viện toán tư duy" : `Thư viện ${moduleConfig.title.toLowerCase()}`;

  const handleImport = async (rows: any[]) => {
    await batchImport("mathQuestions", rows);
    showToast(`Import CSV thành công ${rows.length} câu hỏi ${moduleConfig.prefix.toLowerCase()}.`);
    await loadData();
  };

  return (
    <div>
      <div className="toolbar">
        <div>
          <h1>{libraryTitle}</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "4px" }}>
            Kho câu hỏi {moduleKey === "MATH" ? "toán/tư duy" : moduleConfig.title.toLowerCase()} dùng để tạo hoạt động nhận thức và logic.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="secondary" onClick={() => downloadExcelTemplate(toExcelTemplateFilename(importConfig.templateFilename), importConfig.templateHeaders, importConfig.templateExampleRows)}>Tải mẫu Excel</button>
          <button className="secondary" onClick={() => setIsImportOpen(true)}>Import CSV</button>
          <button onClick={openAddModal} disabled={lessons.length === 0}>➕ Thêm Câu Hỏi</button>
        </div>
      </div>

      {lessons.length === 0 && (
        <div className="panel" style={{ background: "#fffbeb", border: "1px solid #fef3c7", color: "#b45309" }}>
          ⚠️ <strong>Lưu ý:</strong> Cần tạo ít nhất một bài học thuộc nhóm <strong>{moduleConfig.prefix.toUpperCase()}</strong> trước khi thêm câu hỏi.
        </div>
      )}

      <div className="panel" style={{ padding: "16px", marginBottom: "16px" }}>
        <input
          type="text"
          placeholder={`Tìm kiếm câu hỏi ${moduleConfig.prefix.toLowerCase()}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <p>Đang tải danh sách câu hỏi...</p>
      ) : filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "var(--text-muted)" }}>Không có câu hỏi {moduleConfig.prefix.toLowerCase()} nào.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: "80px" }}>Thứ tự</th>
                <th>Bài học</th>
                <th>Câu hỏi</th>
                <th>Đáp án đúng</th>
                <th>Giải thích</th>
                <th style={{ width: "150px" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: "700", textAlign: "center" }}>{item.orderIndex}</td>
                  <td style={{ fontWeight: "600", fontSize: "13px" }}>{getLessonTitle(item.lessonId)}</td>
                  <td style={{ fontSize: "13px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {item.imageUrl && <img src={item.imageUrl} alt="" style={{ width: "28px", height: "28px", objectFit: "cover", borderRadius: "4px", background: "#f1f5f9" }} />}
                      <span>{item.questionText}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge active" style={{ padding: "4px 10px" }}>
                      {item.correctOption}. {(item as any)[`option${item.correctOption}`]}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: "12px" }}>{item.explanation}</td>
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
              <h2>{editingItem ? `Chỉnh sửa câu hỏi ${moduleConfig.prefix}` : `Thêm câu hỏi ${moduleConfig.prefix}`}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="drawer-container">
                  <div className="drawer-main" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div className="field">
                      <label>Bài học tương tác *</label>
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
                      <label>Nội dung câu hỏi *</label>
                      <textarea
                        placeholder="Ví dụ: Bé hãy đếm xem có bao nhiêu quả táo trong ảnh?"
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                      />
                      {errors.questionText && <span className="error-msg">{errors.questionText}</span>}
                    </div>

                    <div className="field">
                      <label>Hình ảnh đi kèm (Tùy chọn)</label>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          type="text"
                          placeholder="Chọn hình minh họa từ thư viện"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <button type="button" className="secondary" onClick={() => setShowMediaPicker(true)}>Thư viện</button>
                      </div>
                    </div>

                    <div style={{ border: "1px solid var(--border)", padding: "16px", borderRadius: "8px", background: "#f8fafc" }}>
                      <strong style={{ display: "block", marginBottom: "12px", fontSize: "14px" }}>Cài đặt Đáp án Lựa chọn</strong>
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
                                name="correctOption"
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

                    <div className="field">
                      <label>Giải thích đáp án đúng *</label>
                      <textarea
                        placeholder="Giải thích ngắn gọn cho bé hoặc phụ huynh hiểu..."
                        value={explanation}
                        onChange={(e) => setExplanation(e.target.value)}
                      />
                      {errors.explanation && <span className="error-msg">{errors.explanation}</span>}
                      <span className="helper">Bé đếm: 1, 2, 3 quả táo. Đáp án đúng là 3!</span>
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
                    <h3>Mô phỏng Mobile Card</h3>
                    <div style={{ border: "2px solid #ddd", borderRadius: "16px", background: "white", padding: "14px", marginTop: "12px", boxShadow: "0 4px 10px rgba(0,0,0,0.15)" }}>
                      {/* Mobile Header Mockup */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", borderBottom: "1px solid #eee", paddingBottom: "8px", marginBottom: "8px" }}>
                        <div style={{ flex: 1, height: "8px", borderRadius: "4px", background: "#e2e8f0" }}>
                          <div style={{ width: "40%", height: "8px", borderRadius: "4px", background: "#22c55e" }}></div>
                        </div>
                        <span style={{ fontSize: "10px", fontWeight: "bold", color: "#666" }}>1/5</span>
                      </div>

                      {/* Mockup Question Card */}
                      <p style={{ fontSize: "13px", fontWeight: "800", color: "#332923", marginBottom: "8px", lineHeight: "1.4" }}>
                        {questionText || "Bé hãy đếm xem..."}
                      </p>

                      {imageUrl && (
                        <div style={{ width: "100%", height: "100px", borderRadius: "8px", overflow: "hidden", marginBottom: "8px", background: "#f8fafc" }}>
                          <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        </div>
                      )}

                      {/* Mockup Options Grid */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {[
                          ["A", optionA],
                          ["B", optionB],
                          ["C", optionC],
                          ["D", optionD]
                        ].map(([key, val]) => {
                          const isCorrect = correctOption === key;
                          return (
                            <div
                              key={key}
                              style={{
                                padding: "8px 10px",
                                border: isCorrect ? "2px solid #10b981" : "1px solid #e2e8f0",
                                background: isCorrect ? "#ecfdf5" : "white",
                                borderRadius: "8px",
                                fontSize: "11px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between"
                              }}
                            >
                              <span>{key}. {val || "Đáp án..."}</span>
                              {isCorrect && <span style={{ color: "#10b981", fontWeight: "bold" }}>✓</span>}
                            </div>
                          );
                        })}
                      </div>

                      {/* Mockup Continue Button */}
                      <div style={{ marginTop: "12px", padding: "8px", borderRadius: "8px", background: "#2563eb", color: "white", textAlign: "center", fontWeight: "bold", fontSize: "11px" }}>
                        Tiếp tục
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

      {showMediaPicker && (
        <MediaPicker
          category="FLASHCARD"
          type="IMAGE"
          currentValue={imageUrl}
          onSelect={(url) => setImageUrl(url)}
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
