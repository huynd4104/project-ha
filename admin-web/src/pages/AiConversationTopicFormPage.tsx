import { useEffect, useState } from "react";
import type { AiConversationTopic, AiConversationTopicPayload } from "../api/aiConversationApi";

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
  const [difficultyLevel, setDifficultyLevel] = useState("1");
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
    setDifficultyLevel(`${topic?.difficultyLevel ?? 1}`);
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
    if (!Number.isFinite(Number(estimatedDurationSeconds)) || Number(estimatedDurationSeconds) < 30) next.estimatedDurationSeconds = "Thời lượng tối thiểu 30 giây.";
    if (!Number.isFinite(Number(sortOrder))) next.sortOrder = "Thứ tự phải là số.";
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
          <h2>{topic ? "Sửa chủ đề" : "Thêm chủ đề"}</h2>
          <button className="modal-close" onClick={onCancel} type="button">&times;</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-grid">
              <label>
                Mã chủ đề
                <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="greeting" />
                {errors.code && <span className="error-msg">{errors.code}</span>}
              </label>
              <label>
                Tên chủ đề
                <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Chào hỏi" />
                {errors.title && <span className="error-msg">{errors.title}</span>}
              </label>
              <label>
                Tuổi nhỏ nhất
                <input type="number" value={ageRangeMin} onChange={(event) => setAgeRangeMin(event.target.value)} min="0" />
              </label>
              <label>
                Tuổi lớn nhất
                <input type="number" value={ageRangeMax} onChange={(event) => setAgeRangeMax(event.target.value)} min="0" />
              </label>
              <label>
                Độ khó
                <select value={difficultyLevel} onChange={(event) => setDifficultyLevel(event.target.value)}>
                  <option value="BEGINNER">BEGINNER</option>
                  <option value="BASIC">BASIC</option>
                  <option value="INTERMEDIATE">INTERMEDIATE</option>
                </select>
              </label>
              <label>
                Thời lượng giây
                <input type="number" value={estimatedDurationSeconds} onChange={(event) => setEstimatedDurationSeconds(event.target.value)} min="30" />
                {errors.estimatedDurationSeconds && <span className="error-msg">{errors.estimatedDurationSeconds}</span>}
              </label>
              <label>
                Icon
                <input value={iconName} onChange={(event) => setIconName(event.target.value)} placeholder="waving_hand" />
              </label>
              <label>
                Mascot reaction
                <select value={mascotReaction} onChange={(event) => setMascotReaction(event.target.value)}>
                  <option value="welcome">welcome</option>
                  <option value="listening carefully">listening carefully</option>
                  <option value="correct answer">correct answer</option>
                  <option value="try again">try again</option>
                  <option value="great job">great job</option>
                  <option value="lesson complete">lesson complete</option>
                </select>
              </label>
              <label>
                Thứ tự
                <input type="number" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} />
                {errors.sortOrder && <span className="error-msg">{errors.sortOrder}</span>}
              </label>
              <label style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "24px" }}>
                <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
                Đang hoạt động
              </label>
            </div>
            <label style={{ marginTop: "16px" }}>
              Mô tả
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="Luyện cách chào hỏi và trả lời đơn giản." />
            </label>
          </div>
          <div className="modal-footer">
            <button type="button" className="secondary" onClick={onCancel}>Hủy</button>
            <button type="submit" disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
