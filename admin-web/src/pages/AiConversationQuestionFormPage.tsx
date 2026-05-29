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
  { value: "SEMANTIC", label: "AI hiểu ý nghĩa câu trả lời" },
  { value: "KEYWORD", label: "Chấm theo từ khóa" },
  { value: "EXACT", label: "Chấm khớp chính xác" },
  { value: "OPEN_ENDED", label: "Câu hỏi mở" }
];

// Conversions between UI representation "[Tên bé]" and DB placeholder "{childName}"
const tokenCategories = [
  {
    label: "Thông tin của bé",
    tokens: [
      { display: "[Tên bé]", db: "{childName}" },
      { display: "[Tuổi bé]", db: "{childAge}" },
      { display: "[Tên gọi ở nhà]", db: "{nickname}" }
    ]
  },
  {
    label: "Sở thích của bé",
    tokens: [
      { display: "[Màu bé thích]", db: "{favoriteColor}" },
      { display: "[Con vật bé thích]", db: "{favoriteAnimal}" },
      { display: "[Đồ chơi bé thích]", db: "{favoriteToy}" },
      { display: "[Bài hát bé thích]", db: "{favoriteSong}" }
    ]
  },
  {
    label: "Gia đình",
    tokens: [
      { display: "[Người chăm sóc chính]", db: "{primaryCaregiver}" },
      { display: "[Thành viên gia đình]", db: "{familyMembers}" }
    ]
  },
  {
    label: "Nội dung câu hỏi",
    tokens: [
      { display: "[Đáp án mục tiêu]", db: "{expectedAnswer}" }
    ]
  }
];

const tokenMappings = tokenCategories.flatMap(c => c.tokens);

const templateToDisplay = (text: string | null | undefined): string => {
  if (!text) return "";
  let result = text;
  for (const mapping of tokenMappings) {
    const escapedDb = mapping.db.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    result = result.replace(new RegExp(escapedDb, "g"), mapping.display);
  }
  return result;
};

const displayToTemplate = (text: string | null | undefined): string => {
  if (!text) return "";
  let result = text;
  for (const mapping of tokenMappings) {
    const escapedDisplay = mapping.display.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    result = result.replace(new RegExp(escapedDisplay, "g"), mapping.db);
  }
  return result;
};

function TokenInsertDropdown({ onInsert, excludeExpectedAnswer }: { onInsert: (token: string) => void; excludeExpectedAnswer?: boolean }) {
  const [open, setOpen] = useState(false);
  
  const filteredCategories = tokenCategories.map(category => {
    const filteredTokens = excludeExpectedAnswer
      ? category.tokens.filter(t => t.db !== "{expectedAnswer}")
      : category.tokens;
    if (filteredTokens.length === 0) return null;
    return { ...category, tokens: filteredTokens };
  }).filter(Boolean) as typeof tokenCategories;

  return (
    <div style={{ position: "relative", display: "inline-block", marginTop: "4px" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          padding: "4px 10px",
          fontSize: "12px",
          fontWeight: "500",
          backgroundColor: "#f1f5f9",
          border: "1px solid #cbd5e1",
          borderRadius: "4px",
          cursor: "pointer",
          color: "#334155",
          display: "flex",
          alignItems: "center",
          gap: "4px"
        }}
      >
        + Chèn biến ▾
      </button>
      {open && (
        <>
          <div 
            style={{ position: "fixed", inset: 0, zIndex: 9 }} 
            onClick={() => setOpen(false)} 
          />
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              zIndex: 10,
              marginTop: "4px",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "4px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              display: "flex",
              flexDirection: "column",
              width: "240px",
              maxHeight: "320px",
              overflowY: "auto"
            }}
          >
            {filteredCategories.map((category) => (
              <div key={category.label} style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    padding: "6px 12px",
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "#64748b",
                    backgroundColor: "#f8fafc",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}
                >
                  {category.label}
                </div>
                {category.tokens.map((t) => (
                  <button
                    key={t.display}
                    type="button"
                    onClick={() => {
                      onInsert(t.display);
                      setOpen(false);
                    }}
                    style={{
                      padding: "8px 16px",
                      fontSize: "12px",
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      width: "100%",
                      color: "#1f2937",
                      borderBottom: "1px solid #f1f5f9"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {t.display}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

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
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    setQuestionText(question?.questionText ?? "");
    setQuestionAudioText(question?.questionAudioText ?? "");
    setExpectedAnswer(templateToDisplay(question?.expectedAnswer));
    setAcceptedKeywords((question?.acceptedKeywords ?? []).join("\n"));
    setAlternativeAnswers((question?.alternativeAnswers ?? []).join("\n"));
    
    const initialType = question?.evaluationType ?? "SEMANTIC";
    setEvaluationType(initialType);
    setAdvancePolicy(question?.advancePolicy ?? "ON_CORRECT_ONLY");
    setAllowSkip(question?.allowSkip ?? true);
    setSkipAfterAttempts(`${question?.skipAfterAttempts ?? 3}`);
    setRetryPromptText(templateToDisplay(question?.retryPromptText));
    setCorrectFeedback(templateToDisplay(question?.correctFeedback));
    setHintText(templateToDisplay(question?.hintText));
    setPositiveFeedback(templateToDisplay(question?.positiveFeedback));
    setRetryFeedback(templateToDisplay(question?.retryFeedback));
    setMaxAttempts(`${question?.maxAttempts ?? 3}`);
    setDifficultyLevel(question?.difficultyLevel ?? "BEGINNER");
    setSortOrder(`${question?.sortOrder ?? 0}`);
    setIsActive(question?.isActive ?? true);
    setErrors({});
    
    setShowAdvanced(initialType === "KEYWORD");
  }, [question]);

  useEffect(() => {
    if (evaluationType === "KEYWORD") {
      setShowAdvanced(true);
    }
  }, [evaluationType]);

  const parseList = (value: string) =>
    value.split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);

  const handleInsertExpectedAnswer = (token: string) => {
    setExpectedAnswer(prev => {
      const trimmed = prev.trim();
      if (!trimmed) return token;
      return prev + " " + token;
    });
  };

  const handleInsertHintText = (token: string) => {
    setHintText(prev => {
      const trimmed = prev.trim();
      if (!trimmed) return token;
      return prev + " " + token;
    });
  };

  const handleInsertPositiveFeedback = (token: string) => {
    setPositiveFeedback(prev => {
      const trimmed = prev.trim();
      if (!trimmed) return token;
      return prev + " " + token;
    });
  };

  const handleInsertRetryFeedback = (token: string) => {
    setRetryFeedback(prev => {
      const trimmed = prev.trim();
      if (!trimmed) return token;
      return prev + " " + token;
    });
  };

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

    if ((evaluationType === "SEMANTIC" || evaluationType === "EXACT") && !expectedAnswer.trim()) {
      next.expectedAnswer = "Vui lòng nhập mục tiêu bé cần nói.";
    }

    if (expectedAnswer.includes("[Đáp án mục tiêu]") || expectedAnswer.includes("{expectedAnswer}")) {
      next.expectedAnswer = "Không thể dùng [Đáp án mục tiêu] trong chính trường Mục tiêu bé cần nói.";
    }

    if (evaluationType === "KEYWORD" && parseList(acceptedKeywords).length === 0) {
      next.acceptedKeywords = "Vui lòng nhập ít nhất một từ khóa khi chọn cách chấm Theo từ khóa.";
    }

    // Friendly validation for raw placeholders/indicators in fields read to children (TTS)
    const ttsFields = [
      { key: "expectedAnswer", label: "Mục tiêu bé cần nói", val: expectedAnswer },
      { key: "hintText", label: "Gợi ý mẫu tùy chỉnh", val: hintText },
      { key: "retryPromptText", label: "Câu gợi ý khi sai/thử lại", val: retryPromptText },
      { key: "correctFeedback", label: "Lời khen tùy chỉnh khi đúng", val: correctFeedback },
      { key: "retryFeedback", label: "Lời nhắc thử lại tùy chỉnh", val: retryFeedback },
      { key: "positiveFeedback", label: "Lời khích lệ động viên thêm", val: positiveFeedback }
    ];

    for (const field of ttsFields) {
      if (!field.val) continue;
      if (field.val.includes("...")) {
        next[field.key] = `Không sử dụng dấu "...". Bạn có thể sửa thành: "${field.val.replace(/\.\.\./g, "[Tên bé]")}" (hoặc dùng nút 'Chèn tên bé').`;
      } else if (field.val.toLowerCase().includes("[tên của con]") || field.val.toLowerCase().includes("tên của con")) {
        next[field.key] = "Bạn có thể dùng nút 'Chèn tên bé' để hệ thống tự thay bằng tên thật của bé.";
      }
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
        expectedAnswer: displayToTemplate(expectedAnswer.trim()) || null,
        acceptedKeywords: parseList(acceptedKeywords),
        alternativeAnswers: parseList(alternativeAnswers),
        evaluationType,
        advancePolicy,
        allowSkip,
        skipAfterAttempts: allowSkip ? Number(skipAfterAttempts) : null,
        retryPromptText: displayToTemplate(retryPromptText.trim()) || null,
        correctFeedback: displayToTemplate(correctFeedback.trim()) || null,
        hintText: displayToTemplate(hintText.trim()) || null,
        positiveFeedback: displayToTemplate(positiveFeedback.trim()) || null,
        retryFeedback: displayToTemplate(retryFeedback.trim()) || null,
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
                b. Đánh giá câu trả lời
              </h3>
              <div className="form-grid">
                <div className="field">
                  <label>AI đánh giá câu trả lời <span style={{ color: "red" }}>*</span></label>
                  <select value={evaluationType} onChange={(event) => setEvaluationType(event.target.value as AiConversationEvaluationType)}>
                    {evaluationTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  {errors.evaluationType && <span className="error-msg">{errors.evaluationType}</span>}
                  {evaluationType === "SEMANTIC" && (
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      AI sẽ hiểu ý bé nói, không cần bé nói đúng từng chữ.
                    </span>
                  )}
                </div>
                <div className="field">
                  <label>
                    Mục tiêu bé cần nói {evaluationType !== "OPEN_ENDED" && <span style={{ color: "red" }}>*</span>}
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <input
                      type="text"
                      value={expectedAnswer}
                      onChange={(event) => setExpectedAnswer(event.target.value)}
                      placeholder="VD: Con tên là [Tên bé]"
                    />
                    <TokenInsertDropdown onInsert={handleInsertExpectedAnswer} excludeExpectedAnswer />
                    <span style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                      Nhập câu mẫu bé nên nói. Có thể chèn dữ liệu của bé như [Tên bé], [Màu bé thích].
                    </span>
                  </div>
                  {errors.expectedAnswer && <span className="error-msg" style={{ color: "red", fontSize: "11px" }}>{errors.expectedAnswer}</span>}
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                    {evaluationType === "SEMANTIC"
                      ? "Đây là câu mẫu để AI hiểu mục tiêu giao tiếp. AI vẫn chấp nhận cách nói tương đương."
                      : "Nhập câu mẫu bé nên nói. Có thể dùng nút bên dưới để chèn tên bé tự động."}
                  </span>
                </div>
              </div>
            </div>

            {/* Collapsible Advanced Options */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "15px" }}>
              <button
                type="button"
                className="advanced-toggle"
                onClick={() => setShowAdvanced(!showAdvanced)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "12px 16px",
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "6px",
                  cursor: "pointer",
                  textAlign: "left",
                  color: "#1f2937"
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ fontWeight: "600", fontSize: "14px" }}>Tuỳ chọn nâng cao</span>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "normal" }}>Cấu hình từ khóa, đáp án thay thế, phản hồi tuỳ chỉnh</span>
                </div>
                <span style={{ fontSize: "14px", fontWeight: "600" }}>{showAdvanced ? "▲ Thu gọn" : "▼ Mở rộng"}</span>
              </button>

              {showAdvanced && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "15px", padding: "15px", border: "1px dashed #cbd5e1", borderRadius: "6px", background: "#f8fafc" }}>
                  <div className="form-grid">
                    <div className="field">
                      <label>
                        Từ khóa chấp nhận {evaluationType === "KEYWORD" && <span style={{ color: "red" }}>*</span>} <span style={{ color: "var(--text-muted)", fontSize: "11px", fontWeight: "normal" }}>(Mỗi dòng hoặc phẩy phân tách một từ khóa)</span>
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

                  <div className="form-grid">
                    <div className="field">
                      <label>Gợi ý mẫu tùy chỉnh</label>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <textarea
                          value={hintText}
                          onChange={(event) => setHintText(event.target.value)}
                          rows={2}
                          placeholder="VD: Con hãy trả lời bắt đầu bằng cụm từ: Con tên là..."
                        />
                        <TokenInsertDropdown onInsert={handleInsertHintText} />
                        <span style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                          Có thể dùng [Đáp án mục tiêu] để nhắc lại câu mẫu bé cần nói.
                        </span>
                      </div>
                      {errors.hintText && <span className="error-msg">{errors.hintText}</span>}
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                        Có thể để trống để AI tự tạo phản hồi phù hợp.
                      </span>
                    </div>
                    <div className="field">
                      <label>Lời khen tùy chỉnh khi đúng</label>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <textarea
                          value={positiveFeedback}
                          onChange={(event) => setPositiveFeedback(event.target.value)}
                          rows={2}
                          placeholder="VD: Giỏi lắm! Giọng con rất rõ ràng và đáng yêu."
                        />
                        <TokenInsertDropdown onInsert={handleInsertPositiveFeedback} />
                        <span style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                          Có thể dùng [Đáp án mục tiêu] để nhắc lại câu mẫu bé cần nói.
                        </span>
                      </div>
                      {errors.positiveFeedback && <span className="error-msg">{errors.positiveFeedback}</span>}
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                        Có thể để trống để AI tự tạo phản hồi phù hợp.
                      </span>
                    </div>
                    <div className="field">
                      <label>Lời nhắc thử lại tùy chỉnh</label>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <textarea
                          value={retryFeedback}
                          onChange={(event) => setRetryFeedback(event.target.value)}
                          rows={2}
                          placeholder="VD: Gần được rồi con yêu. Con bấm mic nói lại tên và tuổi rõ hơn nhé!"
                        />
                        <TokenInsertDropdown onInsert={handleInsertRetryFeedback} />
                        <span style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                          Có thể dùng [Đáp án mục tiêu] để nhắc lại câu mẫu bé cần nói.
                        </span>
                      </div>
                      {errors.retryFeedback && <span className="error-msg">{errors.retryFeedback}</span>}
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                        Có thể để trống để AI tự tạo phản hồi phù hợp.
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section D: Cách chuyển sang câu tiếp theo */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <h3 style={{ margin: "0", fontSize: "15px", borderBottom: "1px solid var(--border)", paddingBottom: "6px", color: "var(--text-main)" }}>
                c. Cách chuyển sang câu tiếp theo
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
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>If bé chưa trả lời đúng sau số lần này, app sẽ hiện nút Bỏ qua.</span>
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
                d. Cấu hình khác
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
