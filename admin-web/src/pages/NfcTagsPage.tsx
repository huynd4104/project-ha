import { useEffect, useState } from "react";
import { adminApi } from "../api/adminApi";
import { TableControls } from "../components/TableControls";
import { ToggleSwitch } from "../components/ToggleSwitch";
import { useTableControls } from "../utils/tableControls";

interface NfcTag {
  id: string;
  tagUid: string;
  displayName: string;
  tagType: "ANSWER" | "FLASHCARD" | "NUMBER" | "SHAPE" | "PECS" | "GENERIC";
  targetType: "ANSWER_OPTION" | "FLASHCARD" | "RAW_VALUE";
  targetId?: string;
  payloadValue?: string;
  spokenText?: string;
  description?: string;
  isActive: boolean;
}

const TAG_TYPE_MAP: Record<string, string> = {
  ANSWER: "Đáp án",
  FLASHCARD: "Thẻ học",
  NUMBER: "Số học",
  SHAPE: "Hình khối",
  PECS: "Giao tiếp hình ảnh (PECS)",
  GENERIC: "Khác",
};

const TARGET_TYPE_MAP: Record<string, string> = {
  ANSWER_OPTION: "Lựa chọn đáp án",
  FLASHCARD: "Thẻ học",
  RAW_VALUE: "Giá trị thô",
};

const TAG_TYPE_OPTIONS = Object.keys(TAG_TYPE_MAP);
const TARGET_TYPE_OPTIONS = Object.keys(TARGET_TYPE_MAP);

export function NfcTagsPage() {
  const [items, setItems] = useState<NfcTag[]>([]);
  const [filtered, setFiltered] = useState<NfcTag[]>([]);
  const [search, setSearch] = useState("");
  const [filterTagType, setFilterTagType] = useState("");
  const [filterTargetType, setFilterTargetType] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<NfcTag | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form states
  const [tagUid, setTagUid] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [tagType, setTagType] = useState<NfcTag["tagType"]>("ANSWER");
  const [targetType, setTargetType] = useState<NfcTag["targetType"]>("ANSWER_OPTION");
  const [targetId, setTargetId] = useState("");
  const [payloadValue, setPayloadValue] = useState("");
  const [spokenText, setSpokenText] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const res = await adminApi.list("/nfc-tags");
      setItems(res.data.data || []);
    } catch (e) {
      console.error("Lỗi khi tải danh sách thẻ NFC: ", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let result = items;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.tagUid.toLowerCase().includes(q) ||
          item.displayName.toLowerCase().includes(q) ||
          (item.payloadValue && item.payloadValue.toLowerCase().includes(q))
      );
    }

    if (filterTagType) {
      result = result.filter((item) => item.tagType === filterTagType);
    }

    if (filterTargetType) {
      result = result.filter((item) => item.targetType === filterTargetType);
    }

    setFiltered(result);
  }, [items, search, filterTagType, filterTargetType]);

  const table = useTableControls(
    filtered,
    [
      { value: "displayName", label: "Tên hiển thị", getValue: (item) => item.displayName },
      { value: "tagUid", label: "UID thẻ", getValue: (item) => item.tagUid },
      { value: "tagType", label: "Loại thẻ", getValue: (item) => item.tagType },
      { value: "targetType", label: "Kiểu mục tiêu", getValue: (item) => item.targetType },
      { value: "status", label: "Trạng thái", getValue: (item) => item.isActive },
    ],
    "displayName"
  );

  const openAddModal = () => {
    setEditingItem(null);
    setTagUid("");
    setDisplayName("");
    setTagType("ANSWER");
    setTargetType("ANSWER_OPTION");
    setTargetId("");
    setPayloadValue("");
    setSpokenText("");
    setDescription("");
    setIsActive(true);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item: NfcTag) => {
    setEditingItem(item);
    setTagUid(item.tagUid || "");
    setDisplayName(item.displayName || "");
    setTagType(item.tagType || "ANSWER");
    setTargetType(item.targetType || "ANSWER_OPTION");
    setTargetId(item.targetId || "");
    setPayloadValue(item.payloadValue || "");
    setSpokenText(item.spokenText || "");
    setDescription(item.description || "");
    setIsActive(item.isActive !== false);
    setErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa thẻ NFC này?")) return;
    try {
      await adminApi.remove("/nfc-tags", id);
      loadData();
    } catch (e: any) {
      console.error(e);
      alert("Lỗi khi xóa thẻ NFC: " + (e.message || e));
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!tagUid.trim()) errs.tagUid = "UID thẻ NFC không được để trống.";
    if (!displayName.trim()) errs.displayName = "Tên hiển thị không được để trống.";
    
    // Check uniqueness of tagUid when adding new or modifying existing with different UID
    const duplicate = items.find(
      (item) => item.tagUid.trim().toLowerCase() === tagUid.trim().toLowerCase() && (!editingItem || item.id !== editingItem.id)
    );
    if (duplicate) {
      errs.tagUid = "Mã UID thẻ này đã tồn tại trong hệ thống.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      tagUid: tagUid.trim(),
      displayName: displayName.trim(),
      tagType,
      targetType,
      targetId: targetId.trim() || null,
      payloadValue: payloadValue.trim() || null,
      spokenText: spokenText.trim() || null,
      description: description.trim() || null,
      isActive,
    };

    try {
      if (editingItem) {
        await adminApi.update("/nfc-tags", editingItem.id, payload);
      } else {
        await adminApi.create("/nfc-tags", payload);
      }
      setIsModalOpen(false);
      loadData();
    } catch (e: any) {
      console.error(e);
      alert("Lỗi khi lưu thẻ NFC: " + (e.message || e));
    }
  };

  return (
    <div>
      <div className="toolbar">
        <h1>Quản lý thẻ NFC</h1>
        <button onClick={openAddModal}>➕ Thêm thẻ NFC</button>
      </div>

      <div className="panel" style={{ padding: "16px", marginBottom: "16px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Tìm kiếm theo UID, tên hiển thị, giá trị..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
          style={{ flex: "1", minWidth: "250px" }}
        />
        
        <select
          value={filterTagType}
          onChange={(e) => setFilterTagType(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)" }}
        >
          <option value="">-- Tất cả loại thẻ --</option>
          {TAG_TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>{TAG_TYPE_MAP[t] || t}</option>
          ))}
        </select>

        <select
          value={filterTargetType}
          onChange={(e) => setFilterTargetType(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)" }}
        >
          <option value="">-- Tất cả mục tiêu --</option>
          {TARGET_TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>{TARGET_TYPE_MAP[t] || t}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Đang tải danh sách thẻ NFC...</p>
      ) : filtered.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "40px" }}>
          <p style={{ color: "var(--text-muted)" }}>Không tìm thấy thẻ NFC nào.</p>
        </div>
      ) : (
        <>
          <TableControls {...table} />
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tên hiển thị</th>
                  <th>Mã UID</th>
                  <th>Loại thẻ</th>
                  <th>Kiểu mục tiêu</th>
                  <th>Target ID</th>
                  <th>Payload Value</th>
                  <th>Văn bản phát âm</th>
                  <th style={{ width: "120px" }}>Trạng thái</th>
                  <th style={{ width: "150px" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {table.pagedItems.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: "600" }}>{item.displayName}</td>
                    <td><code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>{item.tagUid}</code></td>
                    <td><span className="badge info">{TAG_TYPE_MAP[item.tagType] || item.tagType}</span></td>
                    <td><span className="badge info">{TARGET_TYPE_MAP[item.targetType] || item.targetType}</span></td>
                    <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{item.targetId || "—"}</td>
                    <td style={{ fontWeight: "bold" }}>{item.payloadValue || "—"}</td>
                    <td style={{ color: "var(--text-muted)" }}>{item.spokenText || "—"}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "min(680px, 95vw)" }}>
            <div className="modal-header">
              <h2>{editingItem ? "Chỉnh sửa thẻ NFC" : "Thêm thẻ NFC mới"}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="field">
                  <label>Mã UID Thẻ NFC *</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 04:A2:3B:4C:5D:6E:7F"
                    value={tagUid}
                    onChange={(e) => setTagUid(e.target.value)}
                  />
                  {errors.tagUid && <span className="error-msg">{errors.tagUid}</span>}
                </div>

                <div className="field">
                  <label>Tên hiển thị *</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Thẻ Quả Táo, Thẻ Đáp Án A"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                  {errors.displayName && <span className="error-msg">{errors.displayName}</span>}
                </div>

                <div className="field">
                  <label>Loại thẻ NFC (tag_type)</label>
                  <select value={tagType} onChange={(e) => setTagType(e.target.value as any)}>
                    {TAG_TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>{TAG_TYPE_MAP[t] || t}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Kiểu mục tiêu liên kết (target_type)</label>
                  <select value={targetType} onChange={(e) => setTargetType(e.target.value as any)}>
                    {TARGET_TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>{TARGET_TYPE_MAP[t] || t}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>ID mục tiêu liên kết (target_id - tùy chọn)</label>
                  <input
                    type="text"
                    placeholder="Nhập UUID của đáp án hoặc flashcard nếu có"
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Giá trị payload (payload_value - tùy chọn)</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: apple, banana, A, B..."
                    value={payloadValue}
                    onChange={(e) => setPayloadValue(e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Văn bản giọng nói phát âm (spoken_text - tùy chọn)</label>
                  <input
                    type="text"
                    placeholder="Văn bản TTS sẽ phát âm khi bé chạm thẻ"
                    value={spokenText}
                    onChange={(e) => setSpokenText(e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Mô tả chi tiết</label>
                  <textarea
                    placeholder="Mô tả công dụng hoặc ghi chú của thẻ..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="field">
                  <ToggleSwitch id="isActive" label="Kích hoạt thẻ hoạt động" checked={isActive} onChange={setIsActive} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
                <button type="submit">{editingItem ? "Cập nhật" : "Tạo mới"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
