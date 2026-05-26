import { useEffect, useState } from "react";
import type { AiConversationTopic, AiConversationTopicPayload } from "../api/aiConversationApi";
import { ToggleSwitch } from "../components/ToggleSwitch";

interface Props {
  topic: AiConversationTopic | null;
  onCancel: () => void;
  onSubmit: (payload: AiConversationTopicPayload) => Promise<void>;
}

export function AiConversationTopicFormPage({ topic, onCancel, onSubmit }: Props) {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ageRangeMin, setAgeRangeMin] = useState("");
  const [ageRangeMax, setAgeRangeMax] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("BEGINNER");
  const [iconName, setIconName] = useState("");
  const [mascotReaction, setMascotReaction] = useState("welcome");
  const [estimatedDurationSeconds, setEstimatedDurationSeconds] = useState("180");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState("0");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCode(topic?.code ?? "");
    setTitle(topic?.title ?? "");
    setDescription(topic?.description ?? "");
    setAgeRangeMin(topic?.ageRangeMin == null ? "" : `${topic.ageRangeMin}`);
    setAgeRangeMax(topic?.ageRangeMax == null ? "" : `${topic.ageRangeMax}`);
    setDifficultyLevel(topic?.difficultyLevel ?? "BEGINNER");
    setIconName(topic?.iconName ?? "");
    setMascotReaction(topic?.mascotReaction ?? "welcome");
    setEstimatedDurationSeconds(`${topic?.estimatedDurationSeconds ?? 180}`);
    setIsActive(topic?.isActive ?? true);
    setSortOrder(`${topic?.sortOrder ?? 0}`);
    setErrors({});
  }, [topic]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!code.trim()) next.code = "Mã chủ đề không được để trống.";
    if (!title.trim()) next.title = "Tên chủ đề không được để trống.";
    const duration = Number(estimatedDurationSeconds);
    if (!Number.isFinite(duration) || duration < 30) {
      next.estimatedDurationSeconds = "Thời lượng tối thiểu là 30 giây.";
    }
    if (!Number.isFinite(Number(sortOrder))) {
      next.sortOrder = "Thứ tự phải là một số hợp lệ.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await onSubmit({
        code: code.trim(),
        title: title.trim(),
        description: description.trim() || null,
        ageRangeMin: ageRangeMin.trim() ? Number(ageRangeMin) : null,
        ageRangeMax: ageRangeMax.trim() ? Number(ageRangeMax) : null,
        difficultyLevel,
        iconName: iconName.trim() || null,
        mascotReaction: mascotReaction.trim() || "welcome",
        estimatedDurationSeconds: Number(estimatedDurationSeconds),
        isActive,
        sortOrder: Number(sortOrder)
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()} style={{ width: "min(780px, 95vw)" }}>
        <div className="modal-header">
          <h2>{topic ? "Chỉnh sửa chủ đề hội thoại" : "Thêm chủ đề hội thoại mới"}</h2>
          <button className="modal-close" onClick={onCancel} type="button">&times;</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Section A: Thông tin cơ bản */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <h3 style={{ margin: "0", fontSize: "15px", borderBottom: "1px solid var(--border)", paddingBottom: "6px", color: "var(--text-main)" }}>
                a. Thông tin cơ bản
              </h3>
              <div className="form-grid">
                <div className="field">
                  <label>Mã chủ đề <span style={{ color: "red" }}>*</span></label>
                  <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="VD: greeting" />
                  {errors.code && <span className="error-msg">{errors.code}</span>}
                </div>
                <div className="field">
                  <label>Tên chủ đề <span style={{ color: "red" }}>*</span></label>
                  <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="VD: Chào hỏi và làm quen" />
                  {errors.title && <span className="error-msg">{errors.title}</span>}
                </div>
              </div>
              <div className="field">
                <label>Mô tả ngắn</label>
                <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} placeholder="Mô tả tóm tắt nội dung bé sẽ luyện nói..." />
              </div>
            </div>

            {/* Section B: Cấu hình hiển thị */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <h3 style={{ margin: "0", fontSize: "15px", borderBottom: "1px solid var(--border)", paddingBottom: "6px", color: "var(--text-main)" }}>
                b. Cấu hình hiển thị & Độ tuổi
              </h3>
              <div className="form-grid">
                <div className="field">
                  <label>Tuổi nhỏ nhất</label>
                  <input type="number" value={ageRangeMin} onChange={(event) => setAgeRangeMin(event.target.value)} min="0" placeholder="VD: 4" />
                </div>
                <div className="field">
                  <label>Tuổi lớn nhất</label>
                  <input type="number" value={ageRangeMax} onChange={(event) => setAgeRangeMax(event.target.value)} min="0" placeholder="VD: 8" />
                </div>
                <div className="field">
                  <label>Độ khó</label>
                  <select value={difficultyLevel} onChange={(event) => setDifficultyLevel(event.target.value)}>
                    <option value="BEGINNER">Dễ (Beginner)</option>
                    <option value="BASIC">Trung bình (Basic)</option>
                    <option value="INTERMEDIATE">Khó (Intermediate)</option>
                  </select>
                </div>
              </div>
              <div className="form-grid">
                <div className="field">
                  <label>Tên Icon</label>
                  <input value={iconName} onChange={(event) => setIconName(event.target.value)} placeholder="VD: waving_hand" />
                </div>
                <div className="field">
                  <label>Mascot biểu cảm</label>
                  <select value={mascotReaction} onChange={(event) => setMascotReaction(event.target.value)}>
                    <option value="welcome">Chào mừng (welcome)</option>
                    <option value="listening carefully">Đang chăm chú nghe (listening carefully)</option>
                    <option value="correct answer">Bé trả lời đúng (correct answer)</option>
                    <option value="try again">Bé cần thử lại (try again)</option>
                    <option value="great job">Khen ngợi bé (great job)</option>
                    <option value="lesson complete">Hoàn thành chủ đề (lesson complete)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section C: Trạng thái & sắp xếp */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <h3 style={{ margin: "0", fontSize: "15px", borderBottom: "1px solid var(--border)", paddingBottom: "6px", color: "var(--text-main)" }}>
                c. Trạng thái & sắp xếp
              </h3>
              <div className="form-grid">
                <div className="field">
                  <label>Thời lượng ước tính (giây) <span style={{ color: "red" }}>*</span></label>
                  <input type="number" value={estimatedDurationSeconds} onChange={(event) => setEstimatedDurationSeconds(event.target.value)} min="30" />
                  {errors.estimatedDurationSeconds && <span className="error-msg">{errors.estimatedDurationSeconds}</span>}
                </div>
                <div className="field">
                  <label>Thứ tự hiển thị</label>
                  <input type="number" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} />
                  {errors.sortOrder && <span className="error-msg">{errors.sortOrder}</span>}
                </div>
              </div>
              <div style={{ marginTop: "8px", display: "flex", justifyContent: "flex-end" }}>
                <ToggleSwitch
                  id="topicActive"
                  label={isActive ? "Chủ đề đang bật (Hiển thị cho bé)" : "Chủ đề đã tắt (Tạm ẩn)"}
                  checked={isActive}
                  onChange={setIsActive}
                />
              </div>
            </div>

          </div>
          <div className="modal-footer">
            <button type="button" className="secondary" onClick={onCancel}>Hủy</button>
            <button type="submit" disabled={saving}>
              {saving ? "Đang lưu..." : topic ? "Cập nhật chủ đề" : "Lưu chủ đề"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
