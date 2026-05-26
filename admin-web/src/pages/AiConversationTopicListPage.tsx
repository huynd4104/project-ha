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
      topic.code.toLowerCase().includes(q) ||
      (topic.description ?? "").toLowerCase().includes(q)
    );
  }, [search, topics]);

  const table = useTableControls(filtered, [
    { value: "sortOrder", label: "Thứ tự", getValue: (item) => item.sortOrder },
    { value: "title", label: "Tên chủ đề", getValue: (item) => item.title },
    { value: "difficulty", label: "Độ khó", getValue: (item) => item.difficultyLevel }
  ], "sortOrder");

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
          <h1>AI Conversations / Hội thoại cùng AI</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "4px" }}>
            Quản lý chủ đề và câu hỏi để backend dùng làm nguồn dữ liệu chính cho phiên trò chuyện.
          </p>
        </div>
        <button onClick={openCreate}>+ Thêm chủ đề</button>
      </div>

      <div className="panel" style={{ padding: "16px", marginBottom: "16px" }}>
        <input
          className="search-input"
          placeholder="Tìm theo tên, mã hoặc mô tả..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {error && <div className="panel" style={{ padding: "16px", color: "#b91c1c", marginBottom: "16px" }}>{error}</div>}

      {loading ? (
        <p>Đang tải danh sách chủ đề...</p>
      ) : filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "var(--text-muted)" }}>Chưa có chủ đề hội thoại AI.</p>
        </div>
      ) : (
        <>
          <TableControls {...table} />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tên chủ đề</th>
                  <th>Mã</th>
                  <th>Độ khó</th>
                  <th>Độ tuổi</th>
                  <th>Thời lượng</th>
                  <th>Trạng thái</th>
                  <th>Thứ tự</th>
                  <th style={{ width: "260px" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {table.pagedItems.map((topic) => (
                  <tr key={topic.id}>
                    <td>
                      <strong>{topic.title}</strong>
                      <div style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "4px" }}>{topic.description || "Không có mô tả"}</div>
                    </td>
                    <td><code>{topic.code}</code></td>
                    <td>{topic.difficultyLevel}</td>
                    <td>{formatAgeRange(topic)}</td>
                    <td>{topic.estimatedDurationSeconds}s</td>
                    <td>{topic.isActive ? "Đang bật" : "Đang tắt"}</td>
                    <td>{topic.sortOrder}</td>
                    <td>
                      <div className="actions">
                        <button className="secondary" onClick={() => navigate(`/ai-conversations/topics/${topic.id}/questions`)}>Câu hỏi</button>
                        <button className="secondary" onClick={() => openEdit(topic)}>Sửa</button>
                        <button className="secondary" onClick={() => toggleActive(topic)}>{topic.isActive ? "Tắt" : "Bật"}</button>
                        <button className="danger" onClick={() => removeTopic(topic)}>Xóa</button>
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

function formatAgeRange(topic: AiConversationTopic) {
  if (topic.ageRangeMin == null && topic.ageRangeMax == null) return "Không giới hạn";
  if (topic.ageRangeMin == null) return `Đến ${topic.ageRangeMax}`;
  if (topic.ageRangeMax == null) return `Từ ${topic.ageRangeMin}`;
  return `${topic.ageRangeMin}-${topic.ageRangeMax}`;
}
