import { useEffect, useState } from "react";
import { mediaService, MediaAsset } from "../services/mediaService";

interface MediaPickerProps {
  category?: "NPC" | "FLASHCARD" | "AI_CONVERSATION" | "GENERAL";
  type?: "IMAGE" | "AUDIO" | "VIDEO";
  currentValue?: string;
  onSelect: (url: string) => void;
  onClose: () => void;
}

export function MediaPicker({ category, type, currentValue = "", onSelect, onClose }: MediaPickerProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [filtered, setFiltered] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUrl, setSelectedUrl] = useState(currentValue);
  const [customUrl, setCustomUrl] = useState(currentValue);
  const [activeCategory, setActiveCategory] = useState(category || "GENERAL");

  useEffect(() => {
    mediaService.list()
      .then((res) => {
        setAssets(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    let list = assets;
    if (type) {
      list = list.filter((a) => a.type === type);
    }
    if (activeCategory && activeCategory !== "GENERAL") {
      list = list.filter((a) => a.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.name.toLowerCase().includes(q) || a.url.toLowerCase().includes(q));
    }
    setFiltered(list);
  }, [assets, type, activeCategory, search]);

  const handleSelectAsset = (url: string) => {
    setSelectedUrl(url);
    setCustomUrl(url);
  };

  const handleConfirm = () => {
    onSelect(customUrl.trim());
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "min(750px, 95vw)" }}>
        <div className="modal-header">
          <h2>Chọn Media</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {/* Custom URL Input Panel */}
          <div className="panel" style={{ padding: "16px", marginBottom: "16px", background: "#f8fafc" }}>
            <div className="field">
              <label>Đường dẫn liên kết (URL)</label>
              <input
                type="text"
                placeholder="Nhập URL trực tiếp hoặc chọn từ danh sách bên dưới"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
              />
              <span className="helper">Bạn có thể chọn một asset từ thư viện bên dưới để điền tự động vào ô này.</span>
            </div>
            {customUrl && (
              <div style={{ marginTop: "12px" }}>
                <span>Preview: </span>
                {type === "IMAGE" || customUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
                  <img src={customUrl} alt="Preview" style={{ maxHeight: "80px", borderRadius: "4px", marginTop: "4px", display: "block" }} onError={(e) => { (e.target as any).style.display = "none"; }} />
                ) : type === "AUDIO" || customUrl.match(/\.(mp3|wav|ogg)/i) ? (
                  <audio src={customUrl} controls style={{ display: "block", marginTop: "4px", maxHeight: "40px" }} />
                ) : null}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Tìm kiếm media..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: "180px" }}
            />
            
            {/* Category selection filters if not locked by props */}
            {!category && (
              <select
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value as any)}
                style={{ width: "auto" }}
              >
                <option value="GENERAL">Tất cả danh mục</option>
                <option value="NPC">Mascot</option>
                <option value="FLASHCARD">Thẻ học</option>
                <option value="AI_CONVERSATION">Hội thoại AI</option>
              </select>
            )}
          </div>

          {loading ? (
            <p>Đang tải thư viện media...</p>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "8px" }}>
              <p style={{ color: "var(--text-muted)", marginBottom: "8px" }}>Không tìm thấy media asset nào phù hợp.</p>
              <button className="secondary" onClick={() => { setSearch(""); setActiveCategory("GENERAL"); }}>Reset bộ lọc</button>
            </div>
          ) : (
            <div className="media-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", maxHeight: "300px", overflowY: "auto" }}>
              {filtered.map((asset) => {
                const isSelected = selectedUrl === asset.url;
                return (
                  <div
                    key={asset.id}
                    className={`media-card selectable ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSelectAsset(asset.url)}
                  >
                    <div className="media-preview-container" style={{ aspectRatio: "16/10", maxHeight: "90px" }}>
                      {asset.type === "IMAGE" ? (
                        <img src={asset.thumbnailUrl || asset.url} alt={asset.name} />
                      ) : asset.type === "AUDIO" ? (
                        <span style={{ fontSize: "28px" }}>🎵</span>
                      ) : (
                        <span style={{ fontSize: "28px" }}>🎥</span>
                      )}
                    </div>
                    <div className="media-info" style={{ padding: "6px 8px" }}>
                      <div className="media-title" style={{ fontSize: "11px" }} title={asset.name}>{asset.name}</div>
                      <div className="media-meta" style={{ fontSize: "9px" }}>
                        <span>{asset.category}</span>
                        <span>{asset.type}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="secondary" onClick={onClose}>Hủy bỏ</button>
          <button onClick={handleConfirm} disabled={!customUrl}>Chọn</button>
        </div>
      </div>
    </div>
  );
}
