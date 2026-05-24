import {
  normalizeBoolean,
  normalizeNumber,
  normalizeOptionalString,
  normalizeString,
  validateEnum,
  validateRequired,
  validateUrl
} from "../../utils/csv";
import type { ValidationResult } from "./types";
import { QUIZ_LESSON_TYPES } from "../../utils/lessonTypes";

const mediaTypes = ["IMAGE", "AUDIO", "VIDEO"] as const;
const mediaCategories = ["NPC", "FLASHCARD", "DIALOGUE", "BADGE", "GENERAL"] as const;
const answerOptions = ["A", "B", "C", "D"] as const;
const badgeTypes = ["LESSON", "STREAK", "XP", "NPC", "MISSION"] as const;
const badgeConditionTypes = ["COMPLETE_LESSONS", "STREAK_DAYS", "TOTAL_XP", "UNLOCK_NPCS", "COMPLETE_DAILY_MISSIONS"] as const;
const missionTypes = ["COMPLETE_LESSON", "REVIEW_FLASHCARD", "SCAN_QR", "COMPLETE_DIALOGUE", "COMPLETE_MATH"] as const;

type NamedRecord = { id: string; name?: string; title?: string; type?: string; code?: string };

export type ImportConfig = {
  title: string;
  templateFilename: string;
  templateHeaders: string[];
  templateExampleRows: Record<string, string>[];
  warnings?: string[];
  validateRow: (row: Record<string, string>, index: number) => ValidationResult;
};

function ok(normalizedRow: any, errors: string[]): ValidationResult {
  return { isValid: errors.length === 0, errors, normalizedRow };
}

function duplicateSet(items: NamedRecord[], field: "name" | "title" | "code") {
  return new Set(items.map((item) => normalizeString(item[field]).toLowerCase()).filter(Boolean));
}

function makeNameMap(items: NamedRecord[], field: "name" | "title", label: string) {
  const map = new Map<string, NamedRecord>();
  const warnings: string[] = [];
  items.forEach((item) => {
    const key = normalizeString(item[field]).toLowerCase();
    if (!key) return;
    if (map.has(key)) {
      const warning = `${label} bị trùng tên "${item[field]}"; import sẽ dùng record đầu tiên.`;
      console.warn(warning);
      warnings.push(warning);
      return;
    }
    map.set(key, item);
  });
  return { map, warnings };
}

function boolField(value: unknown, field: string, defaultValue = true, errors: string[]) {
  const normalized = normalizeBoolean(value, defaultValue);
  if (normalized === null) errors.push(`${field} phải là true/false, yes/no hoặc 1/0.`);
  return normalized ?? defaultValue;
}

function optionalNumberField(value: unknown, field: string, errors: string[]) {
  const raw = normalizeString(value);
  const normalized = normalizeNumber(raw);
  if (raw && normalized === null) errors.push(`${field} phải là số.`);
  return normalized;
}

function requiredNumberField(value: unknown, field: string, errors: string[]) {
  const normalized = normalizeNumber(value);
  if (normalized === null) errors.push(`${field} bắt buộc và phải là số.`);
  return normalized ?? 0;
}

export function mediaAssetsImportConfig(): ImportConfig {
  return {
    title: "Import CSV Media Assets",
    templateFilename: "media-assets-template.csv",
    templateHeaders: ["name", "type", "category", "url", "thumbnailUrl"],
    templateExampleRows: [
      {
        name: "Mèo Mimi Image",
        type: "IMAGE",
        category: "NPC",
        url: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f431.svg",
        thumbnailUrl: ""
      }
    ],
    validateRow(row) {
      const errors: string[] = [];
      const type = normalizeString(row.type);
      const category = normalizeString(row.category);
      if (!validateRequired(row.name)) errors.push("name bắt buộc.");
      if (!validateEnum(type, mediaTypes)) errors.push(`type phải là một trong: ${mediaTypes.join(", ")}.`);
      if (!validateEnum(category, mediaCategories)) errors.push(`category phải là một trong: ${mediaCategories.join(", ")}.`);
      if (!validateRequired(row.url)) errors.push("url bắt buộc.");
      if (row.url && !validateUrl(row.url)) errors.push("url phải là URL http(s) hoặc đường dẫn bắt đầu bằng /.");
      if (row.thumbnailUrl && !validateUrl(row.thumbnailUrl)) errors.push("thumbnailUrl phải là URL http(s) hoặc đường dẫn bắt đầu bằng /.");
      return ok({
        name: normalizeString(row.name),
        type,
        category,
        url: normalizeString(row.url),
        thumbnailUrl: normalizeOptionalString(row.thumbnailUrl)
      }, errors);
    }
  };
}

export function npcsImportConfig(existingNpcs: NamedRecord[]): ImportConfig {
  const existingNames = duplicateSet(existingNpcs, "name");
  return {
    title: "Import CSV nhân vật đồng hành",
    templateFilename: "npcs-template.csv",
    templateHeaders: ["name", "description", "imageUrl", "animationUrl", "defaultDialogue", "isActive"],
    templateExampleRows: [
      {
        name: "Mèo Mimi",
        description: "Bạn mèo thân thiện",
        imageUrl: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f431.svg",
        animationUrl: "",
        defaultDialogue: "Xin chào bé!",
        isActive: "true"
      }
    ],
    validateRow(row) {
      const errors: string[] = [];
      const name = normalizeString(row.name);
      if (!name) errors.push("name bắt buộc.");
      if (name && existingNames.has(name.toLowerCase())) errors.push("Nhân vật đã tồn tại.");
      if (!validateRequired(row.description)) errors.push("description bắt buộc.");
      if (row.imageUrl && !validateUrl(row.imageUrl)) errors.push("imageUrl phải là URL http(s) hoặc đường dẫn bắt đầu bằng /.");
      if (row.animationUrl && !validateUrl(row.animationUrl)) errors.push("animationUrl phải là URL http(s) hoặc đường dẫn bắt đầu bằng /.");
      return ok({
        name,
        description: normalizeString(row.description),
        imageUrl: normalizeOptionalString(row.imageUrl),
        animationUrl: normalizeOptionalString(row.animationUrl),
        defaultDialogue: normalizeOptionalString(row.defaultDialogue),
        isActive: boolField(row.isActive, "isActive", true, errors)
      }, errors);
    }
  };
}

export function qrCodesImportConfig(npcs: NamedRecord[], existingCodes: NamedRecord[]): ImportConfig {
  const { map: npcMap, warnings } = makeNameMap(npcs, "name", "nhân vật");
  const codes = duplicateSet(existingCodes, "code");
  return {
    title: "Import CSV QR Codes",
    templateFilename: "qr-codes-template.csv",
    templateHeaders: ["label", "code", "npcName", "isActive", "maxUses"],
    templateExampleRows: [{ label: "QR Mimi 01", code: "MIMI-001", npcName: "Mèo Mimi", isActive: "true", maxUses: "1" }],
    warnings,
    validateRow(row) {
      const errors: string[] = [];
      const code = normalizeString(row.code);
      const npcName = normalizeString(row.npcName);
      const npc = npcMap.get(npcName.toLowerCase());
      if (!validateRequired(row.label)) errors.push("label bắt buộc.");
      if (!code) errors.push("code bắt buộc.");
      if (code && codes.has(code.toLowerCase())) errors.push("QR code đã tồn tại.");
      if (!npcName) errors.push("npcName bắt buộc.");
      if (npcName && !npc) errors.push(`Không tìm thấy nhân vật: ${npcName}`);
      return ok({
        label: normalizeString(row.label),
        code,
        npcId: npc?.id ?? "",
        isActive: boolField(row.isActive, "isActive", true, errors),
        maxUses: optionalNumberField(row.maxUses, "maxUses", errors),
        usedCount: 0
      }, errors);
    }
  };
}

export function lessonsImportConfig(npcs: NamedRecord[], existingLessons: NamedRecord[]): ImportConfig {
  const { map: npcMap, warnings } = makeNameMap(npcs, "name", "nhân vật");
  const titles = duplicateSet(existingLessons, "title");
  return {
    title: "Import CSV Lessons",
    templateFilename: "lessons-template.csv",
    templateHeaders: ["title", "description", "type", "relatedNpc", "orderIndex", "isActive"],
    templateExampleRows: [{ title: "Bài toán đầu tiên", description: "Làm quen số đếm", type: "MATH", relatedNpc: "Mèo Mimi", orderIndex: "10", isActive: "true" }],
    warnings,
    validateRow(row) {
      const errors: string[] = [];
      const title = normalizeString(row.title);
      const type = normalizeString(row.type);
      const relatedNpc = normalizeString(row.relatedNpc);
      const npc = relatedNpc ? npcMap.get(relatedNpc.toLowerCase()) : null;
      if (!title) errors.push("title bắt buộc.");
      if (title && titles.has(title.toLowerCase())) errors.push("Lesson đã tồn tại.");
      if (!validateRequired(row.description)) errors.push("description bắt buộc.");
      if (!validateEnum(type, ["MATH", "DIALOGUE", "FLASHCARD", "THINKING", "SPELLING", "RHYME"])) errors.push(`type phải là một trong: MATH, DIALOGUE, FLASHCARD, THINKING, SPELLING, RHYME.`);
      if (relatedNpc && !npc) errors.push(`Không tìm thấy nhân vật: ${relatedNpc}`);
      return ok({
        title,
        description: normalizeString(row.description),
        type,
        npcId: npc?.id ?? null,
        orderIndex: requiredNumberField(row.orderIndex, "orderIndex", errors),
        isActive: boolField(row.isActive, "isActive", true, errors)
      }, errors);
    }
  };
}

export function mathQuestionsImportConfig(lessons: NamedRecord[]): ImportConfig {
  const { map: lessonMap, warnings } = makeNameMap(lessons, "title", "Lesson");
  return questionConfig("Import CSV Câu hỏi học tập", "math-questions-template.csv", QUIZ_LESSON_TYPES, lessonMap, warnings);
}

export function dialoguesImportConfig(lessons: NamedRecord[]): ImportConfig {
  const { map: lessonMap, warnings } = makeNameMap(lessons, "title", "Lesson");
  return {
    title: "Import CSV Dialogues",
    templateFilename: "dialogues-template.csv",
    templateHeaders: ["lessonTitle", "title", "sceneText", "audioUrl", "questionText", "optionA", "optionB", "optionC", "optionD", "correctOption", "orderIndex"],
    templateExampleRows: [{ lessonTitle: "Chào hỏi", title: "Gặp bạn mới", sceneText: "Mimi gặp một người bạn mới.", audioUrl: "", questionText: "Mimi nên nói gì?", optionA: "Xin chào", optionB: "Tạm biệt", optionC: "Không nói gì", optionD: "Khóc", correctOption: "A", orderIndex: "10" }],
    warnings,
    validateRow(row) {
      const errors: string[] = [];
      const lessonTitle = normalizeString(row.lessonTitle);
      const lesson = lessonMap.get(lessonTitle.toLowerCase());
      if (!lessonTitle) errors.push("lessonTitle bắt buộc.");
      if (lessonTitle && !lesson) errors.push(`Không tìm thấy lesson: ${lessonTitle}`);
      if (lesson && lesson.type !== "DIALOGUE") errors.push("Lesson sai type, cần DIALOGUE.");
      if (!validateRequired(row.title)) errors.push("title bắt buộc.");
      if (!validateRequired(row.sceneText)) errors.push("sceneText bắt buộc.");
      if (row.audioUrl && !validateUrl(row.audioUrl)) errors.push("audioUrl phải là URL http(s) hoặc đường dẫn bắt đầu bằng /.");
      addQuestionErrors(row, errors);
      return ok({
        lessonId: lesson?.id ?? "",
        title: normalizeString(row.title),
        sceneText: normalizeString(row.sceneText),
        audioUrl: normalizeOptionalString(row.audioUrl),
        ...normalizedQuestion(row),
        orderIndex: requiredNumberField(row.orderIndex, "orderIndex", errors)
      }, errors);
    }
  };
}

export function flashcardsImportConfig(lessons: NamedRecord[]): ImportConfig {
  const { map: lessonMap, warnings } = makeNameMap(lessons, "title", "Lesson");
  return {
    title: "Import CSV Flashcards",
    templateFilename: "flashcards-template.csv",
    templateHeaders: ["lessonTitle", "frontText", "backText", "imageUrl", "audioUrl", "orderIndex"],
    templateExampleRows: [{ lessonTitle: "Từ vựng trái cây", frontText: "Apple", backText: "Quả táo", imageUrl: "", audioUrl: "", orderIndex: "10" }],
    warnings,
    validateRow(row) {
      const errors: string[] = [];
      const lessonTitle = normalizeString(row.lessonTitle);
      const lesson = lessonMap.get(lessonTitle.toLowerCase());
      if (!lessonTitle) errors.push("lessonTitle bắt buộc.");
      if (lessonTitle && !lesson) errors.push(`Không tìm thấy lesson: ${lessonTitle}`);
      if (!validateRequired(row.frontText)) errors.push("frontText bắt buộc.");
      if (!validateRequired(row.backText)) errors.push("backText bắt buộc.");
      if (row.imageUrl && !validateUrl(row.imageUrl)) errors.push("imageUrl phải là URL http(s) hoặc đường dẫn bắt đầu bằng /.");
      if (row.audioUrl && !validateUrl(row.audioUrl)) errors.push("audioUrl phải là URL http(s) hoặc đường dẫn bắt đầu bằng /.");
      return ok({
        lessonId: lesson?.id ?? "",
        frontText: normalizeString(row.frontText),
        backText: normalizeString(row.backText),
        imageUrl: normalizeOptionalString(row.imageUrl),
        audioUrl: normalizeOptionalString(row.audioUrl),
        orderIndex: requiredNumberField(row.orderIndex, "orderIndex", errors)
      }, errors);
    }
  };
}

export function badgesImportConfig(existingBadges: NamedRecord[]): ImportConfig {
  const names = duplicateSet(existingBadges, "name");
  return {
    title: "Import CSV Badges",
    templateFilename: "badges-template.csv",
    templateHeaders: ["name", "description", "iconUrl", "type", "conditionType", "conditionValue", "isActive"],
    templateExampleRows: [{ name: "Bài học đầu tiên", description: "Hoàn thành bài học đầu tiên", iconUrl: "", type: "LESSON", conditionType: "COMPLETE_LESSONS", conditionValue: "1", isActive: "true" }],
    validateRow(row) {
      const errors: string[] = [];
      const name = normalizeString(row.name);
      const type = normalizeString(row.type);
      const conditionType = normalizeString(row.conditionType);
      if (!name) errors.push("name bắt buộc.");
      if (name && names.has(name.toLowerCase())) errors.push("Badge đã tồn tại.");
      if (!validateRequired(row.description)) errors.push("description bắt buộc.");
      if (row.iconUrl && !validateUrl(row.iconUrl)) errors.push("iconUrl phải là URL http(s) hoặc đường dẫn bắt đầu bằng /.");
      if (!validateEnum(type, badgeTypes)) errors.push(`type phải là một trong: ${badgeTypes.join(", ")}.`);
      if (!validateEnum(conditionType, badgeConditionTypes)) errors.push(`conditionType phải là một trong: ${badgeConditionTypes.join(", ")}.`);
      return ok({
        name,
        description: normalizeString(row.description),
        iconUrl: normalizeOptionalString(row.iconUrl),
        type,
        conditionType,
        conditionValue: requiredNumberField(row.conditionValue, "conditionValue", errors),
        isActive: boolField(row.isActive, "isActive", true, errors)
      }, errors);
    }
  };
}

export function dailyMissionsImportConfig(existingMissions: NamedRecord[]): ImportConfig {
  const titles = duplicateSet(existingMissions, "title");
  return {
    title: "Import CSV Daily Missions",
    templateFilename: "daily-missions-template.csv",
    templateHeaders: ["title", "description", "type", "targetValue", "rewardXp", "isActive"],
    templateExampleRows: [{ title: "Hoàn thành 1 bài học", description: "Bé hoàn thành một bài học bất kỳ", type: "COMPLETE_LESSON", targetValue: "1", rewardXp: "20", isActive: "true" }],
    validateRow(row) {
      const errors: string[] = [];
      const title = normalizeString(row.title);
      const type = normalizeString(row.type);
      if (!title) errors.push("title bắt buộc.");
      if (title && titles.has(title.toLowerCase())) errors.push("Daily Mission đã tồn tại.");
      if (!validateRequired(row.description)) errors.push("description bắt buộc.");
      if (!validateEnum(type, missionTypes)) errors.push(`type phải là một trong: ${missionTypes.join(", ")}.`);
      return ok({
        title,
        description: normalizeString(row.description),
        type,
        targetValue: requiredNumberField(row.targetValue, "targetValue", errors),
        rewardXp: requiredNumberField(row.rewardXp, "rewardXp", errors),
        isActive: boolField(row.isActive, "isActive", true, errors)
      }, errors);
    }
  };
}

function questionConfig(title: string, filename: string, expectedTypes: readonly string[], lessonMap: Map<string, NamedRecord>, warnings: string[]): ImportConfig {
  return {
    title,
    templateFilename: filename,
    templateHeaders: ["lessonTitle", "questionText", "imageUrl", "optionA", "optionB", "optionC", "optionD", "correctOption", "explanation", "orderIndex"],
    templateExampleRows: [{ lessonTitle: "Bài toán đầu tiên", questionText: "1 + 1 bằng mấy?", imageUrl: "", optionA: "1", optionB: "2", optionC: "3", optionD: "4", correctOption: "B", explanation: "1 + 1 = 2", orderIndex: "10" }],
    warnings,
    validateRow(row) {
      const errors: string[] = [];
      const lessonTitle = normalizeString(row.lessonTitle);
      const lesson = lessonMap.get(lessonTitle.toLowerCase());
      if (!lessonTitle) errors.push("lessonTitle bắt buộc.");
      if (lessonTitle && !lesson) errors.push(`Không tìm thấy lesson: ${lessonTitle}`);
      if (lesson && (!lesson.type || !expectedTypes.includes(lesson.type))) errors.push(`Lesson sai type, cần một trong: ${expectedTypes.join(", ")}.`);
      if (row.imageUrl && !validateUrl(row.imageUrl)) errors.push("imageUrl phải là URL http(s) hoặc đường dẫn bắt đầu bằng /.");
      addQuestionErrors(row, errors);
      return ok({
        lessonId: lesson?.id ?? "",
        imageUrl: normalizeOptionalString(row.imageUrl),
        ...normalizedQuestion(row),
        explanation: normalizeOptionalString(row.explanation),
        orderIndex: requiredNumberField(row.orderIndex, "orderIndex", errors)
      }, errors);
    }
  };
}

function addQuestionErrors(row: Record<string, string>, errors: string[]) {
  if (!validateRequired(row.questionText)) errors.push("questionText bắt buộc.");
  if (!validateRequired(row.optionA)) errors.push("optionA bắt buộc.");
  if (!validateRequired(row.optionB)) errors.push("optionB bắt buộc.");
  if (!validateRequired(row.optionC)) errors.push("optionC bắt buộc.");
  if (!validateRequired(row.optionD)) errors.push("optionD bắt buộc.");
  if (!validateEnum(row.correctOption, answerOptions)) errors.push(`correctOption phải là một trong: ${answerOptions.join(", ")}.`);
}

function normalizedQuestion(row: Record<string, string>) {
  return {
    questionText: normalizeString(row.questionText),
    optionA: normalizeString(row.optionA),
    optionB: normalizeString(row.optionB),
    optionC: normalizeString(row.optionC),
    optionD: normalizeString(row.optionD),
    correctOption: normalizeString(row.correctOption)
  };
}

export function developmentCategoriesImportConfig(existingItems: NamedRecord[]): ImportConfig {
  const keys = duplicateSet(existingItems, "key" as any);
  return {
    title: "Import CSV Nhóm khó khăn",
    templateFilename: "dev-categories-template.csv",
    templateHeaders: ["key", "label", "description", "isActive", "orderIndex"],
    templateExampleRows: [{ key: "language_delay", label: "Chậm nói", description: "Trẻ chậm phát triển ngôn ngữ", isActive: "true", orderIndex: "1" }],
    validateRow(row) {
      const errors: string[] = [];
      const key = normalizeString(row.key);
      if (!key) errors.push("key bắt buộc.");
      if (key && keys.has(key.toLowerCase())) errors.push("Key đã tồn tại.");
      return ok({
        key,
        label: normalizeString(row.label),
        description: normalizeString(row.description),
        isActive: boolField(row.isActive, "isActive", true, errors),
        orderIndex: requiredNumberField(row.orderIndex, "orderIndex", errors)
      }, errors);
    }
  };
}

export function learningGoalsImportConfig(existingItems: NamedRecord[]): ImportConfig {
  const keys = duplicateSet(existingItems, "key" as any);
  return {
    title: "Import CSV Mục tiêu học tập",
    templateFilename: "learning-goals-template.csv",
    templateHeaders: ["key", "label", "description", "skillTags", "isActive", "orderIndex"],
    templateExampleRows: [{ key: "expressive_lang", label: "Ngôn ngữ diễn đạt", description: "Cải thiện diễn đạt", skillTags: "naming,requesting", isActive: "true", orderIndex: "1" }],
    validateRow(row) {
      const errors: string[] = [];
      const key = normalizeString(row.key);
      if (!key) errors.push("key bắt buộc.");
      if (key && keys.has(key.toLowerCase())) errors.push("Key đã tồn tại.");
      return ok({
        key,
        label: normalizeString(row.label),
        description: normalizeString(row.description),
        skillTags: normalizeString(row.skillTags).split(",").filter(Boolean),
        isActive: boolField(row.isActive, "isActive", true, errors),
        orderIndex: requiredNumberField(row.orderIndex, "orderIndex", errors)
      }, errors);
    }
  };
}

export function skillsImportConfig(existingItems: NamedRecord[]): ImportConfig {
  const keys = duplicateSet(existingItems, "key" as any);
  return {
    title: "Import CSV Kỹ năng",
    templateFilename: "skills-template.csv",
    templateHeaders: ["key", "label", "domain", "parentDescription", "isActive", "orderIndex"],
    templateExampleRows: [{ key: "naming_objects", label: "Gọi tên đồ vật", domain: "LANGUAGE", parentDescription: "Trẻ có thể gọi tên", isActive: "true", orderIndex: "1" }],
    validateRow(row) {
      const errors: string[] = [];
      const key = normalizeString(row.key);
      if (!key) errors.push("key bắt buộc.");
      if (key && keys.has(key.toLowerCase())) errors.push("Key đã tồn tại.");
      return ok({
        key,
        label: normalizeString(row.label),
        domain: normalizeString(row.domain),
        parentDescription: normalizeString(row.parentDescription),
        isActive: boolField(row.isActive, "isActive", true, errors),
        orderIndex: requiredNumberField(row.orderIndex, "orderIndex", errors)
      }, errors);
    }
  };
}

// Keeping it simple for other complex types due to relational needs.
// For real deployment, we'd add complete configs for programs, learningPaths, activities, etc.
