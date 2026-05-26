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
      question.acceptedKeywords.join(" ").toLowerCase().includes(q) ||
      question.skillTags.join(" ").toLowerCase().includes(q)
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
          <button className="secondary" onClick={() => navigate("/ai-conversations")} style={{ marginBottom: "10px" }}>← Quay lại chủ đề</button>
          <h1>Câu hỏi: {topic?.title ?? "Hội thoại cùng AI"}</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "4px" }}>
            Câu hỏi, đáp án, rule đánh giá, gợi ý và feedback được quản lý từ backend.
          </p>
        </div>
        <button onClick={openCreate}>+ Thêm câu hỏi</button>
      </div>

      <div className="panel" style={{ padding: "16px", marginBottom: "16px" }}>
        <input
          className="search-input"
          placeholder="Tìm theo câu hỏi, đáp án, từ khóa hoặc skill tag..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {error && <div className="panel" style={{ padding: "16px", color: "#b91c1c", marginBottom: "16px" }}>{error}</div>}

      {loading ? (
        <p>Đang tải danh sách câu hỏi...</p>
      ) : filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "var(--text-muted)" }}>Chủ đề này chưa có câu hỏi.</p>
        </div>
      ) : (
        <>
          <TableControls {...table} />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Câu hỏi</th>
                  <th>Đáp án</th>
                  <th>Kiểu đánh giá</th>
                  <th>Từ khóa</th>
                  <th>Skill tags</th>
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
                      <strong>{question.questionText}</strong>
                      {question.hintText && <div style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "4px" }}>Gợi ý: {question.hintText}</div>}
                    </td>
                    <td>{question.expectedAnswer || "Không bắt buộc"}</td>
                    <td><code>{question.evaluationType}</code></td>
                    <td>{formatList(question.acceptedKeywords)}</td>
                    <td>{formatList(question.skillTags)}</td>
                    <td>{question.difficultyLevel}</td>
                    <td>{question.isActive ? "Đang bật" : "Đang tắt"}</td>
                    <td>{question.sortOrder}</td>
                    <td>
                      <div className="actions">
                        <button className="secondary" onClick={() => openEdit(question)}>Sửa</button>
                        <button className="secondary" onClick={() => toggleActive(question)}>{question.isActive ? "Tắt" : "Bật"}</button>
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

function formatList(values: string[]) {
  if (!values.length) return "Không có";
  return values.slice(0, 3).join(", ") + (values.length > 3 ? ` +${values.length - 3}` : "");
}
