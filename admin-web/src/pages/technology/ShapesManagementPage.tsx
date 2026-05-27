import { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import { TableControls } from "../../components/TableControls";
import { ToggleSwitch } from "../../components/ToggleSwitch";
import { useTableControls } from "../../utils/tableControls";
import { MediaPicker } from "../../components/MediaPicker";

type Tab = "items" | "questions";

export function ShapesManagementPage() {
  const [tab, setTab] = useState<Tab>("items");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [selectedParent, setSelectedParent] = useState<any | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  // Form states
  const [shapeName, setShapeName] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [correctShapeCode, setCorrectShapeCode] = useState("");

  const resourcePath = tab === "items" ? "/shape-items" : "/shape-recognition-questions";

  async function loadData() {
    setLoading(true);
    try {
      const res = await adminApi.list(resourcePath);
      const rows = res.data.data || [];
      setItems(rows);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [tab]);

  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    if (tab === "items") {
      return (
        (item.shapeName?.toLowerCase() || "").includes(q)
      );
    } else {
      return (
        (item.correctShapeCode?.toLowerCase() || "").includes(q) ||
        (item.questionText?.toLowerCase() || "").includes(q)
      );
    }
  });

  const table = useTableControls(
    filtered,
    tab === "items"
      ? [
          { value: "label", label: "Tên gọi", getValue: (i) => i.shapeName },
          { value: "status", label: "Trạng thái", getValue: (i) => i.isActive },
        ]
      : [
          { value: "code", label: "Hình mục tiêu", getValue: (i) => i.correctShapeCode },
          { value: "text", label: "Câu hỏi", getValue: (i) => i.questionText },
          { value: "status", label: "Trạng thái", getValue: (i) => i.isActive },
        ],
    "label"
  );

  const openAddModal = () => {
    setEditingItem(null);
    setShapeName("");
    setQuestionText("");
    setImageUrl("");
    setIsActive(true);
    setCorrectShapeCode("");
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setShapeName(item.shapeName || "");
    setQuestionText(item.questionText || "");
    setImageUrl(item.imageUrl || "");
    setIsActive(item.isActive !== false);
    setCorrectShapeCode(item.correctShapeCode || "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      imageUrl: imageUrl.trim() || null,
      isActive,
    };
    if (tab === "items") {
      payload.shapeName = shapeName.trim();
    } else {
      payload.correctShapeCode = correctShapeCode.trim();
      payload.questionText = questionText.trim();
    }

    try {
      if (editingItem) {
        await adminApi.update(resourcePath, editingItem.id, payload);
      } else {
        await adminApi.create(resourcePath, payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (e) {
      console.error(e);
      alert("Lỗi lưu dữ liệu. Kiểm tra console.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Xóa mục này?")) return;
    try {
      await adminApi.remove(resourcePath, id);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div className="toolbar">
        <h1>Quản lý Bộ hình</h1>
        <button onClick={openAddModal}>➕ Thêm mới</button>
      </div>

      <div className="tab-nav">
        <button className={`tab-btn ${tab === "items" ? "active" : ""}`} onClick={() => setTab("items")}>
          Giới thiệu hình
        </button>
        <button className={`tab-btn ${tab === "questions" ? "active" : ""}`} onClick={() => setTab("questions")}>
          Nhận diện hình
        </button>
      </div>

      <div className="panel" style={{ padding: "16px", marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Tìm kiếm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <>
          <TableControls {...table} />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {tab === "questions" && <th style={{ width: "120px" }}>Hình mục tiêu</th>}
                  {tab === "items" ? <th>Tên gọi (VN)</th> : <th>Nội dung câu hỏi</th>}
                  <th>Hình ảnh</th>
                  <th style={{ width: "120px" }}>Trạng thái</th>
                  <th style={{ width: "150px" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {table.pagedItems.map((item) => (
                  <tr key={item.id}>
                    {tab === "questions" && (
                      <td>
                        <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>
                          {item.correctShapeCode}
                        </code>
                      </td>
                    )}
                    <td>{tab === "items" ? item.shapeName : item.questionText}</td>
                    <td>{item.imageUrl ? <img src={item.imageUrl} alt="preview" style={{ height: "40px" }} /> : "—"}</td>
                    <td>
                      <span className={`badge ${item.isActive ? "active" : "inactive"}`}>
                        {item.isActive ? "Hoạt động" : "Tạm khóa"}
                      </span>
                    </td>
                    <td>
                      <div className="actions">
                        <button className="secondary" onClick={() => setSelectedParent(item)}>Ví dụ</button>
                        <button className="secondary" onClick={() => openEditModal(item)}>Sửa</button>
                        <button className="danger" onClick={() => handleDelete(item.id)}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "700px" }}>
            <div className="modal-header">
              <h2>{editingItem ? "Cập nhật" : "Thêm mới"} {tab === "items" ? "Hình" : "Câu hỏi nhận diện"}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: "24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {tab === "items" ? (
                    <>
                      <div className="field">
                        <label>Tên gọi tiếng Việt *</label>
                        <input type="text" value={shapeName} onChange={(e) => setShapeName(e.target.value)} required />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="field">
                        <label>Mã hình đúng *</label>
                        <input type="text" placeholder="VD: CIRCLE, SQUARE..." value={correctShapeCode} onChange={(e) => setCorrectShapeCode(e.target.value.toUpperCase())} required />
                      </div>
                      <div className="field">
                        <label>Nội dung câu hỏi *</label>
                        <textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} required />
                      </div>
                    </>
                  )}
                  <div className="field">
                    <label>URL Hình ảnh</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} style={{ flex: 1 }} />
                      <button type="button" className="secondary" onClick={() => setShowMediaPicker(true)}>Thư viện</button>
                    </div>
                  </div>
                  <div className="field">
                    <ToggleSwitch id="shapeActive" label="Hoạt động" checked={isActive} onChange={setIsActive} />
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px dashed #ddd", borderRadius: "8px", padding: "16px", background: "#f8fafc" }}>
                  {imageUrl ? (
                    <>
                      <img src={imageUrl} alt="Preview" style={{ maxWidth: "100%", maxHeight: "150px", objectFit: "contain", borderRadius: "4px", marginBottom: "8px" }} />
                      <span style={{ fontSize: "12px", color: "#64748b", wordBreak: "break-all", textAlign: "center" }}>Xem trước hình ảnh</span>
                    </>
                  ) : (
                    <span style={{ fontSize: "14px", color: "#94a3b8" }}>Chưa có ảnh</span>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
                <button type="submit">Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMediaPicker && (
        <MediaPicker
          type="IMAGE"
          currentValue={imageUrl}
          onSelect={(url) => setImageUrl(url)}
          onClose={() => setShowMediaPicker(false)}
        />
      )}

      {selectedParent && (
        <ExamplesModal
          parent={selectedParent}
          onClose={() => setSelectedParent(null)}
          type="shape"
        />
      )}
    </div>
  );
}

function ExamplesModal({ parent, onClose, type }: { parent: any; onClose: () => void; type: "number" | "shape" }) {
  const [examples, setExamples] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingExample, setEditingExample] = useState<any | null>(null);

  // Form
  const [exampleText, setExampleText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const resource = type === "number" ? "/number-examples" : "/shape-examples";
  const parentField = type === "number" ? "numberItemId" : "shapeItemId";

  async function loadExamples() {
    setLoading(true);
    try {
      const res = await adminApi.list(resource);
      const rows = res.data.data || [];
      const filtered = rows.filter((r: any) => r[parentField] === parent.id);
      setExamples(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExamples();
  }, [parent.id]);

  const openAdd = () => {
    setEditingExample(null);
    setExampleText("");
    setImageUrl("");
    setIsActive(true);
    setIsEditing(true);
  };

  const openEdit = (ex: any) => {
    setEditingExample(ex);
    setExampleText(ex.exampleText || "");
    setImageUrl(ex.imageUrl || "");
    setIsActive(ex.isActive !== false);
    setIsEditing(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      [parentField]: parent.id,
      exampleText: exampleText.trim(),
      imageUrl: imageUrl.trim() || null,
      isActive,
    };
    try {
      if (editingExample) {
        await adminApi.update(resource, editingExample.id, payload);
      } else {
        await adminApi.create(resource, payload);
      }
      setIsEditing(false);
      loadExamples();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Xóa ví dụ này?")) return;
    try {
      await adminApi.remove(resource, id);
      loadExamples();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "700px" }}>
        <div className="modal-header">
          <h2>Quản lý ví dụ cho: {parent.labelVn || parent.title}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        
        {!isEditing ? (
          <div className="modal-body">
            <div style={{ marginBottom: "16px", textAlign: "right" }}>
              <button onClick={openAdd}>➕ Thêm ví dụ</button>
            </div>
            {loading ? <p>Đang tải...</p> : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>
                    <th style={{ padding: "8px" }}>Nội dung ví dụ</th>
                    <th>Hình ảnh</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {examples.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: "16px", textAlign: "center" }}>Chưa có ví dụ nào</td></tr>
                  ) : examples.map(ex => (
                    <tr key={ex.id} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: "8px" }}>{ex.exampleText}</td>
                      <td>{ex.imageUrl ? <img src={ex.imageUrl} alt="preview" style={{ height: "30px" }} /> : "—"}</td>
                      <td>{ex.isActive ? "Hoạt động" : "Khóa"}</td>
                      <td>
                        <button className="secondary" style={{ padding: "4px 8px", marginRight: "4px" }} onClick={() => openEdit(ex)}>Sửa</button>
                        <button className="danger" style={{ padding: "4px 8px" }} onClick={() => handleDelete(ex.id)}>Xóa</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body" style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: "24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="field">
                  <label>Nội dung ví dụ *</label>
                  <textarea value={exampleText} onChange={(e) => setExampleText(e.target.value)} required />
                </div>
                <div className="field">
                  <label>URL Hình ảnh minh họa</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} style={{ flex: 1 }} />
                    <button type="button" className="secondary" onClick={() => setShowMediaPicker(true)}>Thư viện</button>
                  </div>
                </div>
                <div className="field">
                  <ToggleSwitch id="exActive" label="Hoạt động" checked={isActive} onChange={setIsActive} />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px dashed #ddd", borderRadius: "8px", padding: "16px", background: "#f8fafc" }}>
                {imageUrl ? (
                  <>
                    <img src={imageUrl} alt="Preview" style={{ maxWidth: "100%", maxHeight: "150px", objectFit: "contain", borderRadius: "4px", marginBottom: "8px" }} />
                    <span style={{ fontSize: "12px", color: "#64748b", wordBreak: "break-all", textAlign: "center" }}>Xem trước hình ảnh</span>
                  </>
                ) : (
                  <span style={{ fontSize: "14px", color: "#94a3b8" }}>Chưa có ảnh</span>
                )}
              </div>
            </div>
            {showMediaPicker && (
              <MediaPicker
                type="IMAGE"
                currentValue={imageUrl}
                onSelect={(url) => setImageUrl(url)}
                onClose={() => setShowMediaPicker(false)}
              />
            )}
            <div className="modal-footer">
              <button type="button" className="secondary" onClick={() => setIsEditing(false)}>Quay lại</button>
              <button type="submit">Lưu ví dụ</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
