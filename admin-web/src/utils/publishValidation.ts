import type { Activity, Lesson, LearningPath, Program } from "../types/firebaseModels";

type ValidationResult = { valid: boolean; errors: string[] };

export function validateProgramPublish(program: Partial<Program>): ValidationResult {
  const errors: string[] = [];
  if (!program.title?.trim()) errors.push("Tiêu đề chương trình không được để trống.");
  if (!program.description?.trim()) errors.push("Mô tả chương trình không được để trống.");
  if (!program.learningGoals?.length) errors.push("Cần ít nhất một mục tiêu học tập.");
  if (!program.skillTags?.length) errors.push("Cần ít nhất một kỹ năng.");
  const min = program.targetAgeMin ?? 0;
  const max = program.targetAgeMax ?? 0;
  if (min > max) errors.push("Tuổi tối thiểu phải nhỏ hơn hoặc bằng tuổi tối đa.");
  return { valid: errors.length === 0, errors };
}

export function validatePathPublish(
  path: Partial<LearningPath>,
  pathItemCount: number
): ValidationResult {
  const errors: string[] = [];
  if (!path.programId?.trim()) errors.push("Cần chọn chương trình.");
  if (!path.title?.trim()) errors.push("Tiêu đề lộ trình không được để trống.");
  if (pathItemCount < 1) errors.push("Lộ trình cần ít nhất một bài học.");
  return { valid: errors.length === 0, errors };
}

export function validateLessonPublish(
  lesson: Partial<Lesson>,
  activityCount: number,
  hasLibraryContent: boolean
): ValidationResult {
  const errors: string[] = [];
  if (!lesson.title?.trim()) errors.push("Tiêu đề bài học không được để trống.");
  if (!lesson.description?.trim()) errors.push("Mô tả bài học không được để trống.");
  if (!lesson.lessonType && !lesson.type) errors.push("Loại bài học không được để trống.");
  if (!lesson.estimatedMinutes || lesson.estimatedMinutes <= 0)
    errors.push("Thời gian ước tính phải lớn hơn 0.");
  if (!lesson.learningGoals?.length) errors.push("Cần ít nhất một mục tiêu học tập.");
  if (!lesson.skillTags?.length) errors.push("Cần ít nhất một kỹ năng.");
  if (activityCount < 1 && !hasLibraryContent)
    errors.push("Bài học cần ít nhất một hoạt động hoặc nội dung từ thư viện.");
  return { valid: errors.length === 0, errors };
}

export function validateActivityRequired(activity: Partial<Activity>): string[] {
  const errors: string[] = [];
  if (!activity.activityType) errors.push("Loại hoạt động không được để trống.");
  if (!activity.lessonId) errors.push("Bài học không được để trống.");

  const type = activity.activityType;
  const options = activity.options || [];

  if (
    type === "MULTIPLE_CHOICE" ||
    type === "LISTEN_AND_CHOOSE_IMAGE" ||
    type === "LOOK_AND_CHOOSE_WORD" ||
    type === "EMOTION_RECOGNITION" ||
    type === "DAILY_LIFE_SCENARIO"
  ) {
    if (!activity.prompt?.trim()) errors.push("Câu hỏi/đề bài không được để trống.");
    if (options.length < 2) errors.push("Cần ít nhất 2 lựa chọn.");
    if (options.length > 4) errors.push("Tối đa 4 lựa chọn.");
    if (!options.some((o) => o.isCorrect)) errors.push("Cần ít nhất một đáp án đúng.");
  }

  if (type === "VOICE_ANSWER") {
    if (!activity.prompt?.trim()) errors.push("Câu hỏi không được để trống.");
    if (!activity.acceptedAnswers?.length) errors.push("Cần ít nhất một đáp án chấp nhận.");
    if (!activity.feedback?.correct) errors.push("Phản hồi đúng không được để trống.");
    if (activity.retryLimit === undefined || activity.retryLimit === null || activity.retryLimit < 0) {
      errors.push("Số lần thử lại không hợp lệ (phải >= 0).");
    }
  }

  if (type === "PARENT_MARK_RESULT") {
    if (!activity.parentInstruction?.trim())
      errors.push("Hướng dẫn phụ huynh không được để trống.");
  }

  return errors;
}
