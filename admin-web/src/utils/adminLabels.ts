export const STATUS_LABELS: Record<string, string> = {
  FREE: "Miễn phí",
  PREMIUM: "Premium",
  DRAFT: "Bản nháp",
  PUBLISHED: "Đã xuất bản",
  ARCHIVED: "Đã lưu trữ",
  ACTIVE: "Đang bật",
  INACTIVE: "Đang tắt",
  TRIAL: "Dùng thử",
  EXPIRED: "Hết hạn",
  CANCELED: "Đã hủy",
  MANUAL: "Thủ công",
  MOCK: "Giả lập",
  BEGINNER: "Mới bắt đầu",
  BASIC: "Cơ bản",
  INTERMEDIATE: "Trung bình",
  LOW: "Ít hỗ trợ",
  MEDIUM: "Hỗ trợ vừa",
  HIGH: "Cần hỗ trợ nhiều",
};

export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: "Chọn đáp án",
  LISTEN_AND_CHOOSE_IMAGE: "Nghe và chọn hình",
  LOOK_AND_CHOOSE_WORD: "Nhìn hình chọn từ",
  HEAR_AND_REPEAT: "Nghe và lặp lại",
  VOICE_ANSWER: "Trả lời bằng giọng nói",
  MATCH_OBJECTS: "Ghép cặp",
  EMOTION_RECOGNITION: "Nhận biết cảm xúc",
  DAILY_LIFE_SCENARIO: "Tình huống hằng ngày",
  FLASHCARD_REVIEW: "Ôn bằng thẻ học",
  PARENT_MARK_RESULT: "Phụ huynh đánh dấu kết quả",
};

export const UNLOCK_RULE_LABELS: Record<string, string> = {
  ALWAYS_OPEN: "Luôn mở",
  PREVIOUS_COMPLETED: "Hoàn thành bài trước",
  PREMIUM_ONLY: "Chỉ dành cho Premium",
};

export const ACTIVATION_TYPE_LABELS: Record<string, string> = {
  NPC: "Mascot",
  LESSON: "Bài học",
  PATH: "Lộ trình",
  REWARD: "Phần thưởng",
  PHYSICAL_TOY: "Đồ chơi/thẻ vật lý",
};

export const LESSON_TYPE_LABELS: Record<string, string> = {
  MATH: "Toán",
  FLASHCARD: "Thẻ học",
  THINKING: "Tư duy",
  SPELLING: "Đánh vần",
  RHYME: "Ghép vần",
  LISTEN_AND_CHOOSE: "Nghe và chọn",
  VOICE_QUIZ: "Câu hỏi giọng nói",
  EMOTION: "Cảm xúc",
  DAILY_LIFE: "Tình huống hằng ngày",
  PARENT_ACTIVITY: "Phụ huynh hỗ trợ",
  MIXED: "Tổng hợp",
};

export function uiLabel(value?: string | null) {
  if (!value) return "—";
  return STATUS_LABELS[value] || ACTIVITY_TYPE_LABELS[value] || UNLOCK_RULE_LABELS[value] || ACTIVATION_TYPE_LABELS[value] || LESSON_TYPE_LABELS[value] || value;
}
