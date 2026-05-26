import { useEffect, useState } from "react";
import type {
  AiConversationEvaluationType,
  AiConversationQuestion,
  AiConversationQuestionPayload
} from "../api/aiConversationApi";

interface Props {
  question: AiConversationQuestion | null;
  onCancel: () => void;
  onSubmit: (payload: AiConversationQuestionPayload) => Promise<void>;
}

const evaluationTypes: AiConversationEvaluationType[] = ["EXACT", "KEYWORD", "SEMANTIC", "OPEN_ENDED"];

export function AiConversationQuestionFormPage({ question, onCancel, onSubmit }: Props) {
  const [questionText, setQuestionText] = useState("");
  const [questionAudioText, setQuestionAudioText] = useState("");
  const [expectedAnswer, setExpectedAnswer] = useState("");
  const [acceptedKeywords, setAcceptedKeywords] = useState("");
  const [alternativeAnswers, setAlternativeAnswers] = useState("");
  const [evaluationType, setEvaluationType] = useState<AiConversationEvaluationType>("KEYWORD");
  const [hintText, setHintText] = useState("");
  const [positiveFeedback, setPositiveFeedback] = useState("");
  const [retryFeedback, setRetryFeedback] = useState("");
  const [maxAttempts, setMaxAttempts] = useState("2");
  const [skillTags, setSkillTags] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("1");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setQuestionText(question?.questionText ?? "");
    setQuestionAudioText(question?.questionAudioText ?? "");
    setExpectedAnswer(question?.expectedAnswer ?? "");
    setAcceptedKeywords((question?.acceptedKeywords ?? []).join("\n"));
    setAlternativeAnswers((question?.alternativeAnswers ?? []).join("\n"));
    setEvaluationType(question?.evaluationType ?? "KEYWORD");
    setHintText(question?.hintText ?? "");
    setPositiveFeedback(question?.positiveFeedback ?? "");
    setRetryFeedback(question?.retryFeedback ?? "");
    setMaxAttempts(`${question?.maxAttempts ?? 2}`);
    setSkillTags((question?.skillTags ?? []).join("\n"));
    setDifficultyLevel(`${question?.difficultyLevel ?? 1}`);
    setSortOrder(`${question?.sortOrder ?? 0}`);
    setIsActive(question?.isActive ?? true);
    setErrors({});
  }, [question]);

  const parseList = (value: string) =>
    value.split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!questionText.trim()) next.questionText = "Câu hỏi không được để trống.";
    if (!evaluationType) next.evaluationType = "Cần chọn kiểu đánh giá.";
    if (!Number.isFinite(Number(maxAttempts)) || Number(maxAttempts) < 1) next.maxAttempts = "Số lần thử phải từ 1 trở lên.";
    if (!Number.isFinite(Number(sortOrder))) next.sortOrder = "Thứ tự phải là số.";
    if (evaluationType === "KEYWORD" && parseList(acceptedKeywords).length === 0) {
      next.acceptedKeywords = "KEYWORD cần ít nhất một từ khóa chấp nhận.";
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
        questionText: questionText.trim(),
        questionAudioText: questionAudioText.trim() || null,
        expectedAnswer: expectedAnswer.trim() || null,
        acceptedKeywords: parseList(acceptedKeywords),
        alternativeAnswers: parseList(alternativeAnswers),
        evaluationType,
        hintText: hintText.trim() || null,
        positiveFeedback: positiveFeedback.trim() || null,
        retryFeedback: retryFeedback.trim() || null,
        maxAttempts: Number(maxAttempts),
        skillTags: parseList(skillTags),
        difficultyLevel,
        sortOrder: Number(sortOrder),
        isActive
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()} style={{ width: "min(900px, 95vw)" }}>
        <div className="modal-header">
          <h2>{question ? "Sửa câu hỏi" : "Thêm câu hỏi"}</h2>
          <button className="modal-close" onClick={onCancel} type="button">&times;</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <label>
              Câu hỏi
              <textarea value={questionText} onChange={(event) => setQuestionText(event.target.value)} rows={2} />
              {errors.questionText && <span className="error-msg">{errors.questionText}</span>}
            </label>
            <div className="form-grid" style={{ marginTop: "16px" }}>
              <label>
                Text AI đọc
                <input value={questionAudioText} onChange={(event) => setQuestionAudioText(event.target.value)} />
              </label>
              <label>
                Đáp án kỳ vọng
                <input value={expectedAnswer} onChange={(event) => setExpectedAnswer(event.target.value)} />
              </label>
              <label>
                Kiểu đánh giá
                <select value={evaluationType} onChange={(event) => setEvaluationType(event.target.value as AiConversationEvaluationType)}>
                  {evaluationTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                {errors.evaluationType && <span className="error-msg">{errors.evaluationType}</span>}
              </label>
              <label>
                Số lần thử
                <input type="number" min="1" value={maxAttempts} onChange={(event) => setMaxAttempts(event.target.value)} />
                {errors.maxAttempts && <span className="error-msg">{errors.maxAttempts}</span>}
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
                Thứ tự
                <input type="number" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} />
                {errors.sortOrder && <span className="error-msg">{errors.sortOrder}</span>}
              </label>
            </div>
            <div className="form-grid" style={{ marginTop: "16px" }}>
              <label>
                Từ khóa chấp nhận
                <textarea value={acceptedKeywords} onChange={(event) => setAcceptedKeywords(event.target.value)} rows={4} placeholder="Mỗi dòng một từ khóa" />
                {errors.acceptedKeywords && <span className="error-msg">{errors.acceptedKeywords}</span>}
              </label>
              <label>
                Đáp án thay thế
                <textarea value={alternativeAnswers} onChange={(event) => setAlternativeAnswers(event.target.value)} rows={4} placeholder="Mỗi dòng một đáp án" />
              </label>
              <label>
                Skill tags
                <textarea value={skillTags} onChange={(event) => setSkillTags(event.target.value)} rows={4} placeholder="greeting&#10;social_communication" />
              </label>
            </div>
            <div className="form-grid" style={{ marginTop: "16px" }}>
              <label>
                Gợi ý
                <textarea value={hintText} onChange={(event) => setHintText(event.target.value)} rows={3} />
              </label>
              <label>
                Feedback đúng
                <textarea value={positiveFeedback} onChange={(event) => setPositiveFeedback(event.target.value)} rows={3} />
              </label>
              <label>
                Feedback thử lại
                <textarea value={retryFeedback} onChange={(event) => setRetryFeedback(event.target.value)} rows={3} />
              </label>
            </div>
            <label style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "16px" }}>
              <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
              Đang hoạt động
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
