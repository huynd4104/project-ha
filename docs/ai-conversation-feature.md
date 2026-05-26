# Tài liệu Tính năng: Hội thoại cùng AI (AI Conversation)

Tài liệu này mô tả chi tiết tính năng **Hội thoại cùng AI**, một module cốt lõi được xây dựng để thay thế hệ thống "Thư viện hội thoại (Dialogues)" cũ trên toàn bộ hệ sinh thái Project HA (bao gồm Mobile Flutter, Backend Spring Boot và Admin Portal).

---

## 1. Mục tiêu tính năng
* **Phát triển ngôn ngữ cho trẻ**: Hỗ trợ trẻ em luyện nói, giao tiếp tương tác 2 chiều thông qua các câu hỏi và tình huống sinh động theo từng chủ đề.
* **Đánh giá phản xạ**: Kiểm tra khả năng phát âm, nhận diện từ khóa và ngữ nghĩa câu trả lời của trẻ một cách nhẹ nhàng và tích cực.
* **Theo dõi tiến độ**: Cung cấp cho phụ huynh cái nhìn trực quan về sự tiến bộ ngôn ngữ hàng ngày của con, giúp nhận biết điểm mạnh và các chủ đề con cần luyện tập thêm.

## 2. Đối tượng sử dụng
* **Trẻ em (Người học chính)**: Trực tiếp tương tác thông qua giọng nói trên ứng dụng di động Flutter.
* **Phụ huynh (Người giám sát)**: Theo dõi tiến độ, xem lịch sử luyện thoại và nhận các gợi ý luyện tập cho con qua Dashboard phụ huynh.
* **Quản trị viên (Admin)**: Quản lý danh mục chủ đề, cấu hình bộ câu hỏi và các quy tắc chấm điểm trên Admin Web Portal.

## 3. Luồng sử dụng của bé (Child Flow)
1. **Chọn chủ đề**: Bé chọn một chủ đề trò chuyện yêu thích (ví dụ: Gia đình, Hoa quả, Động vật).
2. **Mascot giới thiệu**: Mascot mở đầu phiên bằng lời chào ấm áp và đọc to câu hỏi đầu tiên bằng Tiếng Việt.
3. **Trả lời bằng giọng nói**: 
   * Bé chạm vào biểu tượng micro màu cam để bắt đầu nói.
   * Nếu bé im lặng quá 12 giây, Mascot sẽ tự động phát âm nhắc nhở: *"Con bấm nút mic màu cam để trả lời câu hỏi nhé."*
   * Gói native Speech-to-Text (STT) chuyển đổi giọng nói thành văn bản trực tiếp trên thiết bị của bé.
4. **Phân tích & Phản hồi**: 
   * Văn bản câu trả lời gửi lên backend chấm điểm tự động.
   * Mascot đọc to lời nhận xét và gợi ý từ backend (Ví dụ: *"Giỏi lắm con!"*, hoặc *"Gần đúng rồi, con thử lại nhé..."*).
5. **Chuyển tiếp hoặc Kết thúc**: Tự động chuyển câu hỏi tiếp theo cho đến khi hoàn thành hoặc bé bấm nút "Con muốn nghỉ" để kết thúc sớm và nhận tổng kết.

## 4. Luồng xem tiến bộ của phụ huynh (Parent Flow)
1. **Truy cập Dashboard**: Phụ huynh vào màn hình "Tiến bộ hội thoại AI" trên thiết bị di động.
2. **Xem số liệu thống kê**: Nhận thông tin tổng quan về:
   * Tổng số phiên con đã hoàn thành.
   * Tổng thời gian luyện tập (tính bằng phút).
   * Tổng số câu hỏi đã phản hồi và tỷ lệ phản hồi tốt (%).
3. **Tiến trình theo chủ đề**: Biểu đồ hiển thị mức độ hoàn thành và điểm trung bình của con đối với từng chủ đề riêng biệt.
4. **Lịch sử chi tiết**: Xem danh sách các phiên luyện tập gần đây. Bấm vào từng phiên để xem chi tiết Mascot đã hỏi câu gì và bé đã trả lời như thế nào.
5. **Gợi ý cá nhân hóa**: Nhận các đề xuất tự động từ hệ thống như: *"Nên luyện lại chủ đề động vật 2-3 lần tuần này. Hãy khuyến khích bé trả lời bằng câu ngắn."*

---

## 5. Kiến trúc kỹ thuật (Technical Architecture)

Sơ đồ vận hành luồng đàm thoại hiện tại:

```
                                  +-------------------+
                                  |    Database       |
                                  | (Questions/Rules) |
                                  +---------+---------+
                                            |
                                            ▼
+------------------+              +---------+---------+
|  Flutter Client  |  Turn Text   |    Backend API    |
|   (Device STT)   +------------->| (Rule Evaluation) |
|   (Device TTS)   |<------------ +---------+---------+
+------------------+  Feedback/Score        |
                                            ▼
                                  +---------+---------+
                                  | Progress Tracking |
                                  +-------------------+
```

Hệ thống được thiết kế theo hướng **Backend-controlled** giúp đảm bảo tính nhất quán tuyệt đối về nghiệp vụ:
* **Flutter Client**: Chỉ đóng vai trò là giao diện hiển thị, xử lý phần cứng ghi âm (STT) và phát âm (TTS).
* **Backend**: Lưu trữ bộ câu hỏi và chấm điểm độc lập. Đảm bảo toàn quyền quyết định về trạng thái và tiến trình học tập của trẻ.

---

## 6. Vì sao dùng STT + TTS + Backend Evaluation thay vì AI chat hoàn toàn?
Để đáp ứng các tiêu chuẩn đặc thù cho ứng dụng giáo dục trẻ em, hệ thống sử dụng cơ chế đàm thoại định hướng (Guided Conversation) thay vì để mô hình AI tự do trò chuyện:
* **Kiểm soát nội dung an toàn**: Tránh tuyệt đối việc AI tự phát ngôn lệch hướng, sử dụng ngôn ngữ phức tạp hoặc nhắc đến các từ ngữ nhạy cảm liên quan đến bệnh lý, chẩn đoán y tế hoặc so sánh tiêu cực.
* **Bám sát giáo trình**: Đảm bảo trẻ học đúng trọng tâm bài học, đi theo đúng tuyến câu hỏi đã được kiểm duyệt bởi các chuyên gia giáo dục.
* **Chấm điểm nhất quán**: Các thuật toán so sánh (Exact, Keyword, Semantic) trên Backend giúp đưa ra điểm số chính xác và khách quan hơn, giúp việc theo dõi tiến bộ của phụ huynh có cơ sở khoa học rõ ràng.
* **Hoạt động ổn định**: Giảm thiểu sự phụ thuộc vào kết nối mạng thời gian thực băng thông lớn và chi phí API đắt đỏ của các dịch vụ Live Streaming Audio.

---

## 7. Các bảng Database chính
* **`ai_conversation_topics`**: Lưu trữ các chủ đề luyện thoại (Mã code, tên tiêu đề, mô tả, độ tuổi phù hợp, độ khó, trạng thái kích hoạt).
* **`ai_conversation_questions`**: Bộ câu hỏi thuộc từng chủ đề (Văn bản câu hỏi hiển thị, văn bản để đọc TTS, câu trả lời mong đợi, từ khóa chấp nhận, thuật toán đánh giá).
* **`ai_conversation_sessions`**: Ghi nhận thông tin mỗi phiên luyện tập (Trạng thái phiên, thời gian bắt đầu, kết thúc, tổng số câu hỏi, số câu trả lời đúng/sai/trung bình).
* **`ai_conversation_turns`**: Chi tiết từng lượt thoại trong phiên (Nội dung bé nói, điểm số đạt được, đánh giá kết quả, gợi ý đã dùng).
* **`ai_conversation_progress_daily`**: Thống kê tiến bộ tích lũy theo ngày của bé.
* **`ai_conversation_topic_progress`**: Thống kê tiến bộ tích lũy theo từng chủ đề của bé.

---

## 8. Các Backend APIs chính
* `GET /api/ai-conversations/topics`: Lấy danh sách các chủ đề luyện tập đang hoạt động.
* `POST /api/ai-conversations/sessions/start`: Khởi tạo phiên luyện thoại mới cho bé.
* `POST /api/ai-conversations/sessions/{sessionId}/turns`: Gửi câu trả lời bằng giọng nói (dạng text) lên hệ thống để chấm điểm và nhận feedback.
* `POST /api/ai-conversations/sessions/{sessionId}/complete`: Tổng kết và đóng phiên làm việc, cập nhật tiến độ cho bé.
* `POST /api/ai-conversations/sessions/{sessionId}/live-token`: Cấp mã thông báo kết nối (hỗ trợ cho cấu hình chế độ MOCK/LIVE).
* `GET /api/parent/children/{childId}/ai-conversations/progress/overview`: Lấy số liệu Dashboard tổng quan của phụ huynh.

---

## 9. Các màn hình chính trên Mobile Flutter
* **`ChildAiConversationTopicsScreen`**: Danh sách chủ đề trực quan sinh động kèm MASCOT phản ứng động để bé lựa chọn.
* **`AiConversationLiveScreen`**: Không gian trò chuyện chính của bé với nút bấm micro màu cam đặc trưng, hiệu ứng sóng âm rung động, bong bóng hội thoại và biểu cảmMASCOT thay đổi theo trạng thái nói/nghe/khen ngợi.
* **`AiConversationSummaryScreen`**: Trang tổng hợp thành tích thân thiện, khen ngợi sự nỗ lực của bé sau khi hoàn thành.
* **`ChildAiProgressDashboardScreen`**: Dashboard quản lý của phụ huynh bao gồm biểu đồ tròn chỉ số phản hồi tốt, biểu đồ cột luyện tập và thẻ gợi ý tương tác với con hàng ngày.

---

## 10. Privacy & Safety (Quyền riêng tư & An toàn trẻ em)
* **Không lưu trữ âm thanh thô**: File ghi âm giọng nói của bé chỉ được xử lý cục bộ chuyển thành dạng text trên thiết bị và giải phóng ngay lập tức, không lưu trữ tệp tin âm thanh thô trên server để tránh rò rỉ sinh trắc học của trẻ.
* **Bảo mật khóa API**: Khóa `GEMINI_API_KEY` được lưu trữ an toàn trong biến môi trường tại Backend, tuyệt đối không gửi về phía Client di động.
* **Ngăn chặn từ ngữ tiêu cực**: Hệ thống đánh giá không sử dụng từ "Sai" hoặc phê bình nặng nề. Mọi câu trả lời chưa chính xác đều được AI phản hồi bằng gợi ý thông minh hoặc câu nói khích lệ: *"Con gần đúng rồi, con thử lại nhé!"*.
* **An toàn tâm lý**: Mascot được lập trình nghiêm cấm đề cập đến các từ liên quan đến tự kỷ, khuyết tật, trị liệu tâm lý hoặc so sánh trẻ với các bạn khác nhằm tạo ra một môi trường luyện tập hoàn toàn an toàn về mặt cảm xúc.

---

## 11. Giới hạn hiện tại
* **Phụ thuộc cấu hình TTS của thiết bị**: Chất lượng giọng đọc Tiếng Việt của Mascot phụ thuộc trực tiếp vào bộ tổng hợp giọng nói (Google TTS / Apple Speech) cài đặt trên máy của người dùng. Nếu máy chưa tải gói dữ liệu Tiếng Việt chất lượng cao, giọng Mascot có thể hơi máy móc.
* **Không hỗ trợ nói tự do**: Bé bắt buộc phải trả lời theo nội dung định hướng của câu hỏi hiện tại, hệ thống chưa hỗ trợ chat tự do ngoài phạm vi bài học.

---

## 12. Hướng phát triển Gemini Live trong tương lai
Hiện tại hệ thống sử dụng kết hợp STT/TTS thiết bị nhằm mang lại sự ổn định và tối ưu chi phí vận hành ở giai đoạn demo. Tuy nhiên, kiến trúc đã được thiết kế sẵn sàng để tích hợp **Gemini Live Multimodal API** (Truyền tải âm thanh trực tiếp qua WebSocket) trong tương lai với lộ trình:
* **Giai đoạn 1 (Hiện tại)**: Dùng Device STT + Device TTS + Backend chấm điểm bằng Rule. Mọi token sinh ra qua `/live-token` đều ghi rõ `mode = "MOCK"` và `isRealGeminiLive = false`.
* **Giai đoạn 2**: Nối thật cổng sinh ephemeral token ngắn hạn từ Vertex AI / Google GenAI Control Plane trên Backend để chuyển về máy khách.
* **Giai đoạn 3**: Triển khai kết nối WebSocket (`GeminiLiveConversationService` trên Flutter) truyền và nhận luồng âm thanh trực tiếp (Audio Stream) thời gian thực, cho phép bé trò chuyện với Mascot có tông giọng tự nhiên, tốc độ phản hồi nhanh như người thật mà không cần bấm micro thủ công nữa.
