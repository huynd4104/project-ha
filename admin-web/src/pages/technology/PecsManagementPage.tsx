import { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import { TableControls } from "../../components/TableControls";
import { ToggleSwitch } from "../../components/ToggleSwitch";
import { useTableControls } from "../../utils/tableControls";
import { MediaPicker } from "../../components/MediaPicker";

type Tab = "EMOTION" | "DAILY_ACTIVITY" | "NON_TOPIC";

interface PecsCard {
  id: string;
  category: Tab;
  title: string;
  spokenText: string;
  imageUrl?: string;
  nfcTagId?: string;
  isActive: boolean;
}

export function PecsManagementPage() {
  const [tab, setTab] = useState<Tab>("EMOTION");
  const [items, setItems] = useState<PecsCard[]>([]);
  const [nfcTags, setNfcTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PecsCard | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [spokenText, setSpokenText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [nfcTagId, setNfcTagId] = useState("");
  const [isActive, setIsActive] = useState(true);

  const resourcePath = "/pecs-cards";

  async function loadData() {
    setLoading(true);
    try {
      const res = await adminApi.list(resourcePath);
      const rows = res.data.data || [];
      // Filter items by current active tab category
      setItems(rows.filter((row: any) => row.category === tab));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadNfcTags() {
    try {
      const res = await adminApi.list("/nfc-tags");
      const tags = res.data.data || [];
      // Filter for PECS tags if relevant, or show all. Let's show PECS tags first then others.
      setNfcTags(tags);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadData();
  }, [tab]);

  useEffect(() => {
    loadNfcTags();
  }, []);

  const filtered = items.filter((item) => {
    const q = search.toLowerCase();
    return (
      (item.title?.toLowerCase() || "").includes(q) ||
      (item.spokenText?.toLowerCase() || "").includes(q)
    );
  });

  const table = useTableControls(
    filtered,
    [
      { value: "title", label: "Tiêu đề", getValue: (i) => i.title },
      { value: "spokenText", label: "Câu phát âm", getValue: (i) => i.spokenText },
      { value: "nfcTag", label: "Thẻ NFC", getValue: (i) => {
          const tag = nfcTags.find((t) => t.id === i.nfcTagId);
          return tag ? `${tag.displayName} (${tag.payloadValue})` : "Chưa liên kết";
        }
      },
      { value: "status", label: "Trạng thái", getValue: (i) => i.isActive },
    ],
    "title"
  );

  const openAddModal = () => {
    setEditingItem(null);
    setTitle("");
    setSpokenText("");
    setImageUrl("");
    setNfcTagId("");
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (item: PecsCard) => {
    setEditingItem(item);
    setTitle(item.title || "");
    setSpokenText(item.spokenText || "");
    setImageUrl(item.imageUrl || "");
    setNfcTagId(item.nfcTagId || "");
    setIsActive(item.isActive !== false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      category: tab,
      title: title.trim(),
      spokenText: spokenText.trim(),
      imageUrl: imageUrl.trim() || null,
      nfcTagId: nfcTagId || null,
      isActive,
    };

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
    if (!window.confirm("Xóa thẻ PECS này?")) return;
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
        <h1>Hệ thống Giao tiếp Trao đổi bằng Hình ảnh (PECS)</h1>
        <button onClick={openAddModal}>➕ Thêm mới</button>
      </div>

      <div className="tab-nav">
        <button className={`tab-btn ${tab === "EMOTION" ? "active" : ""}`} onClick={() => setTab("EMOTION")}>
          Cảm xúc
        </button>
        <button className={`tab-btn ${tab === "DAILY_ACTIVITY" ? "active" : ""}`} onClick={() => setTab("DAILY_ACTIVITY")}>
          Sinh hoạt hằng ngày
        </button>
        <button className={`tab-btn ${tab === "NON_TOPIC" ? "active" : ""}`} onClick={() => setTab("NON_TOPIC")}>
          Non-topic
        </button>
      </div>

      <div className="panel" style={{ padding: "16px", marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Tìm kiếm theo tiêu đề hoặc câu phát âm..."
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
                  <th>Tiêu đề</th>
                  <th>Câu phát âm (TTS)</th>
                  <th>Thẻ NFC liên kết</th>
                  <th>Hình ảnh</th>
                  <th style={{ width: "120px" }}>Trạng thái</th>
                  <th style={{ width: "150px" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {table.pagedItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "24px" }}>
                      Chưa có thẻ PECS nào trong mục này.
                    </td>
                  </tr>
                ) : (
                  table.pagedItems.map((item: PecsCard) => {
                    const linkedTag = nfcTags.find((t) => t.id === item.nfcTagId);
                    return (
                      <tr key={item.id}>
                        <td style={{ fontWeight: "bold" }}>{item.title}</td>
                        <td>{item.spokenText}</td>
                        <td>
                          {linkedTag ? (
                            <span className="badge active" style={{ background: "#e0f2fe", color: "#0369a1" }}>
                              🏷️ {linkedTag.displayName}
                            </span>
                          ) : (
                            <span className="badge inactive" style={{ background: "#f1f5f9", color: "#64748b" }}>
                              Chưa liên kết
                            </span>
                          )}
                        </td>
                        <td>{item.imageUrl ? <img src={item.imageUrl} alt="preview" style={{ height: "45px", borderRadius: "4px" }} /> : "—"}</td>
                        <td>
                          <span className={`badge ${item.isActive ? "active" : "inactive"}`}>
                            {item.isActive ? "Hoạt động" : "Tạm khóa"}
                          </span>
                        </td>
                        <td>
                          <div className="actions">
                            <button className="secondary" onClick={() => openEditModal(item)}>Sửa</button>
                            <button className="danger" onClick={() => handleDelete(item.id)}>Xóa</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "700px" }}>
            <div className="modal-header">
              <h2>{editingItem ? "Cập nhật" : "Thêm mới"} thẻ PECS ({
                tab === "EMOTION" ? "Cảm xúc" : tab === "DAILY_ACTIVITY" ? "Sinh hoạt hằng ngày" : "Non-topic"
              })</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: "24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="field">
                    <label>Tiêu đề thẻ *</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                  </div>
                  <div className="field">
                    <label>Câu nói phát âm (TTS) *</label>
                    <textarea value={spokenText} onChange={(e) => setSpokenText(e.target.value)} required style={{ minHeight: "80px" }} />
                  </div>
                  <div className="field">
                    <label>Liên kết Thẻ NFC</label>
                    <select value={nfcTagId} onChange={(e) => setNfcTagId(e.target.value)}>
                      <option value="">-- Không liên kết --</option>
                      {nfcTags.map((tag) => (
                        <option key={tag.id} value={tag.id}>
                          {tag.displayName} ({tag.payloadValue})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>URL Hình ảnh</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} style={{ flex: 1 }} />
                      <button type="button" className="secondary" onClick={() => setShowMediaPicker(true)}>Thư viện</button>
                    </div>
                  </div>
                  <div className="field">
                    <ToggleSwitch id="pecsActive" label="Hoạt động" checked={isActive} onChange={setIsActive} />
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
    </div>
  );
}
