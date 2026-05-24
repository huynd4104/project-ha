import type { Lesson, LessonType } from "../types";

export const LESSON_TYPES = ["MATH", "DIALOGUE", "FLASHCARD", "THINKING", "SPELLING", "RHYME"] as const;
export const QUIZ_LESSON_TYPES = ["MATH", "THINKING", "SPELLING", "RHYME"] as const;

type LessonMeta = {
  label: string;
  shortLabel: string;
  icon: "math" | "dialogue" | "flashcard";
  color: "yellow" | "blue" | "purple" | "green" | "pink";
  description: string;
};

const META: Record<LessonType, LessonMeta> = {
  MATH: { label: "Toán học", shortLabel: "Toán vui", icon: "math", color: "yellow", description: "Câu hỏi đếm, tính, so sánh" },
  DIALOGUE: { label: "Hội thoại", shortLabel: "Hội thoại", icon: "dialogue", color: "blue", description: "Tình huống nghe và phản hồi" },
  FLASHCARD: { label: "Thẻ học", shortLabel: "Thẻ học", icon: "flashcard", color: "purple", description: "Ôn từ, hình và phát âm" },
  THINKING: { label: "Tư duy", shortLabel: "Tư duy", icon: "math", color: "green", description: "Suy luận, chọn đáp án hợp lý" },
  SPELLING: { label: "Đánh vần", shortLabel: "Đánh vần", icon: "dialogue", color: "pink", description: "Nhận diện chữ, ghép âm đầu/cuối" },
  RHYME: { label: "Ghép vần", shortLabel: "Ghép vần", icon: "flashcard", color: "yellow", description: "Nhận diện âm vần và ghép tiếng" }
};

export function getLessonMeta(type?: string | null): LessonMeta {
  return META[(type as LessonType) || "MATH"] || META.MATH;
}

export function getLessonLabel(type?: string | null) {
  return getLessonMeta(type).label;
}

export function getLessonActivityType(progress?: { activityType?: string; lessonId?: string }) {
  if (progress?.activityType) return progress.activityType;
  if (progress?.lessonId?.endsWith("_flashcard")) return "FLASHCARD";
  return "LESSON";
}

export function isFlashcardProgress(progress?: { activityType?: string; lessonId?: string }) {
  return getLessonActivityType(progress) === "FLASHCARD";
}

export function isQuizLessonType(type?: string | null) {
  return !!type && (QUIZ_LESSON_TYPES as readonly string[]).includes(type);
}

export function resolveLessonAction(lesson: Lesson) {
  const meta = getLessonMeta(lesson.type);
  return { meta, isQuiz: isQuizLessonType(lesson.type) };
}
