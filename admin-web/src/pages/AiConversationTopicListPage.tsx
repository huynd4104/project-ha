import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { aiConversationApi, type AiConversationTopic, type AiConversationTopicPayload } from "../api/aiConversationApi";
import { TableControls } from "../components/TableControls";
import { useTableControls } from "../utils/tableControls";
import { AiConversationTopicFormPage } from "./AiConversationTopicFormPage";

export function AiConversationTopicListPage() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<AiConversationTopic[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingTopic, setEditingTopic] = useState<AiConversationTopic | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  async function loadTopics() {
    setLoading(true);
    setError("");
    try {
      const data = await aiConversationApi.listTopics();
      setTopics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được danh sách chủ đề.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTopics();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return topics;
    return topics.filter((topic) =>
      topic.title.toLowerCase().includes(q) ||
      (topic.description ?? "").toLowerCase().includes(q)
    );
  }, [search, topics]);

  const table = useTableControls(filtered, [
    { value: "title", label: "Tên chủ đề", getValue: (item) => item.title },
    { value: "difficulty", label: "Độ khó", getValue: (item) => item.difficultyLevel }
  ], "title");

  const openCreate = () => {
    setEditingTopic(null);
    setShowForm(true);
  };

  const openEdit = (topic: AiConversationTopic) => {
    setEditingTopic(topic);
    setShowForm(true);
  };

  const saveTopic = async (payload: AiConversationTopicPayload) => {
    if (editingTopic) {
      await aiConversationApi.updateTopic(editingTopic.id, payload);
    } else {
      await aiConversationApi.createTopic(payload);
    }
    setShowForm(false);
    await loadTopics();
  };

  const toggleActive = async (topic: AiConversationTopic) => {
    await aiConversationApi.setTopicActive(topic.id, !topic.isActive);
    await loadTopics();
  };

  const removeTopic = async (topic: AiConversationTopic) => {
    if (!window.confirm(`Xóa chủ đề "${topic.title}"?`)) return;
    await aiConversationApi.deleteTopic(topic.id);
    await loadTopics();
  };

  return (
    <div>
      <div className="toolbar">
        <div>
          <h1>Hội thoại cùng AI</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "4px" }}>
            Quản lý chủ đề và câu hỏi dùng làm nguồn dữ liệu chính cho các phiên trò chuyện của trẻ.
          </p>
        </div>
        <button onClick={openCreate}>➕ Thêm chủ đề mới</button>
      </div>

      <div className="panel" style={{ padding: "16px", marginBottom: "16px", display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          type="text"
          className="search-input"
          placeholder="Tìm theo tên hoặc mô tả..."
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
        <p>Đang tải danh sách chủ đề...</p>
      ) : filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "var(--text-muted)" }}>Chưa có chủ đề hội thoại nào.</p>
        </div>
      ) : (
        <>
          <TableControls {...table} />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tên chủ đề</th>
                  <th>Độ khó</th>
                  <th>Độ tuổi</th>
                  <th>Thời lượng</th>
                  <th>Trạng thái</th>
                  <th style={{ width: "260px" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {table.pagedItems.map((topic) => (
                  <tr key={topic.id}>
                    <td>
                      <strong style={{ fontSize: "14px", color: "var(--text-main)" }}>{topic.title}</strong>
                      <div style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "6px" }}>
                        {topic.description || "Không có mô tả"}
                      </div>
                    </td>
                    <td>{getDifficultyBadge(topic.difficultyLevel)}</td>
                    <td>{formatAgeRange(topic)}</td>
                    <td>{formatDuration(topic.estimatedDurationSeconds)}</td>
                    <td>
                      {topic.isActive ? (
                        <span className="badge active">Đang bật</span>
                      ) : (
                        <span className="badge inactive">Đã tắt</span>
                      )}
                    </td>
                    <td>
                      <div className="actions">
                        <button className="secondary" onClick={() => navigate(`/ai-conversations/topics/${topic.id}/questions`)}>
                          Câu hỏi
                        </button>
                        <button className="secondary" onClick={() => openEdit(topic)}>
                          Sửa
                        </button>

                        <button className="danger" onClick={() => removeTopic(topic)}>
                          Xóa
                        </button>
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
        <AiConversationTopicFormPage
          topic={editingTopic}
          onCancel={() => setShowForm(false)}
          onSubmit={saveTopic}
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

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds} giây`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins} phút ${secs} giây` : `${mins} phút`;
}

function formatAgeRange(topic: AiConversationTopic) {
  if (topic.ageRangeMin == null && topic.ageRangeMax == null) return "Không giới hạn";
  if (topic.ageRangeMin == null) return `Đến ${topic.ageRangeMax} tuổi`;
  if (topic.ageRangeMax == null) return `Từ ${topic.ageRangeMin} tuổi`;
  return `${topic.ageRangeMin} - ${topic.ageRangeMax} tuổi`;
}
