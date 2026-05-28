import { useEffect, useState } from "react";
import type {
  AiConversationEvaluationType,
  AiConversationQuestion,
  AiConversationQuestionPayload
} from "../api/aiConversationApi";
import { ToggleSwitch } from "../components/ToggleSwitch";

interface Props {
  question: AiConversationQuestion | null;
  onCancel: () => void;
  onSubmit: (payload: AiConversationQuestionPayload) => Promise<void>;
}

const evaluationTypes: { value: AiConversationEvaluationType; label: string }[] = [
  { value: "KEYWORD", label: "Theo từ khóa (KEYWORD)" },
  { value: "SEMANTIC", label: "Theo ngữ nghĩa (SEMANTIC)" },
  { value: "EXACT", label: "Khớp chính xác (EXACT)" },
  { value: "OPEN_ENDED", label: "Câu hỏi mở (OPEN_ENDED)" }
];

export function AiConversationQuestionFormPage({ question, onCancel, onSubmit }: Props) {
  const [questionText, setQuestionText] = useState("");
  const [questionAudioText, setQuestionAudioText] = useState("");
  const [expectedAnswer, setExpectedAnswer] = useState("");
  const [acceptedKeywords, setAcceptedKeywords] = useState("");
  const [alternativeAnswers, setAlternativeAnswers] = useState("");
  const [evaluationType, setEvaluationType] = useState<AiConversationEvaluationType>("SEMANTIC");
  const [advancePolicy, setAdvancePolicy] = useState<"ON_CORRECT_ONLY" | "AFTER_MAX_ATTEMPTS" | "MANUAL_SKIP_ONLY">("ON_CORRECT_ONLY");
  const [allowSkip, setAllowSkip] = useState(true);
  const [skipAfterAttempts, setSkipAfterAttempts] = useState("3");
  const [retryPromptText, setRetryPromptText] = useState("");
  const [correctFeedback, setCorrectFeedback] = useState("");
  const [hintText, setHintText] = useState("");
  const [positiveFeedback, setPositiveFeedback] = useState("");
  const [retryFeedback, setRetryFeedback] = useState("");
  const [maxAttempts, setMaxAttempts] = useState("3");
  const [difficultyLevel, setDifficultyLevel] = useState("BEGINNER");
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
    setAdvancePolicy(question?.advancePolicy ?? "ON_CORRECT_ONLY");
    setAllowSkip(question?.allowSkip ?? true);
    setSkipAfterAttempts(`${question?.skipAfterAttempts ?? 3}`);
    setRetryPromptText(question?.retryPromptText ?? "");
    setCorrectFeedback(question?.correctFeedback ?? "");
    setHintText(question?.hintText ?? "");
    setPositiveFeedback(question?.positiveFeedback ?? "");
    setRetryFeedback(question?.retryFeedback ?? "");
    setMaxAttempts(`${question?.maxAttempts ?? 3}`);
    setDifficultyLevel(question?.difficultyLevel ?? "BEGINNER");
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
    if (!questionText.trim()) next.questionText = "Vui lòng nhập câu hỏi.";
    if (!evaluationType) next.evaluationType = "Vui lòng chọn cách chấm.";
    const attempts = Number(maxAttempts);
    if (!Number.isFinite(attempts) || attempts < 1) {
      next.maxAttempts = "Số lần thử tối đa phải từ 1 trở lên.";
    }
    if (!Number.isFinite(Number(sortOrder))) {
      next.sortOrder = "Thứ tự phải là một số hợp lệ.";
    }
    if (evaluationType === "KEYWORD" && parseList(acceptedKeywords).length === 0) {
      next.acceptedKeywords = "Vui lòng nhập ít nhất một từ khóa khi chọn cách chấm Theo từ khóa.";
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
        advancePolicy,
        allowSkip,
        skipAfterAttempts: allowSkip ? Number(skipAfterAttempts) : null,
        retryPromptText: retryPromptText.trim() || null,
        correctFeedback: correctFeedback.trim() || null,
        hintText: hintText.trim() || null,
        positiveFeedback: positiveFeedback.trim() || null,
        retryFeedback: retryFeedback.trim() || null,
        maxAttempts: Number(maxAttempts),
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
          <h2>{question ? "Chỉnh sửa câu hỏi hội thoại" : "Thêm câu hỏi hội thoại mới"}</h2>
          <button className="modal-close" onClick={onCancel} type="button">&times;</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Section A: Nội dung câu hỏi */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <h3 style={{ margin: "0", fontSize: "15px", borderBottom: "1px solid var(--border)", paddingBottom: "6px", color: "var(--text-main)" }}>
                a. Nội dung câu hỏi
              </h3>
              <div className="field">
                <label>Câu hỏi hiển thị trên màn hình <span style={{ color: "red" }}>*</span></label>
                <textarea
                  value={questionText}
                  onChange={(event) => setQuestionText(event.target.value)}
                  rows={2}
                  placeholder="VD: Con hãy tự giới thiệu tên và tuổi của mình nhé."
                />
                {errors.questionText && <span className="error-msg">{errors.questionText}</span>}
              </div>
              <div className="field">
                <label>Câu hỏi đọc bằng giọng nói (TTS) <span style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: "normal" }}>(Để trống nếu giống câu hỏi hiển thị)</span></label>
                <input
                  type="text"
                  value={questionAudioText}
                  onChange={(event) => setQuestionAudioText(event.target.value)}
                  placeholder="VD: Chào con, con hãy giới thiệu tên và tuổi của mình cho ta nghe nhé!"
                />
              </div>
            </div>

            {/* Section B: Đáp án & cách chấm */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <h3 style={{ margin: "0", fontSize: "15px", borderBottom: "1px solid var(--border)", paddingBottom: "6px", color: "var(--text-main)" }}>
                b. Đáp án & cách chấm điểm
              </h3>
              <div className="form-grid">
                <div className="field">
                  <label>Cách chấm điểm <span style={{ color: "red" }}>*</span></label>
                  <select value={evaluationType} onChange={(event) => setEvaluationType(event.target.value as AiConversationEvaluationType)}>
                    {evaluationTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  {errors.evaluationType && <span className="error-msg">{errors.evaluationType}</span>}
                  {evaluationType === "SEMANTIC" && <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>AI sẽ hiểu ý nghĩa câu trả lời của bé, không yêu cầu bé nói đúng từng chữ.</span>}
                </div>
                <div className="field">
                  <label>Đáp án kỳ vọng <span style={{ color: "red" }}>*</span></label>
                  <input
                    type="text"
                    value={expectedAnswer}
                    onChange={(event) => setExpectedAnswer(event.target.value)}
                    placeholder="VD: Con tên là Nam, năm nay con 6 tuổi."
                  />
                </div>
              </div>

              <div className="form-grid">
                <div className="field">
                  <label>
                    Từ khóa chấp nhận <span style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: "normal" }}>(Mỗi dòng hoặc phẩy phân tách một từ khóa)</span>
                  </label>
                  <textarea
                    value={acceptedKeywords}
                    onChange={(event) => setAcceptedKeywords(event.target.value)}
                    rows={3}
                    placeholder="VD: tên là&#10;tuổi&#10;tuổi"
                  />
                  {errors.acceptedKeywords && <span className="error-msg">{errors.acceptedKeywords}</span>}
                </div>
                <div className="field">
                  <label>
                    Đáp án thay thế <span style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: "normal" }}>(Mỗi dòng hoặc phẩy phân tách một câu trả lời mẫu)</span>
                  </label>
                  <textarea
                    value={alternativeAnswers}
                    onChange={(event) => setAlternativeAnswers(event.target.value)}
                    rows={3}
                    placeholder="VD: Mình tên là Nam, mình 6 tuổi.&#10;Con tên Nam, con lên 6."
                  />
                </div>
              </div>
            </div>

            {/* Section C: Phản hồi cho bé */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <h3 style={{ margin: "0", fontSize: "15px", borderBottom: "1px solid var(--border)", paddingBottom: "6px", color: "var(--text-main)" }}>
                c. Phản hồi của AI/Mascot dành cho bé
              </h3>
              <div className="form-grid">
                <div className="field">
                  <label>Gợi ý khi nói (Hint)</label>
                  <textarea
                    value={hintText}
                    onChange={(event) => setHintText(event.target.value)}
                    rows={2}
                    placeholder="VD: Con hãy trả lời bắt đầu bằng cụm từ: Con tên là..."
                  />
                </div>
                <div className="field">
                  <label>Lời khen khi trả lời đúng (Feedback tốt)</label>
                  <textarea
                    value={positiveFeedback}
                    onChange={(event) => setPositiveFeedback(event.target.value)}
                    rows={2}
                    placeholder="VD: Giỏi lắm! Giọng con rất rõ ràng và đáng yêu."
                  />
                </div>
                <div className="field">
                  <label>Lời khích lệ khi bé cần thử lại</label>
                  <textarea
                    value={retryFeedback}
                    onChange={(event) => setRetryFeedback(event.target.value)}
                    rows={2}
                    placeholder="VD: Gần được rồi con yêu. Con bấm mic nói lại tên và tuổi rõ hơn nhé!"
                  />
                </div>
              </div>
            </div>

            {/* Section D: Cấu hình hệ thống */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <h3 style={{ margin: "0", fontSize: "15px", borderBottom: "1px solid var(--border)", paddingBottom: "6px", color: "var(--text-main)" }}>
                d. Cách chuyển sang câu tiếp theo
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontWeight: 600 }}>Chính sách chuyển câu</label>
                {[
                  { value: "ON_CORRECT_ONLY", label: "Chỉ chuyển khi bé trả lời đúng", desc: "AI sẽ tiếp tục gợi ý và cho bé nói lại cho đến khi câu trả lời phù hợp. Đây là lựa chọn khuyến nghị." },
                  { value: "AFTER_MAX_ATTEMPTS", label: "Chuyển sau số lần thử trước khi gợi ý", desc: "Sau số lần thử đã đặt, hệ thống sẽ chuyển câu tiếp theo dù bé chưa trả lời đúng. Chỉ dùng nếu muốn phiên ngắn." },
                  { value: "MANUAL_SKIP_ONLY", label: "Chỉ chuyển khi bấm bỏ qua", desc: "AI không tự chuyển câu. Bé/phụ huynh cần bấm bỏ qua nếu muốn sang câu khác." }
                ].map((option) => (
                  <label key={option.value} style={{ display: "flex", flexDirection: "column", padding: "12px", border: `1px solid ${advancePolicy === option.value ? "var(--primary)" : "var(--border)"}`, borderRadius: "6px", cursor: "pointer", background: advancePolicy === option.value ? "var(--bg-subtle)" : "white" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input
                        type="radio"
                        name="advancePolicy"
                        value={option.value}
                        checked={advancePolicy === option.value}
                        onChange={() => setAdvancePolicy(option.value as typeof advancePolicy)}
                      />
                      <span style={{ fontWeight: 500 }}>{option.label}</span>
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "24px", marginTop: "4px" }}>{option.desc}</span>
                  </label>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
                <ToggleSwitch
                  id="allowSkip"
                  label="Cho phép bỏ qua câu hỏi"
                  checked={allowSkip}
                  onChange={setAllowSkip}
                />
                {allowSkip && (
                  <div className="field" style={{ marginLeft: "24px" }}>
                    <label>Hiện nút bỏ qua sau số lần thử</label>
                    <input type="number" min="1" value={skipAfterAttempts} onChange={(event) => setSkipAfterAttempts(event.target.value)} style={{ maxWidth: "150px" }}/>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Nếu bé chưa trả lời đúng sau số lần này, app sẽ hiện nút Bỏ qua.</span>
                  </div>
                )}
              </div>

              <div className="field" style={{ marginTop: "16px" }}>
                <label>Số lần thử trước khi gợi ý mạnh hơn</label>
                <input type="number" min="1" value={maxAttempts} onChange={(event) => setMaxAttempts(event.target.value)} style={{ maxWidth: "150px" }}/>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Nếu bé chưa trả lời đúng sau số lần này, hệ thống sẽ gợi ý rõ hơn hoặc cho phép bỏ qua, nhưng không tự chuyển câu nếu đang chọn chính sách "Chỉ chuyển khi trả lời đúng".</span>
                {errors.maxAttempts && <span className="error-msg">{errors.maxAttempts}</span>}
              </div>

              <h3 style={{ margin: "20px 0 0 0", fontSize: "15px", borderBottom: "1px solid var(--border)", paddingBottom: "6px", color: "var(--text-main)" }}>
                e. Cấu hình khác
              </h3>
              <div className="form-grid">
                <div className="field">
                  <label>Độ khó</label>
                  <select value={difficultyLevel} onChange={(event) => setDifficultyLevel(event.target.value)}>
                    <option value="BEGINNER">Dễ (Beginner)</option>
                    <option value="BASIC">Trung bình (Basic)</option>
                    <option value="INTERMEDIATE">Khó (Intermediate)</option>
                  </select>
                </div>
                <div className="field">
                  <label>Thứ tự sắp xếp</label>
                  <input type="number" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} />
                  {errors.sortOrder && <span className="error-msg">{errors.sortOrder}</span>}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                <ToggleSwitch
                  id="questionActive"
                  label={isActive ? "Câu hỏi đang bật (Áp dụng)" : "Câu hỏi đã tắt (Tạm ẩn)"}
                  checked={isActive}
                  onChange={setIsActive}
                />
              </div>
            </div>

          </div>
          <div className="modal-footer">
            <button type="button" className="secondary" onClick={onCancel}>Hủy</button>
            <button type="submit" disabled={saving}>
              {saving ? "Đang lưu..." : question ? "Cập nhật câu hỏi" : "Lưu câu hỏi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
