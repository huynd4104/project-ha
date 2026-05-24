import { useEffect, useState } from "react";
import { adminApi } from "../api/adminApi";
import { MultiSelect } from "../components/MultiSelect";
import { validateActivityRequired } from "../utils/publishValidation";
import { ACTIVITY_TYPE_LABELS, uiLabel } from "../utils/adminLabels";
import type { Activity, ActivityType, Lesson, AccessType } from "../types/firebaseModels";

const ACTIVITY_TYPES: ActivityType[] = [
  "MULTIPLE_CHOICE", "LISTEN_AND_CHOOSE_IMAGE", "LOOK_AND_CHOOSE_WORD",
  "VOICE_ANSWER", "EMOTION_RECOGNITION", "DAILY_LIFE_SCENARIO",
  "PARENT_MARK_RESULT", "HEAR_AND_REPEAT", "MATCH_OBJECTS", "FLASHCARD_REVIEW"
];

interface OptionItem { text: string; imageUrl?: string; isCorrect: boolean }

export function ActivityBuilderPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [lessonSearch, setLessonSearch] = useState("");
  const [contentLibraryCounts, setContentLibraryCounts] = useState<Record<string, number>>({});

  // Form state
  const [activityType, setActivityType] = useState<ActivityType>("MULTIPLE_CHOICE");
  const [prompt, setPrompt] = useState("");
  const [instruction, setInstruction] = useState("");
  const [parentInstruction, setParentInstruction] = useState("");
  const [options, setOptions] = useState<OptionItem[]>([
    { text: "", isCorrect: true }, { text: "", isCorrect: false }
  ]);
  const [audioUrl, setAudioUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [acceptedAnswersStr, setAcceptedAnswersStr] = useState("");
  const [almostAnswersStr, setAlmostAnswersStr] = useState("");
  const [retryLimit, setRetryLimit] = useState(3);
  const [feedbackCorrect, setFeedbackCorrect] = useState("");
  const [feedbackWrong, setFeedbackWrong] = useState("");
  const [feedbackAlmost, setFeedbackAlmost] = useState("");
  const [ttsPromptText, setTtsPromptText] = useState("");
  const [orderIndex, setOrderIndex] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [activitySkillTags, setActivitySkillTags] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [accessType, setAccessType] = useState<AccessType>("FREE");
  const [voicePremiumRequired, setVoicePremiumRequired] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [lRes, sRes, fRes, dRes, qRes] = await Promise.all([
        adminApi.list("/lessons"),
        adminApi.list("/skills"),
        adminApi.list("/flashcards"),
        adminApi.list("/dialogues"),
        adminApi.list("/math-questions")
      ]);
      const all = (lRes.data.data || []) as Lesson[];
      all.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
      setLessons(all);
      setSkills(sRes.data.data || []);
      const questions = qRes.data.data || [];
      setContentLibraryCounts({
        flashcards: fRes.data.data?.length || 0,
        dialogues: dRes.data.data?.length || 0,
        math: questions.filter((item: any) => all.find((lesson: any) => lesson.id === item.lessonId)?.type === "MATH").length,
        thinking: questions.filter((item: any) => all.find((lesson: any) => lesson.id === item.lessonId)?.type === "THINKING").length,
        spelling: questions.filter((item: any) => all.find((lesson: any) => lesson.id === item.lessonId)?.type === "SPELLING").length,
        rhyme: questions.filter((item: any) => all.find((lesson: any) => lesson.id === item.lessonId)?.type === "RHYME").length
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  async function loadActivities(lessonId: string) {
    if (!lessonId) { setActivities([]); return; }
    setLoadingActivities(true);
    try {
      const res = await adminApi.list("/activities");
      const all = (res.data.data || []) as Activity[];
      const filtered = all.filter((a) => a.lessonId === lessonId);
      filtered.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
      setActivities(filtered);
    } catch (e) { console.error(e); }
    finally { setLoadingActivities(false); }
  }

  useEffect(() => { if (selectedLessonId) loadActivities(selectedLessonId); }, [selectedLessonId]);

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3000); };
  const selectedLesson = lessons.find((l) => l.id === selectedLessonId);
  const filteredLessons = lessonSearch ? lessons.filter((l) => l.title?.toLowerCase().includes(lessonSearch.toLowerCase())) : lessons;
  const skillOptions = skills.filter((s: any) => s.isActive).map((s: any) => ({ value: s.key, label: s.label }));

  const needsOptions = ["MULTIPLE_CHOICE", "LISTEN_AND_CHOOSE_IMAGE", "LOOK_AND_CHOOSE_WORD", "EMOTION_RECOGNITION", "DAILY_LIFE_SCENARIO"].includes(activityType);
  const needsVoice = activityType === "VOICE_ANSWER" || activityType === "HEAR_AND_REPEAT";
  const needsParent = activityType === "PARENT_MARK_RESULT";
  const needsFlashcard = activityType === "FLASHCARD_REVIEW";
  const needsMatch = activityType === "MATCH_OBJECTS";

  const resetForm = () => {
    setPrompt(""); setInstruction(""); setParentInstruction("");
    setOptions([{ text: "", isCorrect: true }, { text: "", isCorrect: false }]);
    setAudioUrl(""); setImageUrl(""); setAcceptedAnswersStr(""); setAlmostAnswersStr("");
    setRetryLimit(3); setFeedbackCorrect(""); setFeedbackWrong(""); setFeedbackAlmost("");
    setTtsPromptText(""); setIsActive(true); setActivitySkillTags([]); setFormErrors([]);
    setAccessType("FREE");
    setVoicePremiumRequired(false);
    setOrderIndex(activities.length ? Math.max(...activities.map((a) => a.orderIndex ?? 0)) + 10 : 10);
  };

  const openAddModal = () => {
    setEditingActivity(null);
    setActivityType("MULTIPLE_CHOICE");
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (act: Activity) => {
    setEditingActivity(act);
    setActivityType(act.activityType || "MULTIPLE_CHOICE");
    setPrompt(act.prompt || ""); setInstruction(act.instruction || "");
    setParentInstruction(act.parentInstruction || "");
    setOptions(act.options?.length ? act.options.map((o: any) => ({
      text: o.text || "", imageUrl: o.imageUrl || "", isCorrect: !!o.isCorrect
    })) : [{ text: "", isCorrect: true }, { text: "", isCorrect: false }]);
    setAudioUrl(act.audioUrl || ""); setImageUrl(act.imageUrl || "");
    setAcceptedAnswersStr((act.acceptedAnswers || []).join(", "));
    setAlmostAnswersStr((act.almostAnswers || []).join(", "));
    setRetryLimit(act.retryLimit ?? 3);
    setFeedbackCorrect(act.feedback?.correct || ""); setFeedbackWrong(act.feedback?.wrong || "");
    setFeedbackAlmost(act.feedback?.almost || "");
    setTtsPromptText(act.ttsPromptText || "");
    setOrderIndex(act.orderIndex ?? 0); setIsActive(act.isActive !== false);
    setActivitySkillTags(act.skillTags || []);
    setAccessType(act.accessType || "FREE");
    setVoicePremiumRequired(act.voicePremiumRequired === true);
    setFormErrors([]);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      lessonId: selectedLessonId, activityType, prompt: prompt.trim(),
      instruction: instruction.trim() || null,
      orderIndex: Number(orderIndex), isActive,
      skillTags: activitySkillTags,
      accessType,
      voicePremiumRequired: needsVoice ? voicePremiumRequired : false,
      options: needsOptions ? options.map((o) => ({ text: o.text.trim(), imageUrl: o.imageUrl || null, isCorrect: o.isCorrect })) : null,
      audioUrl: audioUrl.trim() || null, imageUrl: imageUrl.trim() || null,
      feedback: { correct: feedbackCorrect.trim() || null, wrong: feedbackWrong.trim() || null, almost: feedbackAlmost.trim() || null },
    };

    if (needsVoice) {
      payload.acceptedAnswers = acceptedAnswersStr.split(",").map((s) => s.trim()).filter(Boolean);
      payload.almostAnswers = almostAnswersStr.split(",").map((s) => s.trim()).filter(Boolean);
      payload.retryLimit = retryLimit;
      payload.ttsPromptText = ttsPromptText.trim() || null;
    }

    if (needsParent) {
      payload.parentInstruction = parentInstruction.trim();
    }

    const validationErrors = validateActivityRequired(payload);
    if (validationErrors.length > 0) { setFormErrors(validationErrors); return; }
    setFormErrors([]);

    try {
      if (editingActivity) await adminApi.update("/activities", editingActivity.id, payload);
      else await adminApi.create("/activities", payload);
      setIsModalOpen(false);
      showToast(editingActivity ? "Cập nhật thành công!" : "Tạo mới thành công!");
      loadActivities(selectedLessonId);
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa hoạt động này?")) return;
    await adminApi.remove("/activities", id);
    showToast("Đã xóa!"); loadActivities(selectedLessonId);
  };

  const moveActivity = async (act: Activity, direction: "up" | "down") => {
    const idx = activities.indexOf(act);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= activities.length) return;
    const other = activities[swapIdx];
    await Promise.all([
      adminApi.update("/activities", act.id, { orderIndex: other.orderIndex }),
      adminApi.update("/activities", other.id, { orderIndex: act.orderIndex })
    ]);
    loadActivities(selectedLessonId);
  };

  const updateOption = (idx: number, field: keyof OptionItem, value: any) => {
    setOptions(options.map((o, i) => i === idx ? { ...o, [field]: value } : o));
  };

  const addOption = () => { if (options.length < 4) setOptions([...options, { text: "", isCorrect: false }]); };
  const removeOption = (idx: number) => { if (options.length > 2) setOptions(options.filter((_, i) => i !== idx)); };

  const importFromLibrary = (source: "flashcards" | "dialogues" | "math" | "thinking" | "spelling" | "rhyme") => {
    const presets: Record<typeof source, { type: ActivityType; prompt: string; instruction: string }> = {
      flashcards: {
        type: "FLASHCARD_REVIEW",
        prompt: "Ôn tập bằng flashcard từ thư viện",
        instruction: "Chọn flashcard phù hợp trong thư viện và cấu hình nội dung cho hoạt động."
      },
      dialogues: {
        type: "DAILY_LIFE_SCENARIO",
        prompt: "Luyện giao tiếp từ hội thoại trong thư viện",
        instruction: "Chọn hội thoại phù hợp trong thư viện để chuyển thành tình huống giao tiếp."
      },
      math: {
        type: "MULTIPLE_CHOICE",
        prompt: "Câu hỏi toán từ thư viện",
        instruction: "Chọn câu hỏi toán phù hợp rồi tinh chỉnh đáp án cho hoạt động."
      },
      thinking: {
        type: "MULTIPLE_CHOICE",
        prompt: "Câu hỏi tư duy từ thư viện",
        instruction: "Chọn câu hỏi tư duy phù hợp rồi tinh chỉnh đáp án cho hoạt động."
      },
      spelling: {
        type: "LOOK_AND_CHOOSE_WORD",
        prompt: "Câu hỏi đánh vần từ thư viện",
        instruction: "Chọn câu hỏi đánh vần phù hợp rồi tinh chỉnh cho hoạt động."
      },
      rhyme: {
        type: "LOOK_AND_CHOOSE_WORD",
        prompt: "Câu hỏi ghép vần từ thư viện",
        instruction: "Chọn câu hỏi ghép vần phù hợp rồi tinh chỉnh cho hoạt động."
      }
    };
    const preset = presets[source];
    setActivityType(preset.type);
    setPrompt(preset.prompt);
    setInstruction(preset.instruction);
    showToast("Đã tạo khung hoạt động từ thư viện. Bước chọn item cụ thể sẽ được nối với engine import ở phase tiếp theo.");
    if (!isModalOpen) {
      resetForm();
      setActivityType(preset.type);
      setPrompt(preset.prompt);
      setInstruction(preset.instruction);
      setIsModalOpen(true);
    }
  };

  return (
    <div>
      <div className="toolbar">
        <div>
          <h1>Hoạt động trong bài học</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "4px" }}>Tạo từng câu hỏi hoặc nhiệm vụ nhỏ trong một bài học.</p>
        </div>
      </div>

      <div className="drawer-container">
        {/* Lesson selector panel */}
        <div style={{ width: "280px", flexShrink: 0 }}>
          <div className="panel" style={{ padding: "12px" }}>
            <input type="text" placeholder="Tìm bài học..." value={lessonSearch} onChange={(e) => setLessonSearch(e.target.value)} style={{ marginBottom: "12px" }} />
            <div style={{ maxHeight: "480px", overflowY: "auto" }}>
              {loading ? <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Đang tải dữ liệu...</p> : filteredLessons.map((l) => (
                <div
                  key={l.id}
                  onClick={() => setSelectedLessonId(l.id)}
                  style={{
                    padding: "8px 12px", borderRadius: "6px", cursor: "pointer", marginBottom: "4px", fontSize: "13px",
                    background: selectedLessonId === l.id ? "var(--primary-light)" : "transparent",
                    color: selectedLessonId === l.id ? "var(--primary)" : "var(--text-main)",
                    fontWeight: selectedLessonId === l.id ? "600" : "400"
                  }}
                >
                  {l.title}
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{uiLabel(l.lessonType || l.type)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activities list */}
        <div className="drawer-main">
          {!selectedLessonId ? (
            <div className="panel" style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>👈</div>
              <h3 style={{ margin: "0 0 8px 0", color: "var(--text-main)", fontWeight: "700" }}>Chưa chọn bài học</h3>
              <p style={{ color: "var(--text-muted)", margin: "0", fontSize: "14px" }}>
                Chọn một bài học từ danh sách bên trái để xem, sắp xếp và thêm mới các hoạt động.
              </p>
            </div>
          ) : (
            <>
              {selectedLesson && (
                <div className="panel" style={{ padding: "16px", marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                    <div>
                      <strong>{selectedLesson.title}</strong>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "8px" }}>{selectedLesson.lessonType || selectedLesson.type}</span>
                    </div>
                    <button onClick={openAddModal}>➕ Thêm hoạt động</button>
                  </div>
                  <div style={{ borderTop: "1px solid var(--border)", marginTop: "14px", paddingTop: "14px" }}>
                    <strong style={{ display: "block", marginBottom: "4px" }}>Import từ thư viện nội dung</strong>
                    <p style={{ color: "var(--text-muted)", margin: "0 0 10px 0", fontSize: "13px" }}>
                      Dùng kho nội dung học làm nguồn tái sử dụng để tạo nhanh khung hoạt động trong bài học này.
                    </p>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {[
                        ["flashcards", "Import từ thư viện Flashcard"],
                        ["dialogues", "Import từ thư viện Hội thoại"],
                        ["math", "Import từ thư viện Toán"],
                        ["thinking", "Import từ thư viện Tư duy"],
                        ["spelling", "Import từ thư viện Đánh vần"],
                        ["rhyme", "Import từ thư viện Ghép vần"]
                      ].map(([source, label]) => (
                        <button key={source} type="button" className="secondary" onClick={() => importFromLibrary(source as any)}>
                          {label} ({contentLibraryCounts[source] || 0})
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {loadingActivities ? <p>Đang tải hoạt động...</p> : activities.length === 0 ? (
                <div className="panel" style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div style={{ fontSize: "40px", marginBottom: "12px" }}>🧩</div>
                  <h3 style={{ margin: "0 0 8px 0", color: "var(--text-main)", fontWeight: "700" }}>Chưa có hoạt động nào</h3>
                  <p style={{ color: "var(--text-muted)", margin: "0 0 16px 0", fontSize: "14px" }}>
                    Bài học này đang trống. Hãy tạo hoạt động đầu tiên để trẻ bắt đầu học tập.
                  </p>
                  <button onClick={openAddModal}>➕ Thêm Hoạt Động Đầu Tiên</button>
                </div>
              ) : (
                <div>
                  {activities.map((act, idx) => (
                    <div key={act.id} className="path-item-card">
                      <div className="path-item-seq">{idx + 1}</div>
                      <div className="path-item-info">
                        <strong>{act.prompt || "Hoạt động"}</strong>
                        <small style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "4px" }}>
                          <span className="badge info">
                            {ACTIVITY_TYPE_LABELS[act.activityType] || act.activityType}
                          </span>
                          <span className={`badge ${act.accessType === "PREMIUM" ? "premium" : "free"}`}>
                            {uiLabel(act.accessType || "FREE")}
                          </span>
                          {act.options?.length ? <span>{act.options.length} lựa chọn</span> : ""}
                        </small>
                      </div>
                      <div className="path-item-actions">
                        <button className="secondary" disabled={idx === 0} onClick={() => moveActivity(act, "up")}>↑</button>
                        <button className="secondary" disabled={idx === activities.length - 1} onClick={() => moveActivity(act, "down")}>↓</button>
                        <button className="secondary" onClick={() => openEditModal(act)}>Sửa</button>
                        <button className="danger" onClick={() => handleDelete(act.id)}>Xóa</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Activity form modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "min(820px, 95vw)" }}>
            <div className="modal-header">
              <h2>{editingActivity ? "Chỉnh sửa hoạt động" : "Thêm hoạt động"}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formErrors.length > 0 && (
                  <div className="validation-warnings">
                    <p>⚠️ Lỗi:</p>
                    <ul>{formErrors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                  </div>
                )}

                <div className="drawer-container">
                  <div className="drawer-main" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div className="field">
                      <label>Loại hoạt động <span style={{ color: "red" }}>*</span></label>
                      <select value={activityType} onChange={(e) => setActivityType(e.target.value as ActivityType)}>
                        {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{ACTIVITY_TYPE_LABELS[t] || t}</option>)}
                      </select>
                    </div>

                    <div className="field">
                      <label>Câu hỏi / Đề bài <span style={{ color: "red" }}>*</span></label>
                      <textarea placeholder="VD: Con vật nào kêu 'meo meo'?" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                    </div>

                    <div className="field">
                      <label>Hướng dẫn ngắn</label>
                      <input type="text" placeholder="Gợi ý ngắn cho trẻ" value={instruction} onChange={(e) => setInstruction(e.target.value)} />
                    </div>

                    {/* Media fields */}
                    {(activityType === "LISTEN_AND_CHOOSE_IMAGE" || activityType === "HEAR_AND_REPEAT" || needsVoice) && (
                      <div className="field">
                        <label>Đường dẫn âm thanh</label>
                        <input type="text" placeholder="https://..." value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} />
                      </div>
                    )}

                    {(activityType === "LOOK_AND_CHOOSE_WORD" || activityType === "EMOTION_RECOGNITION" || activityType === "DAILY_LIFE_SCENARIO") && (
                      <div className="field">
                        <label>Hình ảnh URL</label>
                        <input type="text" placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
                      </div>
                    )}

                    {/* Options for multi-choice types */}
                    {needsOptions && (
                      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <label style={{ fontWeight: "600" }}>Lựa chọn ({options.length}/4)</label>
                          {options.length < 4 && <button type="button" className="secondary" onClick={addOption} style={{ padding: "4px 10px", fontSize: "12px" }}>+ Thêm</button>}
                        </div>
                        {options.map((opt, i) => (
                          <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
                            <input type="text" placeholder={`Lựa chọn ${String.fromCharCode(65 + i)}`} value={opt.text} onChange={(e) => updateOption(i, "text", e.target.value)} style={{ flex: 1 }} />
                            {(activityType === "LISTEN_AND_CHOOSE_IMAGE" || activityType === "EMOTION_RECOGNITION") && (
                              <input type="text" placeholder="Đường dẫn hình ảnh" value={opt.imageUrl || ""} onChange={(e) => updateOption(i, "imageUrl", e.target.value)} style={{ width: "160px" }} />
                            )}
                            <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", whiteSpace: "nowrap" }}>
                              <input type="checkbox" checked={opt.isCorrect} onChange={(e) => updateOption(i, "isCorrect", e.target.checked)} style={{ width: "16px", height: "16px" }} />
                              Đúng
                            </label>
                            {options.length > 2 && <button type="button" className="danger" onClick={() => removeOption(i)} style={{ padding: "4px 8px", fontSize: "11px" }}>×</button>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Voice fields */}
                    {needsVoice && (
                      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                        <h3 style={{ fontSize: "14px", marginBottom: "8px", color: "var(--text-muted)" }}>Cấu hình giọng nói</h3>
                        <div className="field">
                          <label>Nội dung đọc cho trẻ</label>
                          <input type="text" value={ttsPromptText} onChange={(e) => setTtsPromptText(e.target.value)} placeholder="Nội dung TTS phát cho trẻ" />
                        </div>
                        <div className="field">
                          <label>Đáp án chấp nhận (phân cách bởi dấu phẩy)</label>
                          <input type="text" value={acceptedAnswersStr} onChange={(e) => setAcceptedAnswersStr(e.target.value)} placeholder="con mèo, mèo" />
                        </div>
                        <div className="field">
                          <label>Đáp án gần đúng</label>
                          <input type="text" value={almostAnswersStr} onChange={(e) => setAlmostAnswersStr(e.target.value)} placeholder="con chó, chó" />
                        </div>
                        <div className="field">
                          <label>Số lần thử lại</label>
                          <input type="number" min={0} max={10} value={retryLimit} onChange={(e) => setRetryLimit(Number(e.target.value))} />
                        </div>
                        <div className="field check-row" style={{ marginTop: "8px" }}>
                          <input type="checkbox" id="voicePremiumRequired" checked={voicePremiumRequired} onChange={(e) => setVoicePremiumRequired(e.target.checked)} />
                          <label htmlFor="voicePremiumRequired" style={{ fontWeight: "normal", cursor: "pointer" }}>Yêu cầu giọng nói Premium</label>
                        </div>
                      </div>
                    )}

                    {/* Parent instruction */}
                    {needsParent && (
                      <div className="field">
                        <label>Hướng dẫn phụ huynh <span style={{ color: "red" }}>*</span></label>
                        <textarea placeholder="Mô tả chi tiết cho phụ huynh quan sát và đánh giá..." value={parentInstruction} onChange={(e) => setParentInstruction(e.target.value)} />
                      </div>
                    )}

                    {/* Feedback */}
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                      <h3 style={{ fontSize: "14px", marginBottom: "8px", color: "var(--text-muted)" }}>Phản hồi</h3>
                      <div className="feedback-group">
                        <div className="field">
                          <label>Phản hồi đúng</label>
                          <input type="text" value={feedbackCorrect} onChange={(e) => setFeedbackCorrect(e.target.value)} placeholder="Giỏi lắm!" />
                        </div>
                        <div className="field">
                          <label>Phản hồi sai</label>
                          <input type="text" value={feedbackWrong} onChange={(e) => setFeedbackWrong(e.target.value)} placeholder="Thử lại nhé!" />
                        </div>
                      </div>
                      {needsVoice && (
                        <div className="field" style={{ marginTop: "8px" }}>
                          <label>Phản hồi gần đúng</label>
                          <input type="text" value={feedbackAlmost} onChange={(e) => setFeedbackAlmost(e.target.value)} placeholder="Gần đúng rồi!" />
                        </div>
                      )}
                    </div>

                    <MultiSelect label="Kỹ năng liên quan" options={skillOptions} selected={activitySkillTags} onChange={setActivitySkillTags} />

                    <div className="form-grid">
                      <div className="field">
                        <label>Thứ tự</label>
                        <input type="number" value={orderIndex} onChange={(e) => setOrderIndex(Number(e.target.value))} />
                      </div>
                      <div className="field">
                        <label>Truy cập</label>
                        <select value={accessType} onChange={(e) => setAccessType(e.target.value as AccessType)}>
                          <option value="FREE">Miễn phí</option>
                          <option value="PREMIUM">Premium</option>
                        </select>
                      </div>
                    </div>
                    <div className="field check-row">
                      <input type="checkbox" id="actIsActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                      <label htmlFor="actIsActive" style={{ fontWeight: "normal", cursor: "pointer" }}>Đang hoạt động</label>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="drawer-aside" style={{ width: "260px" }}>
                    <h3>Xem trước</h3>
                    <div className="activity-preview" style={{ marginTop: "12px" }}>
                      <div className="activity-preview-header">{ACTIVITY_TYPE_LABELS[activityType] || activityType}</div>
                      <div className="activity-preview-prompt">{prompt || "Câu hỏi sẽ hiện ở đây"}</div>
                      {needsOptions && (
                        <div className="activity-preview-options">
                          {options.filter((o) => o.text).map((o, i) => (
                            <div key={i} className={`activity-preview-option ${o.isCorrect ? "correct" : ""}`}>
                              {o.text}
                            </div>
                          ))}
                        </div>
                      )}
                      {needsVoice && (
                        <div style={{ textAlign: "center", fontSize: "13px", color: "var(--text-muted)", marginTop: "12px" }}>
                          🎤 Trẻ trả lời bằng giọng nói
                        </div>
                      )}
                      {needsParent && (
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "12px", padding: "8px", background: "#f0f9ff", borderRadius: "8px" }}>
                          👨‍👩‍👧 {parentInstruction || "Hướng dẫn phụ huynh"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
                <button type="submit">{editingActivity ? "Cập nhật" : "Tạo mới"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMsg && <div className="toast"><span>✨</span> {toastMsg}</div>}
    </div>
  );
}
