import type { Lesson } from "../types/firebaseModels";

export const LESSON_TYPES = ["MATH", "FLASHCARD", "THINKING", "SPELLING", "RHYME"] as const;
export const QUIZ_LESSON_TYPES = ["MATH", "THINKING", "SPELLING", "RHYME"] as const;

export type LessonType = Lesson["type"];

const lessonTypeLabels: Record<LessonType, string> = {
  MATH: "Toán học",
  FLASHCARD: "Thẻ học",
  THINKING: "Tư duy",
  SPELLING: "Đánh vần",
  RHYME: "Ghép vần"
};

const lessonTypeHelp: Record<LessonType, string> = {
  MATH: "Câu hỏi đếm, tính, so sánh",
  FLASHCARD: "Ôn từ, hình và phát âm",
  THINKING: "Suy luận, chọn đáp án hợp lý",
  SPELLING: "Nhận diện chữ, ghép âm đầu/cuối",
  RHYME: "Nhận diện âm vần và ghép tiếng"
};

export function isQuizLessonType(type?: string | null) {
  return !!type && (QUIZ_LESSON_TYPES as readonly string[]).includes(type);
}

export function getLessonTypeLabel(type?: string | null) {
  return lessonTypeLabels[(type as LessonType) || "MATH"] || "Bài học";
}

export function getLessonTypeHelp(type?: string | null) {
  return lessonTypeHelp[(type as LessonType) || "MATH"] || "Bài học tương tác";
}
