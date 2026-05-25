export type LessonModuleKey = "MATH" | "THINKING" | "SPELLING" | "RHYME";

export const LESSON_MODULES: Record<LessonModuleKey, { path: string; title: string; prefix: string; hint: string }> = {
  MATH: {
    path: "/math-questions",
    title: "Toán",
    prefix: "Toán học",
    hint: "Câu hỏi đếm, tính và so sánh"
  },
  THINKING: {
    path: "/thinking-questions",
    title: "Tư duy",
    prefix: "Tư duy",
    hint: "Câu hỏi suy luận, chọn đáp án hợp lý"
  },
  SPELLING: {
    path: "/spelling-questions",
    title: "Đánh vần",
    prefix: "Đánh vần",
    hint: "Câu hỏi nhận diện chữ, ghép âm"
  },
  RHYME: {
    path: "/rhyme-questions",
    title: "Ghép vần",
    prefix: "Ghép vần",
    hint: "Câu hỏi nhận diện vần và ghép tiếng"
  }
};

export function getLessonModuleByPath(pathname: string): LessonModuleKey {
  if (pathname.includes("thinking-questions")) return "THINKING";
  if (pathname.includes("spelling-questions")) return "SPELLING";
  if (pathname.includes("rhyme-questions")) return "RHYME";
  return "MATH";
}
