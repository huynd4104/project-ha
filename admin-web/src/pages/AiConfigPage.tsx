import { useState, useEffect } from "react";
import { aiConfigApi, AdminGeminiConfigResponse } from "../api/aiConfigApi";

export const AiConfigPage = () => {
  const [config, setConfig] = useState<AdminGeminiConfigResponse | null>(null);
  const [evaluationEnabled, setEvaluationEnabled] = useState(false);
  const [semanticModel, setSemanticModel] = useState("gemini-3.1-flash-lite");
  const [timeoutMs, setTimeoutMs] = useState(8000);
  const [apiKey, setApiKey] = useState("");
  const [isClearing, setIsClearing] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    loadConfig();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const loadConfig = async () => {
    try {
      const data = await aiConfigApi.getGeminiConfig();
      setConfig(data);
      setEvaluationEnabled(data.evaluationEnabled);
      setSemanticModel(data.semanticModel);
      setTimeoutMs(data.timeoutMs);
    } catch (e) {
      showToast("Không thể tải cấu hình AI");
    }
  };

  const handleSave = async () => {
    try {
      await aiConfigApi.updateGeminiConfig({
        evaluationEnabled,
        semanticModel,
        timeoutMs,
        apiKey: apiKey || undefined,
        clearApiKey: isClearing,
      });
      showToast("Đã lưu cấu hình thành công");
      setApiKey("");
      setIsClearing(false);
      loadConfig();
    } catch (e) {
      showToast("Lưu cấu hình thất bại");
    }
  };

  const handleTest = async () => {
    try {
      // Pass the current state to backend for real testing
      const res = await aiConfigApi.testGeminiConfig({ 
        apiKey: apiKey || undefined, 
        semanticModel, 
        timeoutMs 
      });
      if (res.success) {
        showToast("✅ " + res.message);
      } else {
        showToast("❌ Lỗi: " + res.message);
      }
      loadConfig(); // Reload to get lastTestedAt from DB
    } catch (e) {
      showToast("❌ Kiểm tra kết nối thất bại");
    }
  };

  const showLiveWarning = semanticModel.toLowerCase().includes("live") || semanticModel.toLowerCase().includes("audio");

  return (
    <div>
      <div className="toolbar">
        <h1>Cấu hình AI</h1>
      </div>

      <div className="panel" style={{ maxWidth: "800px" }}>
        <div style={{ padding: "20px" }}>
            <h2>Cấu hình Gemini</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "20px" }}>Cấu hình này dùng cho việc đánh giá ngữ nghĩa câu trả lời của trẻ nhỏ.</p>
            
            <div className="field" style={{ marginBottom: "24px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                    <input 
                        type="checkbox" 
                        checked={evaluationEnabled} 
                        onChange={(e) => setEvaluationEnabled(e.target.checked)}
                        style={{ width: "20px", height: "20px" }}
                    />
                    <span>Bật đánh giá ngữ nghĩa bằng Gemini</span>
                </label>
            </div>

            <div className="field" style={{ marginBottom: "20px" }}>
                <label>Gemini API Key</label>
                {config?.apiKeyConfigured && !isClearing ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f1f5f9", padding: "8px 12px", borderRadius: "6px", marginBottom: "8px" }}>
                        <span style={{ fontSize: "13px", color: "var(--success)" }}>✅ API key: Đã cấu hình ({config.maskedApiKey || "********"})</span>
                        <button className="danger small" onClick={() => setIsClearing(true)} style={{ padding: "2px 8px", fontSize: "11px" }}>Xóa Key</button>
                    </div>
                ) : (
                    isClearing && <p style={{ color: "var(--danger)", fontSize: "12px", marginBottom: "8px" }}>⚠️ Key sẽ bị xóa sau khi bạn bấm Lưu.</p>
                )}
                <input 
                    type="password" 
                    placeholder={config?.apiKeyConfigured && !isClearing ? "Nhập key mới nếu muốn thay đổi" : "Nhập Gemini API key"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    autoComplete="off"
                />
            </div>

            <div className="field" style={{ marginBottom: "20px" }}>
                <label>Model đánh giá ngữ nghĩa</label>
                <input 
                    type="text" 
                    value={semanticModel} 
                    onChange={(e) => setSemanticModel(e.target.value)} 
                    placeholder="e.g. gemini-3.1-flash-lite"
                />
                <span className="helper">Dùng model dạng text để đánh giá câu trả lời của bé. Không dùng model Live/audio-to-audio ở mục này.</span>
                {showLiveWarning && (
                    <p style={{ color: "var(--warning)", background: "#fffbeb", padding: "8px 12px", borderRadius: "6px", fontSize: "13px", marginTop: "8px", border: "1px solid #fef3c7" }}>
                        ⚠️ Model này có vẻ dành cho Live/audio. Tính năng hiện tại chỉ cần model text để đánh giá ngữ nghĩa.
                    </p>
                )}
            </div>

            <div className="field" style={{ marginBottom: "24px" }}>
                <label>Timeout (ms)</label>
                <input 
                    type="number" 
                    min="1000" 
                    max="30000" 
                    value={timeoutMs} 
                    onChange={(e) => setTimeoutMs(Number(e.target.value))} 
                />
                <span className="helper">Thời gian chờ tối đa cho mỗi yêu cầu đánh giá (1000ms - 30000ms).</span>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "32px", borderTop: "1px solid var(--border)", paddingTop: "20px" }}>
                <button onClick={handleSave}>Lưu cấu hình</button>
                <button className="secondary" onClick={handleTest}>Kiểm tra kết nối</button>
            </div>

            {config && config.lastTestedAt && (
                <div style={{ marginTop: "24px", fontSize: "13px", color: "var(--text-muted)" }}>
                    <p>Lần kiểm tra cuối: {new Date(config.lastTestedAt).toLocaleString()}</p>
                    <p>Trạng thái: <span style={{ color: config.lastTestStatus === "SUCCESS" ? "var(--success)" : "var(--danger)" }}>{config.lastTestStatus || "Chưa kiểm tra"}</span></p>
                    {config.lastTestMessage && <p>Kết quả: {config.lastTestMessage}</p>}
                </div>
            )}
        </div>
      </div>

      {toastMsg && <div className="toast"><span>✨</span> {toastMsg}</div>}
    </div>
  );
};
