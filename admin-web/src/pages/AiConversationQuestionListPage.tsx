import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  aiConversationApi,
  type AiConversationQuestion,
  type AiConversationQuestionPayload,
  type AiConversationTopic
} from "../api/aiConversationApi";
import { TableControls } from "../components/TableControls";
import { useTableControls } from "../utils/tableControls";
import { AiConversationQuestionFormPage } from "./AiConversationQuestionFormPage";

export function AiConversationQuestionListPage() {
  const { topicId = "" } = useParams();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<AiConversationTopic[]>([]);
  const [questions, setQuestions] = useState<AiConversationQuestion[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<AiConversationQuestion | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [topicData, questionData] = await Promise.all([
        aiConversationApi.listTopics(),
        aiConversationApi.listQuestions(topicId)
      ]);
      setTopics(topicData);
      setQuestions(questionData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được danh sách câu hỏi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (topicId) loadData();
  }, [topicId]);

  const topic = topics.find((item) => item.id === topicId);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return questions;
    return questions.filter((question) =>
      question.questionText.toLowerCase().includes(q) ||
      (question.expectedAnswer ?? "").toLowerCase().includes(q) ||
      question.acceptedKeywords.join(" ").toLowerCase().includes(q)
    );
  }, [questions, search]);

  const table = useTableControls(filtered, [
    { value: "sortOrder", label: "Thứ tự", getValue: (item) => item.sortOrder },
    { value: "question", label: "Câu hỏi", getValue: (item) => item.questionText },
    { value: "evaluation", label: "Kiểu đánh giá", getValue: (item) => item.evaluationType }
  ], "sortOrder");

  const openCreate = () => {
    setEditingQuestion(null);
    setShowForm(true);
  };

  const openEdit = (question: AiConversationQuestion) => {
    setEditingQuestion(question);
    setShowForm(true);
  };

  const saveQuestion = async (payload: AiConversationQuestionPayload) => {
    if (editingQuestion) {
      await aiConversationApi.updateQuestion(editingQuestion.id, payload);
    } else {
      await aiConversationApi.createQuestion(topicId, payload);
    }
    setShowForm(false);
    await loadData();
  };

  const toggleActive = async (question: AiConversationQuestion) => {
    await aiConversationApi.setQuestionActive(question.id, !question.isActive);
    await loadData();
  };

  const removeQuestion = async (question: AiConversationQuestion) => {
    if (!window.confirm("Xóa câu hỏi này?")) return;
    await aiConversationApi.deleteQuestion(question.id);
    await loadData();
  };

  return (
    <div>
      <div className="toolbar">
        <div>
          <button className="secondary" onClick={() => navigate("/ai-conversations")} style={{ marginBottom: "12px" }}>
            ⬅ Quay lại danh sách chủ đề
          </button>
          <h1>Câu hỏi thuộc chủ đề: {topic?.title ?? "Hội thoại cùng AI"}</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "4px" }}>
            Thiết lập câu hỏi, đáp án mẫu, phương thức chấm điểm và các gợi ý hội thoại cho trẻ.
          </p>
        </div>
        <button onClick={openCreate}>➕ Thêm câu hỏi mới</button>
      </div>

      <div className="panel" style={{ padding: "16px", marginBottom: "16px", display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          type="text"
          className="search-input"
          placeholder="Tìm theo câu hỏi, đáp án hoặc từ khóa..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ flex: 1, margin: 0 }}
        />
        {search && (
          <button className="secondary" onClick={() => setSearch("")} style={{ height: "40px", margin: 0 }}>
            Xóa tìm kiếm
          </button>
        )}
      </div>

      {error && <div className="panel" style={{ padding: "16px", color: "#b91c1c", marginBottom: "16px" }}>{error}</div>}

      {loading ? (
        <p>Đang tải danh sách câu hỏi...</p>
      ) : filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "var(--text-muted)" }}>Chủ đề này chưa có câu hỏi nào.</p>
        </div>
      ) : (
        <>
          <TableControls {...table} />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Câu hỏi</th>
                  <th>Đáp án kỳ vọng</th>
                  <th>Phương thức chấm</th>
                  <th>Từ khóa chính</th>
                  <th>Độ khó</th>
                  <th>Trạng thái</th>
                  <th>Thứ tự</th>
                  <th style={{ width: "210px" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {table.pagedItems.map((question) => (
                  <tr key={question.id}>
                    <td style={{ minWidth: "220px" }}>
                      <strong style={{ fontSize: "14px", color: "var(--text-main)" }}>{question.questionText}</strong>
                      {question.questionAudioText && question.questionAudioText !== question.questionText && (
                        <div style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: "4px", fontStyle: "italic" }}>
                          Giọng nói: {question.questionAudioText}
                        </div>
                      )}

                    </td>
                    <td>
                      {question.expectedAnswer ? (
                        <span style={{ fontWeight: "500", color: "#0f172a" }}>{question.expectedAnswer}</span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "12px" }}>Không bắt buộc</span>
                      )}
                    </td>
                    <td>
                      <span className="badge blue">{getEvaluationLabel(question.evaluationType)}</span>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", maxWidth: "200px" }}>
                        {question.acceptedKeywords.length > 0 ? (
                          question.acceptedKeywords.map((kw, i) => (
                            <span key={i} className="badge info" style={{ textTransform: "none", fontSize: "11px" }}>
                              {kw}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>—</span>
                        )}
                      </div>
                    </td>
                    <td>{getDifficultyBadge(question.difficultyLevel)}</td>
                    <td>
                      {question.isActive ? (
                        <span className="badge active">Đang bật</span>
                      ) : (
                        <span className="badge inactive">Đã tắt</span>
                      )}
                    </td>
                    <td>{question.sortOrder}</td>
                    <td>
                      <div className="actions">
                        <button className="secondary" onClick={() => openEdit(question)}>Sửa</button>
                        <button className="secondary" onClick={() => toggleActive(question)}>
                          {question.isActive ? "Tắt" : "Bật lại"}
                        </button>
                        <button className="danger" onClick={() => removeQuestion(question)}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showForm && (
        <AiConversationQuestionFormPage
          question={editingQuestion}
          onCancel={() => setShowForm(false)}
          onSubmit={saveQuestion}
        />
      )}
    </div>
  );
}

function getDifficultyBadge(level: string) {
  switch (String(level).toUpperCase()) {
    case "BEGINNER":
    case "EASY":
    case "1":
      return <span className="badge blue">Dễ</span>;
    case "BASIC":
    case "MEDIUM":
    case "2":
      return <span className="badge yellow">Trung bình</span>;
    case "INTERMEDIATE":
    case "HARD":
    case "3":
      return <span className="badge orange">Khó</span>;
    default:
      return <span className="badge info">{level}</span>;
  }
}

function getEvaluationLabel(type: string) {
  switch (type) {
    case "EXACT":
      return "Khớp chính xác";
    case "KEYWORD":
      return "Theo từ khóa";
    case "SEMANTIC":
      return "Theo ngữ nghĩa";
    case "OPEN_ENDED":
      return "Câu hỏi mở";
    default:
      return type;
  }
}
