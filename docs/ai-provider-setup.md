# Hướng dẫn Cấu hình Real AI Provider cho Hệ thống Voice

Tài liệu này hướng dẫn quản trị viên cách cấu hình các dịch vụ nhận dạng giọng nói (Speech-to-Text - STT) và chuyển văn bản thành giọng nói (Text-to-Speech - TTS) thật trong môi trường Production thông qua Firebase Cloud Functions.

---

## 1. Các Provider được hỗ trợ & Biến môi trường

Hệ thống Cloud Functions của `project_ha` được thiết kế dạng Adapter, sẵn sàng tích hợp với 3 provider phổ biến nhất hiện nay thông qua biến môi trường `VOICE_PROVIDER` cấu hình trên Firebase:

| Provider | Giá trị `VOICE_PROVIDER` | API Key / Credentials cần thiết |
| :--- | :--- | :--- |
| **Mock (Demo)** | `mock` (mặc định) | Không cần thiết |
| **OpenAI Whisper** | `openai` | `OPENAI_API_KEY` (Secret Manager) |
| **Google Cloud Speech** | `google` | Google Service Account JSON |
| **Azure Cognitive Services** | `azure` | Azure Speech Key & Region |

---

## 2. Các bước cấu hình chi tiết cho từng dịch vụ

### A. Cấu hình OpenAI Whisper (Khuyên dùng cho Tiếng Việt tốt nhất)
OpenAI Whisper cung cấp khả năng nhận diện tiếng Việt cực kỳ chính xác kể cả khi bé nói nhỏ hoặc ngọng nhẹ.

1. **Lấy API Key**: Truy cập vào [OpenAI Developer Platform](https://platform.openai.com) và tạo một API Key mới.
2. **Lưu API Key vào Firebase Secret Manager**:
   Chạy lệnh CLI sau để lưu khóa bảo mật an toàn, tránh bị rò rỉ:
   ```bash
   firebase functions:secrets:set OPENAI_API_KEY="sk-..."
   ```
3. **Cấu hình Biến môi trường**:
   Cấu hình Cloud Functions sử dụng provider `openai`:
   ```bash
   firebase functions:config:set voice.provider="openai"
   ```
4. **Code integration ở Backend** (Nằm trong `functions/src/index.ts` - phần placeholder):
   Sử dụng thư viện chính thức `openai` hoặc qua REST API:
   ```typescript
   import OpenAI from "openai";
   
   const openai = new OpenAI({
     apiKey: process.env.OPENAI_API_KEY,
   });
   
   // Chuyển đổi base64 thành file buffer tạm thời và gửi lên Whisper API
   const buffer = Buffer.from(audioBase64, "base64");
   // Whisper yêu cầu gửi dạng file object (Multipart/form-data)
   ```

---

### B. Cấu hình Google Cloud Speech-to-Text
Phù hợp khi muốn tích hợp sâu với hạ tầng Google Cloud và tận dụng các gói tín dụng miễn phí của Firebase.

1. **Bật Cloud Speech-to-Text API**: Truy cập Google Cloud Console của dự án Firebase và kích hoạt API này.
2. **Tải Key JSON**: Tạo Service Account mới có quyền `Speech-to-Text Admin` và tải tệp JSON Credentials xuống.
3. **Cấu hình trên Functions**:
   Lưu nội dung JSON credentials vào Secret Manager hoặc cấu hình đường dẫn Service Account trong Cloud Functions.
4. **Code integration**:
   Sử dụng thư viện `@google-cloud/speech` để gửi stream base64 trực tiếp lên API nhận diện.

---

### C. Cấu hình Microsoft Azure Speech Service
Ưu thế về tốc độ phản hồi nhanh và khả năng nhận diện giọng nói trẻ em tốt.

1. **Tạo Speech Resource**: Truy cập Azure Portal và tạo một tài nguyên Azure Speech Services.
2. **Lấy Key & Region**: Copy Key 1 và Region (ví dụ: `eastus`).
3. **Lưu khóa**:
   ```bash
   firebase functions:secrets:set AZURE_SPEECH_KEY="your-key"
   firebase functions:config:set voice.provider="azure" voice.azure_region="eastus"
   ```
4. **Code integration**:
   Sử dụng gói `microsoft-cognitiveservices-speech-sdk` để thực hiện chuyển đổi.

---

## 3. Tắt chế độ Mock Provider ở Môi trường Production

> [!IMPORTANT]
> Khi triển khai dự án lên môi trường Production thực tế cho người dùng cuối, bạn **bắt buộc** phải thực hiện hai bước sau để tắt hoàn toàn Mock Provider:

1. **Tắt cờ mock ở Cloud Functions code**:
   Mở tệp [functions/src/index.ts](file:///Users/huy/Documents/project_ha/functions/src/index.ts) và chuyển cờ về `false`:
   ```typescript
   const ENABLE_MOCK_VOICE_PROVIDER = false;
   ```
   *Lưu ý:* Khi cờ này bằng `false`, tham số `mockTranscript` gửi lên từ client di động sẽ bị bỏ qua hoàn toàn để ngăn chặn việc người dùng dùng app debug hack đáp án bằng cách gửi text giả lập.
2. **Tắt cờ demo ở Flutter App**:
   Mở cấu hình config của Flutter App và đặt:
   ```dart
   const bool ENABLE_DEMO_PREMIUM_UPGRADE = false;
   ```
   Điều này sẽ ẩn nút **"Kích hoạt Premium Demo"** trên giao diện di động.
3. **Đóng gói lại và Re-deploy**:
   - Deploy lại Cloud Functions: `firebase deploy --only functions`
   - Re-build Flutter App cho chợ ứng dụng.
