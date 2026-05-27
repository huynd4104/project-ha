import { useEffect, useState } from "react";
import { adminApi } from "../../api/adminApi";
import { TableControls } from "../../components/TableControls";
import { ToggleSwitch } from "../../components/ToggleSwitch";
import { useTableControls } from "../../utils/tableControls";

type BusinessType = "ANSWER" | "FLASHCARD" | "NUMBER" | "SHAPE" | "PECS" | "GENERIC";
type QuestionLibrary = "MATH" | "THINKING" | "SPELLING" | "RHYME";
type NumberSubtype = "CARD" | "EXAMPLE";
type ShapeSubtype = "CARD" | "EXAMPLE";
type PecsCategory = "EMOTION" | "DAILY_ACTIVITY" | "NON_TOPIC";
type TabName = "LIST" | "GUIDED";

interface NfcTagRecord {
  id: string;
  tagUid: string;
  displayName: string;
  tagType: BusinessType;
  targetType: string;
  targetId?: string | null;
  payloadValue?: string | null;
  spokenText?: string | null;
  description?: string | null;
  isActive: boolean;
}

interface LessonSource {
  id: string;
  type: string;
  title: string;
}

interface MathQuestionSource {
  id: string;
  lessonId?: string;
  category?: string;
  questionText: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctOption?: string;
  explanation?: string;
  imageUrl?: string;
}

interface FlashcardSource {
  id: string;
  lessonId?: string;
  frontText: string;
  backText: string;
  imageUrl?: string;
  audioUrl?: string;
}

interface NumberItemSource {
  id: string;
  numberValue: number;
  title: string;
  imageUrl?: string;
}

interface NumberExampleSource {
  id: string;
  numberItemId: string;
  exampleText: string;
  imageUrl?: string;
}

interface ShapeItemSource {
  id: string;
  shapeName: string;
  imageUrl?: string;
}

interface ShapeExampleSource {
  id: string;
  shapeItemId: string;
  exampleText: string;
  imageUrl?: string;
}

interface PecsCardSource {
  id: string;
  category: PecsCategory;
  title: string;
  spokenText: string;
  imageUrl?: string;
  isActive: boolean;
}

interface GuidedDraft {
  tagUid: string;
  isActive: boolean;
  businessType: BusinessType;
  questionLibrary: QuestionLibrary;
  questionId: string;
  answerKey: string;
  flashcardId: string;
  numberSubtype: NumberSubtype;
  numberItemId: string;
  numberExampleId: string;
  shapeSubtype: ShapeSubtype;
  shapeItemId: string;
  shapeExampleId: string;
  pecsCategory: PecsCategory;
  pecsCardId: string;
}

interface GuidedPreview {
  tagType: BusinessType;
  targetType: string;
  targetId?: string | null;
  displayName: string;
  spokenText: string;
  payloadValue: string;
  description: string;
  sourceLabel: string;
  note: string;
  imageUrl?: string;
}

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  ANSWER: "Đáp án",
  FLASHCARD: "Flashcard",
  NUMBER: "Số học",
  SHAPE: "Hình khối",
  PECS: "Giao tiếp hình ảnh",
  GENERIC: "Khác",
};

const QUESTION_LIBRARY_LABELS: Record<QuestionLibrary, string> = {
  MATH: "Thư viện câu hỏi toán",
  THINKING: "Thư viện tư duy",
  SPELLING: "Thư viện đánh vần",
  RHYME: "Thư viện ghép vần",
};

const QUESTION_LIBRARY_OPTIONS = Object.keys(QUESTION_LIBRARY_LABELS) as QuestionLibrary[];
const BUSINESS_TYPE_OPTIONS = ["ANSWER", "FLASHCARD", "NUMBER", "SHAPE", "PECS"] as BusinessType[];

const PECS_CATEGORY_LABELS: Record<PecsCategory, string> = {
  EMOTION: "Cảm xúc",
  DAILY_ACTIVITY: "Sinh hoạt hằng ngày",
  NON_TOPIC: "Nhu cầu (Non-topic)",
};

const PECS_CATEGORY_OPTIONS = Object.keys(PECS_CATEGORY_LABELS) as PecsCategory[];
const PECS_DEEP_LINK_TARGETS: Record<PecsCategory, string> = {
  EMOTION: "pecs_emotion",
  DAILY_ACTIVITY: "pecs_daily",
  NON_TOPIC: "pecs_non_topic",
};

const buildNfcUri = (
  payloadValue: string,
  tagType?: BusinessType,
  pecsCategory?: PecsCategory | null,
) => {
  if (!payloadValue) return "";

  if (tagType === "PECS" && pecsCategory) {
    return `projectha://nfc/${payloadValue}?target=${PECS_DEEP_LINK_TARGETS[pecsCategory]}&mode=answer`;
  }

  return `projectha://nfc/${payloadValue}`;
};

const TAG_TYPE_LABELS: Record<string, string> = {
  ANSWER: "Đáp án",
  FLASHCARD: "Flashcard",
  NUMBER: "Số học",
  SHAPE: "Hình khối",
  PECS: "Giao tiếp hình ảnh",
  GENERIC: "Khác",
};

const NUMBER_WORDS: Record<number, string> = {
  0: "không",
  1: "một",
  2: "hai",
  3: "ba",
  4: "bốn",
  5: "năm",
  6: "sáu",
  7: "bảy",
  8: "tám",
  9: "chín",
  10: "mười",
};

const EMPTY_GUIDED_DRAFT: GuidedDraft = {
  tagUid: "",
  isActive: true,
  businessType: "ANSWER",
  questionLibrary: "MATH",
  questionId: "",
  answerKey: "",
  flashcardId: "",
  numberSubtype: "CARD",
  numberItemId: "",
  numberExampleId: "",
  shapeSubtype: "CARD",
  shapeItemId: "",
  shapeExampleId: "",
  pecsCategory: "EMOTION",
  pecsCardId: "",
};

const CARD_BG = "var(--bg-card, #ffffff)";
const TEXT_MAIN = "var(--text-main, #1e293b)";
const TEXT_MUTED = "var(--text-muted, #64748b)";
const PRIMARY_COLOR = "var(--primary, #2563eb)";
const PRIMARY_LIGHT = "rgba(37, 99, 235, 0.08)";
const BORDER = "var(--border, #e2e8f0)";

const getSelectableCardStyle = (isSelected: boolean): React.CSSProperties => ({
  padding: "16px 12px",
  borderRadius: "12px",
  border: isSelected ? `2px solid ${PRIMARY_COLOR}` : `1.5px solid ${BORDER}`,
  background: isSelected ? PRIMARY_LIGHT : CARD_BG,
  color: isSelected ? PRIMARY_COLOR : TEXT_MAIN,
  cursor: "pointer",
  textAlign: "center",
  transition: "all 0.2s ease",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "8px",
  boxShadow: isSelected ? "var(--shadow-sm)" : "none",
});

const getOptionButtonStyle = (isSelected: boolean): React.CSSProperties => ({
  flex: 1,
  padding: "10px",
  borderRadius: "8px",
  border: isSelected ? `2px solid ${PRIMARY_COLOR}` : `1.5px solid ${BORDER}`,
  background: isSelected ? PRIMARY_LIGHT : CARD_BG,
  color: isSelected ? PRIMARY_COLOR : TEXT_MAIN,
  cursor: "pointer",
  fontWeight: 600,
  transition: "all 0.15s ease",
});

const getGridItemStyle = (isSelected: boolean, isNumber: boolean = false): React.CSSProperties => ({
  padding: isNumber ? "10px 4px" : "10px 8px",
  borderRadius: "8px",
  border: isSelected ? `2px solid ${PRIMARY_COLOR}` : `1px solid ${BORDER}`,
  background: isSelected ? PRIMARY_LIGHT : CARD_BG,
  fontWeight: isNumber ? 700 : 600,
  fontSize: isNumber ? "15px" : "13px",
  cursor: "pointer",
  color: isSelected ? PRIMARY_COLOR : TEXT_MAIN,
  transition: "all 0.15s ease",
  textAlign: "center",
});

const getListRowStyle = (isSelected: boolean): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "10px 14px",
  borderBottom: `1px solid ${BORDER}`,
  background: isSelected ? PRIMARY_LIGHT : CARD_BG,
  cursor: "pointer",
  color: isSelected ? PRIMARY_COLOR : TEXT_MAIN,
  transition: "all 0.15s ease",
});

export function NfcTagsPage() {
  const [activeTab, setActiveTab] = useState<TabName>("LIST");
  const [items, setItems] = useState<NfcTagRecord[]>([]);
  const [filtered, setFiltered] = useState<NfcTagRecord[]>([]);
  const [search, setSearch] = useState("");
  const [filterTagType, setFilterTagType] = useState<BusinessType | "">("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Edit states
  const [editingItem, setEditingItem] = useState<NfcTagRecord | null>(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editSpokenText, setEditSpokenText] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [showTechInfo, setShowTechInfo] = useState(false);

  // Source selection data lists
  const [lessons, setLessons] = useState<LessonSource[]>([]);
  const [mathQuestions, setMathQuestions] = useState<MathQuestionSource[]>([]);
  const [flashcards, setFlashcards] = useState<FlashcardSource[]>([]);
  const [numberItems, setNumberItems] = useState<NumberItemSource[]>([]);
  const [numberExamples, setNumberExamples] = useState<NumberExampleSource[]>([]);
  const [shapeItems, setShapeItems] = useState<ShapeItemSource[]>([]);
  const [shapeExamples, setShapeExamples] = useState<ShapeExampleSource[]>([]);
  const [pecsCards, setPecsCards] = useState<PecsCardSource[]>([]);

  const getPecsCategoryForTag = (item: NfcTagRecord): PecsCategory | null => {
    if (item.tagType !== "PECS" || !item.targetId) return null;
    const pecsCard = pecsCards.find((card) => card.id === item.targetId);
    return pecsCard?.category ?? null;
  };

  // Search filter states for steps
  const [flashcardSearch, setFlashcardSearch] = useState("");
  const [questionSearch, setQuestionSearch] = useState("");

  const [guidedDraft, setGuidedDraft] = useState<GuidedDraft>(EMPTY_GUIDED_DRAFT);

  async function loadData() {
    setLoading(true);
    try {
      const [tagsRes, lessonsRes, questionsRes, flashcardsRes, numberItemsRes, numberExamplesRes, shapeItemsRes, shapeExamplesRes, pecsCardsRes] = await Promise.all([
        adminApi.list("/nfc-tags"),
        adminApi.list("/lessons"),
        adminApi.list("/math-questions"),
        adminApi.list("/flashcards"),
        adminApi.list("/number-items"),
        adminApi.list("/number-examples"),
        adminApi.list("/shape-items"),
        adminApi.list("/shape-examples"),
        adminApi.list("/pecs-cards"),
      ]);

      setItems((tagsRes.data.data || []) as NfcTagRecord[]);
      setLessons((lessonsRes.data.data || []) as LessonSource[]);
      setMathQuestions((questionsRes.data.data || []) as MathQuestionSource[]);
      setFlashcards((flashcardsRes.data.data || []) as FlashcardSource[]);
      setNumberItems((numberItemsRes.data.data || []) as NumberItemSource[]);
      setNumberExamples((numberExamplesRes.data.data || []) as NumberExampleSource[]);
      setShapeItems((shapeItemsRes.data.data || []) as ShapeItemSource[]);
      setShapeExamples((shapeExamplesRes.data.data || []) as ShapeExampleSource[]);
      setPecsCards((pecsCardsRes.data.data || []) as PecsCardSource[]);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu NFC:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let result = items;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (item) =>
          (item.payloadValue ?? "").toLowerCase().includes(q) ||
          (item.spokenText ?? "").toLowerCase().includes(q) ||
          (item.description ?? "").toLowerCase().includes(q) ||
          (TAG_TYPE_LABELS[item.tagType] || "").toLowerCase().includes(q)
      );
    }

    if (filterTagType) {
      result = result.filter((item) => item.tagType === filterTagType);
    }

    setFiltered(result);
  }, [items, search, filterTagType]);

  const table = useTableControls(
    filtered,
    [
      { value: "tagType", label: "Loại thẻ", getValue: (item) => TAG_TYPE_LABELS[item.tagType] || item.tagType },
      { value: "spokenText", label: "Nội dung đọc", getValue: (item) => item.spokenText || "" },
      { value: "payloadValue", label: "Nội dung ghi vào thẻ", getValue: (item) => item.payloadValue || "" },
      { value: "description", label: "Nguồn nội dung", getValue: (item) => item.description || "" },
      { value: "status", label: "Trạng thái", getValue: (item) => item.isActive },
    ],
    "payloadValue"
  );

  const openGuidedEdit = (item: NfcTagRecord) => {
    setEditingItem(item);
    setEditDisplayName(item.displayName || "");
    setEditSpokenText(item.spokenText || "");
    setEditDescription(item.description || "");
    setEditIsActive(item.isActive);
    setShowTechInfo(false);
    setErrors({});
  };

  const handleSelectNewContent = () => {
    if (!editingItem) return;
    if (!window.confirm("Việc chọn lại nội dung có thể thay đổi nội dung ghi vào thẻ NFC. Nếu payload thay đổi, bạn cần ghi lại thẻ NFC vật lý. Bạn có chắc chắn muốn tiếp tục?")) {
      return;
    }

    // Attempt to map back database values to guided draft
    const type = editingItem.tagType;
    const targetId = editingItem.targetId || "";

    const nextDraft = { ...EMPTY_GUIDED_DRAFT, businessType: type, isActive: editingItem.isActive };

    if (type === "FLASHCARD") {
      nextDraft.flashcardId = targetId;
    } else if (type === "NUMBER") {
      const isExample = editingItem.payloadValue?.includes("PHA_NUMBER_EXAMPLE_");
      if (isExample) {
        nextDraft.numberSubtype = "EXAMPLE";
        const example = numberExamples.find(e => e.id === targetId || normalizeSlug(e.exampleText) === editingItem.payloadValue?.replace("PHA_NUMBER_EXAMPLE_", ""));
        if (example) {
          nextDraft.numberExampleId = example.id;
          nextDraft.numberItemId = example.numberItemId;
        }
      } else {
        nextDraft.numberSubtype = "CARD";
        const numberVal = numberItems.find(n => n.id === targetId || `PHA_NUMBER_${n.numberValue}` === editingItem.payloadValue);
        if (numberVal) {
          nextDraft.numberItemId = numberVal.id;
        }
      }
    } else if (type === "SHAPE") {
      const isExample = editingItem.payloadValue?.includes("PHA_SHAPE_EXAMPLE_");
      if (isExample) {
        nextDraft.shapeSubtype = "EXAMPLE";
        const example = shapeExamples.find(e => e.id === targetId || normalizeSlug(e.exampleText) === editingItem.payloadValue?.replace("PHA_SHAPE_EXAMPLE_", ""));
        if (example) {
          nextDraft.shapeExampleId = example.id;
          nextDraft.shapeItemId = example.shapeItemId;
        }
      } else {
        nextDraft.shapeSubtype = "CARD";
        const shapeVal = shapeItems.find(s => s.id === targetId || `PHA_SHAPE_${deriveShapeCode(s.shapeName)}` === editingItem.payloadValue);
        if (shapeVal) {
          nextDraft.shapeItemId = shapeVal.id;
        }
      }
    } else if (type === "PECS") {
      const pecsVal = pecsCards.find(p => p.id === targetId);
      if (pecsVal) {
        nextDraft.pecsCardId = pecsVal.id;
        nextDraft.pecsCategory = pecsVal.category;
      }
    } else if (type === "ANSWER") {
      // Find answer option from questions
      const matchingQuestion = mathQuestions.find(q => {
        const ops = getQuestionAnswerOptions(q);
        return ops.some(op => `PHA_ANSWER_${normalizeSlug(op.text)}` === editingItem.payloadValue);
      });
      if (matchingQuestion) {
        nextDraft.questionId = matchingQuestion.id;
        nextDraft.questionLibrary = getQuestionLibrary(matchingQuestion, lessons);
        const matchedOption = getQuestionAnswerOptions(matchingQuestion).find(op => `PHA_ANSWER_${normalizeSlug(op.text)}` === editingItem.payloadValue);
        if (matchedOption) {
          nextDraft.answerKey = matchedOption.key;
        }
      }
    }

    setGuidedDraft(nextDraft);
    setEditingItem(null);
    setActiveTab("GUIDED");
  };

  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingItem) return;

    setSaving(true);
    try {
      await adminApi.update("/nfc-tags", editingItem.id, {
        displayName: editSpokenText.trim() ? editSpokenText.trim() : (editingItem.payloadValue || ""),
        spokenText: editSpokenText.trim(),
        description: editDescription.trim(),
        isActive: editIsActive,
      });
      await loadData();
      setEditingItem(null);
    } catch (e: any) {
      console.error(e);
      alert("Lỗi khi cập nhật thẻ NFC: " + (e?.message || e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa thẻ NFC này?")) return;
    try {
      await adminApi.remove("/nfc-tags", id);
      await loadData();
    } catch (error: any) {
      console.error(error);
      alert("Lỗi khi xóa thẻ NFC: " + (error?.message || error));
    }
  };

  const persistTag = async (payload: Record<string, any>) => {
    setSaving(true);
    try {
      await adminApi.create("/nfc-tags", payload);
      await loadData();
      setErrors({});
    } finally {
      setSaving(false);
    }
  };

  const buildGuidedPreview = (): GuidedPreview | null => {
    if (guidedDraft.businessType === "ANSWER") {
      const question = getQuestionForLibrary(guidedDraft.questionId, guidedDraft.questionLibrary, mathQuestions, lessons);
      if (!question || !guidedDraft.answerKey) return null;
      const answerText = getQuestionAnswerText(question, guidedDraft.answerKey);
      if (!answerText) return null;

      const sourceLabel = `${QUESTION_LIBRARY_LABELS[guidedDraft.questionLibrary]} · Câu hỏi: ${question.questionText}`;
      return {
        tagType: "ANSWER",
        targetType: "ANSWER_VALUE",
        targetId: guidedDraft.answerKey,
        displayName: `Đáp án: ${answerText}`,
        spokenText: answerText,
        payloadValue: `PHA_ANSWER_${normalizeSlug(answerText)}`,
        description: `Thư viện câu hỏi`,
        sourceLabel,
        note: "Dùng chung cho các bài học và thử thách có đáp án này.",
        imageUrl: question.imageUrl,
      };
    }

    if (guidedDraft.businessType === "FLASHCARD") {
      const flashcard = flashcards.find((item) => item.id === guidedDraft.flashcardId);
      if (!flashcard) return null;
      const spokenText = buildFlashcardSpeech(flashcard.frontText, flashcard.backText);
      return {
        tagType: "FLASHCARD",
        targetType: "FLASHCARD",
        targetId: flashcard.id,
        displayName: `Flashcard: ${flashcard.frontText}`,
        spokenText,
        payloadValue: `PHA_FLASHCARD_${normalizeSlug(flashcard.frontText)}`,
        description: `Flashcard`,
        sourceLabel: `Mặt trước: ${flashcard.frontText} · Mặt sau: ${flashcard.backText}`,
        note: "Một thẻ NFC đại diện cho toàn bộ flashcard này.",
        imageUrl: flashcard.imageUrl,
      };
    }

    if (guidedDraft.businessType === "NUMBER") {
      if (guidedDraft.numberSubtype === "CARD") {
        const numberItem = numberItems.find((item) => item.id === guidedDraft.numberItemId);
        if (!numberItem) return null;
        return {
          tagType: "NUMBER",
          targetType: "RAW_VALUE",
          targetId: numberItem.id,
          displayName: `Số ${numberItem.numberValue}`,
          spokenText: buildNumberSpeech(numberItem.numberValue),
          payloadValue: `PHA_NUMBER_${numberItem.numberValue}`,
          description: `Bộ số`,
          sourceLabel: `Thẻ số học ${numberItem.numberValue} (${numberItem.title})`,
          note: "Dùng cho nhận diện số học tương tác.",
          imageUrl: numberItem.imageUrl,
        };
      }

      const numberItem = numberItems.find((item) => item.id === guidedDraft.numberItemId);
      const numberExample = numberExamples.find((item) => item.id === guidedDraft.numberExampleId);
      if (!numberItem || !numberExample) return null;
      return {
        tagType: "NUMBER",
        targetType: "RAW_VALUE",
        targetId: numberExample.id,
        displayName: `Ví dụ số: ${numberExample.exampleText}`,
        spokenText: `Đây là ${numberExample.exampleText}.`,
        payloadValue: `PHA_NUMBER_EXAMPLE_${normalizeSlug(numberExample.exampleText)}`,
        description: `Bộ số`,
        sourceLabel: `Ví dụ số: ${numberExample.exampleText} (Số ${numberItem.numberValue})`,
        note: "Dùng cho ví dụ minh họa và hoạt động đếm.",
        imageUrl: numberExample.imageUrl,
      };
    }

    if (guidedDraft.businessType === "SHAPE") {
      if (guidedDraft.shapeSubtype === "CARD") {
        const shapeItem = shapeItems.find((item) => item.id === guidedDraft.shapeItemId);
        if (!shapeItem) return null;
        const shapeDisplayName = formatShapeDisplayName(shapeItem.shapeName);
        const shapeCode = deriveShapeCode(shapeItem.shapeName);
        return {
          tagType: "SHAPE",
          targetType: "RAW_VALUE",
          targetId: shapeItem.id,
          displayName: shapeDisplayName,
          spokenText: `Đây là ${shapeDisplayName.toLowerCase()}.`,
          payloadValue: `PHA_SHAPE_${shapeCode}`,
          description: `Bộ hình`,
          sourceLabel: `Thẻ hình học: ${shapeDisplayName}`,
          note: "Dùng cho nhận diện và trả lời hình khối.",
          imageUrl: shapeItem.imageUrl,
        };
      }

      const shapeItem = shapeItems.find((item) => item.id === guidedDraft.shapeItemId);
      const shapeExample = shapeExamples.find((item) => item.id === guidedDraft.shapeExampleId);
      if (!shapeItem || !shapeExample) return null;
      const shapeDisplayName = formatShapeDisplayName(shapeItem.shapeName);
      return {
        tagType: "SHAPE",
        targetType: "RAW_VALUE",
        targetId: shapeExample.id,
        displayName: `Ví dụ hình: ${shapeExample.exampleText}`,
        spokenText: `Đây là ${shapeExample.exampleText}.`,
        payloadValue: `PHA_SHAPE_EXAMPLE_${normalizeSlug(shapeExample.exampleText)}`,
        description: `Bộ hình`,
        sourceLabel: `Ví dụ hình: ${shapeExample.exampleText} (${shapeDisplayName})`,
        note: "Dùng cho học tập và ví dụ minh họa hình học.",
        imageUrl: shapeExample.imageUrl,
      };
    }

    if (guidedDraft.businessType === "PECS") {
      const pecsCard = pecsCards.find((item) => item.id === guidedDraft.pecsCardId && item.category === guidedDraft.pecsCategory);
      if (!pecsCard) return null;
      return {
        tagType: "PECS",
        targetType: "RAW_VALUE",
        targetId: pecsCard.id,
        displayName: `PECS: ${pecsCard.title}`,
        spokenText: pecsCard.spokenText,
        payloadValue: `PHA_PECS_${pecsCard.category.toUpperCase()}_${normalizeSlug(pecsCard.title)}`,
        description: `PECS`,
        sourceLabel: `Thẻ PECS nhóm: ${PECS_CATEGORY_LABELS[pecsCard.category]} · Tiêu đề: ${pecsCard.title}`,
        note: "Chỉ dùng cho hệ thống giao tiếp bằng hình ảnh.",
        imageUrl: pecsCard.imageUrl,
      };
    }

    return null;
  };

  const handleGuidedSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    const preview = buildGuidedPreview();
    if (!preview) {
      nextErrors.preview = "Vui lòng chọn đầy đủ nội dung trước khi lưu.";
    }

    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    if (!preview) return;

    // Check duplicate payload_value locally
    const duplicate = items.find(
      (item) => item.payloadValue?.trim().toUpperCase() === preview.payloadValue.toUpperCase()
    );
    if (duplicate) {
      alert(`Nội dung ghi vào thẻ "${preview.payloadValue}" này đã được tạo trước đó.`);
      return;
    }

    try {
      await persistTag({
        tagUid: null,
        displayName: preview.displayName,
        tagType: preview.tagType,
        targetType: preview.targetType,
        targetId: preview.targetId || null,
        payloadValue: preview.payloadValue,
        spokenText: preview.spokenText,
        description: preview.description,
        isActive: guidedDraft.isActive,
      });

      setGuidedDraft((current) => ({
        ...EMPTY_GUIDED_DRAFT,
        isActive: current.isActive,
      }));
      setActiveTab("LIST");
      alert("Đã lưu thẻ NFC thành công! Hãy copy nội dung và ghi vào thẻ.");
    } catch (e: any) {
      console.error(e);
      alert("Lỗi khi lưu thẻ NFC: " + (e?.message || e));
    }
  };

  const handleGuidedTypeChange = (nextType: BusinessType) => {
    setGuidedDraft((current) => {
      const nextDraft = { ...current, businessType: nextType };
      if (nextType === "ANSWER") {
        nextDraft.questionId = "";
        nextDraft.answerKey = "";
      } else if (nextType === "FLASHCARD") {
        nextDraft.flashcardId = "";
      } else if (nextType === "NUMBER") {
        nextDraft.numberItemId = "";
        nextDraft.numberExampleId = "";
        nextDraft.numberSubtype = "CARD";
      } else if (nextType === "SHAPE") {
        nextDraft.shapeItemId = "";
        nextDraft.shapeExampleId = "";
        nextDraft.shapeSubtype = "CARD";
      } else if (nextType === "PECS") {
        nextDraft.pecsCardId = "";
      }
      return nextDraft;
    });
  };

  const resetGuidedForm = () => {
    setGuidedDraft((current) => ({
      ...EMPTY_GUIDED_DRAFT,
      isActive: current.isActive,
    }));
    setErrors({});
  };

  const guidedPreview = buildGuidedPreview();
  const guidedPreviewUri = guidedPreview
    ? buildNfcUri(
        guidedPreview.payloadValue,
        guidedPreview.tagType,
        guidedPreview.tagType === "PECS" ? guidedDraft.pecsCategory : null
      )
    : "";
  const editingRecommendedUri = editingItem
    ? buildNfcUri(
        editingItem.payloadValue || "",
        editingItem.tagType,
        getPecsCategoryForTag(editingItem)
      )
    : "";
  const answerQuestion = getQuestionForLibrary(guidedDraft.questionId, guidedDraft.questionLibrary, mathQuestions, lessons);
  const answerOptions = answerQuestion ? getQuestionAnswerOptions(answerQuestion) : [];
  const selectedFlashcard = flashcards.find((item) => item.id === guidedDraft.flashcardId);
  const selectedNumberItem = numberItems.find((item) => item.id === guidedDraft.numberItemId);
  const selectedNumberExample = numberExamples.find((item) => item.id === guidedDraft.numberExampleId);
  const selectedShapeItem = shapeItems.find((item) => item.id === guidedDraft.shapeItemId);
  const selectedShapeExample = shapeExamples.find((item) => item.id === guidedDraft.shapeExampleId);
  const selectedPecsCard = pecsCards.find((item) => item.id === guidedDraft.pecsCardId);

  function renderListView() {
    return (
      <>
        <div className="panel" style={{ padding: "16px", marginBottom: "16px", display: "flex", gap: "12px", flexWrap: "wrap", background: "#f8fafc", borderRadius: "12px", border: "1px solid var(--border)" }}>
          <input
            type="text"
            placeholder="Tìm theo nội dung đọc, nội dung ghi vào thẻ, nguồn nội dung…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="search-input"
            style={{ flex: 1, minWidth: "260px", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border)" }}
          />

          <select
            value={filterTagType}
            onChange={(event) => setFilterTagType((event.target.value as BusinessType) || "")}
            style={{ padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "white", fontWeight: 600 }}
          >
            <option value="">-- Tất cả loại thẻ --</option>
            {BUSINESS_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {BUSINESS_TYPE_LABELS[type]}
              </option>
            ))}
            <option value="GENERIC">Khác</option>
          </select>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>Đang tải danh sách thẻ NFC...</p>
        ) : filtered.length === 0 ? (
          <div className="panel" style={{ textAlign: "center", padding: "60px", border: "1px dashed var(--border)", borderRadius: "12px" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "16px" }}>Không tìm thấy thẻ NFC nào.</p>
          </div>
        ) : (
          <>
            <TableControls {...table} />
            <div className="table-wrap" style={{ boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)", marginTop: "12px" }}>
              <table>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={{ padding: "14px" }}>Loại thẻ</th>
                    <th>Nội dung đọc</th>
                    <th>Nội dung ghi vào thẻ</th>
                    <th>Nguồn nội dung</th>
                    <th style={{ width: "120px" }}>Trạng thái</th>
                    <th style={{ width: "150px" }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {table.pagedItems.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "14px" }}>
                        <span style={{
                          background: item.tagType === "ANSWER" ? "#eff6ff" : item.tagType === "FLASHCARD" ? "#fdf2f8" : item.tagType === "NUMBER" ? "#fff7ed" : item.tagType === "SHAPE" ? "#f0fdf4" : "#f1f5f9",
                          color: item.tagType === "ANSWER" ? "#1e40af" : item.tagType === "FLASHCARD" ? "#9d174d" : item.tagType === "NUMBER" ? "#c2410c" : item.tagType === "SHAPE" ? "#166534" : "#475569",
                          padding: "4px 10px",
                          borderRadius: "9999px",
                          fontSize: "13px",
                          fontWeight: 600
                        }}>
                          {BUSINESS_TYPE_LABELS[item.tagType] || item.tagType}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: "14px" }}>{item.spokenText || "—"}</td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {(() => {
                              const recommendedUri = item.payloadValue
                                ? buildNfcUri(item.payloadValue, item.tagType, getPecsCategoryForTag(item))
                                : "";

                              return (
                            <code style={{ background: "#ecfdf5", color: "#065f46", padding: "4px 8px", borderRadius: "6px", fontWeight: "bold", fontFamily: "monospace", fontSize: "13px" }}>
                              {recommendedUri || "—"}
                            </code>
                              );
                            })()}
                            {item.payloadValue && (
                              <button
                                type="button"
                                onClick={() => {
                                  const recommendedUri = buildNfcUri(item.payloadValue || "", item.tagType, getPecsCategoryForTag(item));
                                  navigator.clipboard.writeText(recommendedUri);
                                  alert("Đã copy URI: " + recommendedUri);
                                }}
                                style={{ border: "none", background: "none", cursor: "pointer", padding: "2px 4px", fontSize: "14px" }}
                                title="Copy URI"
                              >
                                📋
                              </button>
                            )}
                          </div>
                          {item.payloadValue && (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(item.payloadValue || "");
                                alert("Đã copy payload nội bộ: " + item.payloadValue);
                              }}
                              style={{ border: "none", background: "none", color: "#3b82f6", cursor: "pointer", padding: "2px 4px", fontSize: "11px", textAlign: "left", width: "fit-content" }}
                            >
                              Copy payload nội bộ ({item.payloadValue})
                            </button>
                          )}
                        </div>
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: "13px" }}>{item.description || "—"}</td>
                      <td>
                        <span style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: 700,
                          background: item.isActive ? "#d1fae5" : "#f1f5f9",
                          color: item.isActive ? "#065f46" : "#475569"
                        }}>
                          {item.isActive ? "Hoạt động" : "Tạm khóa"}
                        </span>
                      </td>
                      <td>
                        <div className="actions" style={{ display: "flex", gap: "8px" }}>
                          <button className="secondary" onClick={() => openGuidedEdit(item)} style={{ padding: "4px 10px", fontSize: "13px" }}>Sửa</button>
                          <button className="danger" onClick={() => handleDelete(item.id)} style={{ padding: "4px 10px", fontSize: "13px" }}>Xóa</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </>
    );
  }

  function renderGuidedView() {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px" }}>
        {/* Left column - guided content choosing form */}
        <div className="panel" style={{ padding: "20px", border: "1px solid var(--border)", borderRadius: "12px", background: "var(--surface, white)", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Step 1: Choose Tag Type */}
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text)" }}>
              <span style={{ background: "var(--primary)", color: "white", borderRadius: "50%", width: "24px", height: "24px", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "13px" }}>1</span>
              Chọn loại thẻ NFC
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
              {(Object.keys(BUSINESS_TYPE_LABELS) as BusinessType[]).filter(t => t !== "GENERIC").map((type) => {
                const isSelected = guidedDraft.businessType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleGuidedTypeChange(type)}
                    style={getSelectableCardStyle(isSelected)}
                  >
                    <span style={{ fontSize: "24px" }}>
                      {type === "ANSWER" ? "📝" : type === "FLASHCARD" ? "🎴" : type === "NUMBER" ? "🔢" : type === "SHAPE" ? "📐" : "💬"}
                    </span>
                    <span style={{ fontSize: "14px", fontWeight: 600 }}>
                      {BUSINESS_TYPE_LABELS[type]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--border)" }} />

          {/* Step 2: Choose Content Detail */}
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text)" }}>
              <span style={{ background: "var(--primary)", color: "white", borderRadius: "50%", width: "24px", height: "24px", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "13px" }}>2</span>
              Chọn nội dung liên kết
            </h3>

            {/* Answer (Đáp án) selector workflow */}
            {guidedDraft.businessType === "ANSWER" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="field">
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "6px", color: "var(--text)" }}>Chọn thư viện câu hỏi *</label>
                  <select
                    value={guidedDraft.questionLibrary}
                    onChange={(event) =>
                      setGuidedDraft((current) => ({
                        ...current,
                        questionLibrary: event.target.value as QuestionLibrary,
                        questionId: "",
                        answerKey: "",
                      }))
                    }
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface, white)", color: "var(--text)" }}
                  >
                    {QUESTION_LIBRARY_OPTIONS.map((library) => (
                      <option key={library} value={library}>
                        {QUESTION_LIBRARY_LABELS[library]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "6px", color: "var(--text)" }}>Chọn câu hỏi nguồn *</label>
                  <div style={{ marginBottom: "8px" }}>
                    <input
                      type="text"
                      placeholder="Tìm nhanh câu hỏi..."
                      value={questionSearch}
                      onChange={(e) => setQuestionSearch(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "14px", background: "var(--surface, white)", color: "var(--text)" }}
                    />
                  </div>
                  <select
                    value={guidedDraft.questionId}
                    onChange={(event) =>
                      setGuidedDraft((current) => ({
                        ...current,
                        questionId: event.target.value,
                        answerKey: "",
                      }))
                    }
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", maxHeight: "160px", background: "var(--surface, white)", color: "var(--text)" }}
                  >
                    <option value="">-- Chọn câu hỏi --</option>
                    {getQuestionsForLibrary(guidedDraft.questionLibrary, mathQuestions, lessons)
                      .filter(q => !questionSearch || q.questionText.toLowerCase().includes(questionSearch.toLowerCase()))
                      .map((question) => (
                        <option key={question.id} value={question.id}>
                          {question.questionText}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="field">
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "6px", color: "var(--text)" }}>Chọn một đáp án *</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
                    {answerOptions.length === 0 ? (
                      <div style={{ color: "var(--text-muted)", fontSize: "14px", gridColumn: "span 2" }}>Chọn câu hỏi ở trên để tải các lựa chọn đáp án.</div>
                    ) : (
                      answerOptions.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => setGuidedDraft((current) => ({ ...current, answerKey: option.key }))}
                          style={{
                            textAlign: "left",
                            borderRadius: "10px",
                            border: guidedDraft.answerKey === option.key ? "2px solid var(--primary)" : "1.5px solid var(--border)",
                            background: guidedDraft.answerKey === option.key ? "var(--primary-light)" : "var(--bg-card)",
                            padding: "12px",
                            cursor: "pointer",
                            color: "var(--text-main)"
                          }}
                        >
                          <div style={{ fontWeight: 700, color: "var(--primary)" }}>Lựa chọn {option.key}</div>
                          <div style={{ marginTop: "4px", fontSize: "14px" }}>{option.text}</div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Flashcard selector workflow */}
            {guidedDraft.businessType === "FLASHCARD" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    placeholder="Tìm flashcard theo mặt trước/mặt sau..."
                    value={flashcardSearch}
                    onChange={(e) => setFlashcardSearch(e.target.value)}
                    style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-main)" }}
                  />
                </div>
                <div style={{ maxHeight: "250px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "8px" }}>
                  {flashcards
                    .filter(f => !flashcardSearch || f.frontText.toLowerCase().includes(flashcardSearch.toLowerCase()) || f.backText.toLowerCase().includes(flashcardSearch.toLowerCase()))
                    .map((card) => {
                      const isSelected = guidedDraft.flashcardId === card.id;
                      return (
                        <div
                          key={card.id}
                          onClick={() => setGuidedDraft(curr => ({ ...curr, flashcardId: card.id }))}
                          style={getListRowStyle(isSelected)}
                        >
                          {card.imageUrl ? (
                            <img src={card.imageUrl} alt="" style={{ width: "40px", height: "40px", objectFit: "contain", borderRadius: "4px", background: "var(--border)" }} />
                          ) : (
                            <div style={{ width: "40px", height: "40px", background: "var(--border)", borderRadius: "4px", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "16px" }}>🎴</div>
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>Mặt trước: {card.frontText}</div>
                            <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Mặt sau: {card.backText}</div>
                          </div>
                          {isSelected && <span style={{ color: "var(--primary)", fontWeight: "bold" }}>✓ Selected</span>}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Number selector workflow */}
            {guidedDraft.businessType === "NUMBER" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="field">
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "6px", color: "var(--text)" }}>Chọn kiểu thẻ số *</label>
                  <div style={{ display: "flex", gap: "10px" }}>
                    {(["CARD", "EXAMPLE"] as NumberSubtype[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setGuidedDraft(curr => ({ ...curr, numberSubtype: st, numberItemId: "", numberExampleId: "" }))}
                        style={getOptionButtonStyle(guidedDraft.numberSubtype === st)}
                      >
                        {st === "CARD" ? "🔢 Thẻ số gốc (0-10)" : "🍎 Thẻ ví dụ đếm số"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "6px", color: "var(--text-main)" }}>Chọn số liên kết *</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px" }}>
                    {numberItems.map((n) => {
                      const isSelected = guidedDraft.numberItemId === n.id;
                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => setGuidedDraft(curr => ({ ...curr, numberItemId: n.id, numberExampleId: "" }))}
                          style={getGridItemStyle(isSelected, true)}
                        >
                          {n.numberValue}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {guidedDraft.numberSubtype === "EXAMPLE" && selectedNumberItem && (
                  <div className="field">
                    <label style={{ fontWeight: 600, display: "block", marginBottom: "6px", color: "var(--text-main)" }}>Chọn hình ảnh ví dụ liên kết *</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {(() => {
                        const filteredExamples = numberExamples.filter(e => e.numberItemId === selectedNumberItem.id);
                        if (filteredExamples.length === 0) {
                          return (
                            <div style={{ padding: "16px", color: "var(--text-muted)", fontSize: "14px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "8px", background: "var(--bg-card)" }}>
                              Chưa có ví dụ nào cho mục này. Hãy thêm ví dụ ở trang Bộ số trước.
                            </div>
                          );
                        }
                        return (
                          <div style={{ display: "grid", gap: "8px", maxHeight: "180px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "8px", padding: "6px" }}>
                            {filteredExamples.map(ex => {
                              const isSelected = guidedDraft.numberExampleId === ex.id;
                              return (
                                <div
                                  key={ex.id}
                                  onClick={() => setGuidedDraft(curr => ({ ...curr, numberExampleId: ex.id }))}
                                  style={getListRowStyle(isSelected)}
                                >
                                  {ex.imageUrl ? (
                                    <img src={ex.imageUrl} alt="" style={{ width: "32px", height: "32px", objectFit: "contain", borderRadius: "4px" }} />
                                  ) : (
                                    <div style={{ width: "32px", height: "32px", background: "var(--border)", borderRadius: "4px" }} />
                                  )}
                                  <div style={{ display: "flex", flexDirection: "column" }}>
                                    <span style={{ fontSize: "14px", fontWeight: 600 }}>{ex.exampleText}</span>
                                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Số cha: {selectedNumberItem.numberValue}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Shape selector workflow */}
            {guidedDraft.businessType === "SHAPE" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="field">
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "6px", color: "var(--text)" }}>Chọn kiểu thẻ hình học *</label>
                  <div style={{ display: "flex", gap: "10px" }}>
                    {(["CARD", "EXAMPLE"] as ShapeSubtype[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setGuidedDraft(curr => ({ ...curr, shapeSubtype: st, shapeItemId: "", shapeExampleId: "" }))}
                        style={getOptionButtonStyle(guidedDraft.shapeSubtype === st)}
                      >
                        {st === "CARD" ? "📐 Thẻ hình gốc" : "🏠 Thẻ vật thể hình học / Ví dụ hình"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "6px", color: "var(--text-main)" }}>Chọn hình học gốc *</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                    {shapeItems.map((s) => {
                      const isSelected = guidedDraft.shapeItemId === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setGuidedDraft(curr => ({ ...curr, shapeItemId: s.id, shapeExampleId: "" }))}
                          style={getGridItemStyle(isSelected)}
                        >
                          {formatShapeDisplayName(s.shapeName)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {guidedDraft.shapeSubtype === "EXAMPLE" && selectedShapeItem && (
                  <div className="field">
                    <label style={{ fontWeight: 600, display: "block", marginBottom: "6px", color: "var(--text-main)" }}>Chọn ví dụ hình ảnh liên kết *</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {(() => {
                        const filteredExamples = shapeExamples.filter(e => e.shapeItemId === selectedShapeItem.id);
                        if (filteredExamples.length === 0) {
                          return (
                            <div style={{ padding: "16px", color: "var(--text-muted)", fontSize: "14px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "8px", background: "var(--bg-card)" }}>
                              Chưa có ví dụ nào cho mục này. Hãy thêm ví dụ ở trang Bộ hình trước.
                            </div>
                          );
                        }
                        return (
                          <div style={{ display: "grid", gap: "8px", maxHeight: "180px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "8px", padding: "6px" }}>
                            {filteredExamples.map(ex => {
                              const isSelected = guidedDraft.shapeExampleId === ex.id;
                              return (
                                <div
                                  key={ex.id}
                                  onClick={() => setGuidedDraft(curr => ({ ...curr, shapeExampleId: ex.id }))}
                                  style={getListRowStyle(isSelected)}
                                >
                                  {ex.imageUrl ? (
                                    <img src={ex.imageUrl} alt="" style={{ width: "32px", height: "32px", objectFit: "contain", borderRadius: "4px" }} />
                                  ) : (
                                    <div style={{ width: "32px", height: "32px", background: "var(--border)", borderRadius: "4px" }} />
                                  )}
                                  <div style={{ display: "flex", flexDirection: "column" }}>
                                    <span style={{ fontSize: "14px", fontWeight: 600 }}>{ex.exampleText}</span>
                                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Hình gốc: {formatShapeDisplayName(selectedShapeItem.shapeName)}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PECS cards selector workflow */}
            {guidedDraft.businessType === "PECS" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="field">
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "6px", color: "var(--text)" }}>Chọn nhóm nội dung PECS *</label>
                  <select
                    value={guidedDraft.pecsCategory}
                    onChange={(event) =>
                      setGuidedDraft((current) => ({
                        ...current,
                        pecsCategory: event.target.value as PecsCategory,
                        pecsCardId: "",
                      }))
                    }
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface, white)", color: "var(--text)" }}
                  >
                    {PECS_CATEGORY_OPTIONS.map((category) => (
                      <option key={category} value={category}>
                        {PECS_CATEGORY_LABELS[category]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "6px", color: "var(--text)" }}>Chọn thẻ PECS *</label>
                  <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "8px" }}>
                    {pecsCards
                      .filter((card) => card.category === guidedDraft.pecsCategory)
                      .map((card) => {
                        const isSelected = guidedDraft.pecsCardId === card.id;
                        return (
                          <div
                            key={card.id}
                            onClick={() => setGuidedDraft(curr => ({ ...curr, pecsCardId: card.id }))}
                            style={getListRowStyle(isSelected)}
                          >
                            {card.imageUrl ? (
                              <img src={card.imageUrl} alt="" style={{ width: "32px", height: "32px", objectFit: "contain", borderRadius: "4px" }} />
                            ) : (
                              <div style={{ width: "32px", height: "32px", background: "var(--border)", borderRadius: "4px" }} />
                            )}
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600 }}>{card.title}</div>
                              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>TTS: {card.spokenText}</div>
                            </div>
                            {isSelected && <span style={{ color: "var(--primary)", fontWeight: "bold" }}>✓ Selected</span>}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--border)" }} />

          {/* Active toggle switch */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label style={{ fontWeight: 600, color: "var(--text)" }}>Tự động kích hoạt thẻ khi lưu</label>
            <ToggleSwitch id="guided-active" label="" checked={guidedDraft.isActive} onChange={(value) => setGuidedDraft((current) => ({ ...current, isActive: value }))} />
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button type="button" className="secondary" onClick={resetGuidedForm} disabled={saving} style={{ padding: "10px 16px", borderRadius: "8px", cursor: "pointer", color: "var(--text)", background: "var(--surface)" }}>
              Làm mới
            </button>
            <button type="button" onClick={handleGuidedSubmit} disabled={saving || !guidedPreview} style={{ padding: "10px 20px", borderRadius: "8px", background: guidedPreview ? "var(--primary)" : "#cbd5e1", color: "white", border: "none", cursor: guidedPreview ? "pointer" : "not-allowed", fontWeight: 600 }}>
              {saving ? "Đang lưu..." : "Lưu thẻ NFC"}
            </button>
          </div>
        </div>

        {/* Right column - visual premium preview card */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", position: "sticky", top: "24px", alignSelf: "start" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text)" }}>Xem trước thẻ NFC sinh ra</h3>

          {guidedPreview ? (
            <div style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)", color: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 10px 25px rgba(15,23,42,0.15)", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ background: "rgba(255,255,255,0.1)", padding: "4px 10px", borderRadius: "99px", fontSize: "12px", fontWeight: 600 }}>
                  {BUSINESS_TYPE_LABELS[guidedPreview.tagType]}
                </span>
                <span style={{ fontSize: "20px" }}>📡 NFC Card</span>
              </div>

              {/* Embed preview image if available */}
              {guidedPreview.imageUrl && (
                <div style={{ display: "flex", justifyContent: "center", background: "rgba(255,255,255,0.05)", borderRadius: "10px", padding: "12px" }}>
                  <img src={guidedPreview.imageUrl} alt="" style={{ maxHeight: "120px", objectFit: "contain", borderRadius: "6px" }} />
                </div>
              )}

              <div>
                <div style={{ fontSize: "13px", color: "#94a3b8" }}>Nội dung TTS sẽ đọc:</div>
                <div style={{ fontSize: "14px", marginTop: "2px", color: "#cbd5e1" }}>"{guidedPreview.spokenText}"</div>
              </div>

              <div>
                <div style={{ fontSize: "13px", color: "#94a3b8" }}>Nguồn nội dung:</div>
                <div style={{ fontSize: "13px", marginTop: "2px", color: "#cbd5e1" }}>{guidedPreview.sourceLabel}</div>
              </div>

              <div style={{ borderTop: "1.5px dashed rgba(255,255,255,0.15)", paddingTop: "14px", marginTop: "4px" }}>
                <div style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "6px" }}>Nội dung ghi NFC đề xuất (Custom URL / URI):</div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <code style={{ flex: 1, background: "rgba(255,255,255,0.08)", padding: "8px 12px", borderRadius: "6px", fontSize: "14px", fontWeight: "bold", fontFamily: "monospace", color: "#34d399", overflowX: "auto" }}>
                    {guidedPreviewUri}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(guidedPreviewUri);
                      alert("Đã copy URI đề xuất: " + guidedPreviewUri);
                    }}
                    style={{ background: "#3b82f6", color: "white", border: "none", padding: "8px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
                  >
                    Copy URI
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(guidedPreview.payloadValue);
                    alert("Đã copy payload nội bộ: " + guidedPreview.payloadValue);
                  }}
                  style={{ background: "none", border: "none", color: "#3b82f6", textDecoration: "underline", fontSize: "12px", marginTop: "6px", cursor: "pointer", textAlign: "left", display: "block" }}
                >
                  Copy payload nội bộ ({guidedPreview.payloadValue})
                </button>
              </div>

              <div style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "8px", padding: "10px", fontSize: "12px", color: "#fef08a", marginTop: "8px" }}>
                💡 <strong>Hướng dẫn nạp thẻ:</strong> Mở ứng dụng <strong>NFC Tools</strong> &gt; chọn <strong>Write</strong> &gt; chọn <strong>Add a record</strong> &gt; chọn <strong>Custom URL / URI</strong>, dán nội dung này và ghi vào thẻ NFC.
                <div style={{ marginTop: "4px", opacity: 0.8 }}>
                  * Text record với payload nội bộ PHA_* vẫn được hỗ trợ, nhưng iPhone có thể không tự mở app.
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: "40px 20px", textAlign: "center", border: "1.5px dashed var(--border)", borderRadius: "16px", color: "var(--text-muted)", background: "rgba(0,0,0,0.01)" }}>
              Vui lòng chọn đầy đủ thông tin ở cột bên trái để hiển thị thẻ xem trước NFC.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0, color: "var(--text)" }}>Quản lý thẻ NFC</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: "4px 0 0 0" }}>Liên kết các bài học, học phần hoặc đáp án tới thẻ NFC vật lý thông qua payload chuẩn</p>
        </div>
        <div className="tabs" style={{ display: "flex", gap: "8px" }}>
          <button
            className={`tab-btn ${activeTab === "LIST" ? "active" : ""}`}
            onClick={() => setActiveTab("LIST")}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: activeTab === "LIST" ? "var(--primary)" : "var(--surface)",
              color: activeTab === "LIST" ? "white" : "var(--text)",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Danh sách thẻ
          </button>
          <button
            className={`tab-btn ${activeTab === "GUIDED" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("GUIDED");
              resetGuidedForm();
            }}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: activeTab === "GUIDED" ? "var(--primary)" : "var(--surface)",
              color: activeTab === "GUIDED" ? "white" : "var(--text)",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Tạo thẻ theo nội dung
          </button>
        </div>
      </div>

      {activeTab === "LIST" ? renderListView() : renderGuidedView()}

      {/* Edit Modal */}
      {editingItem && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: "min(680px, 96vw)", maxHeight: "90vh" }}>
            {/* Modal Header */}
            <div className="modal-header">
              <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>Chỉnh sửa thông tin thẻ NFC</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setEditingItem(null)}
              >
                ✕
              </button>
            </div>

            {/* Modal Content (Scrollable) */}
            {/* Modal Content (Scrollable) */}
            <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", overflow: "hidden", height: "100%" }}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                {/* Warning about payload change */}
                <div style={{
                  background: "rgba(245, 158, 11, 0.08)",
                  border: "1px solid rgba(245, 158, 11, 0.2)",
                  borderRadius: "8px",
                  padding: "12px",
                  fontSize: "13px",
                  color: "#d97706"
                }}>
                  ⚠️ <strong>Lưu ý:</strong> Thay đổi nội dung học tập liên kết để sinh payload mới bằng cách nhấn nút <strong>Chọn lại nội dung</strong>. Form sửa này chỉ cập nhật các thông tin mô tả và trạng thái.
                </div>

                <div className="field">
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "6px", color: "var(--text-main)" }}>Loại thẻ</label>
                  <input
                    type="text"
                    value={BUSINESS_TYPE_LABELS[editingItem.tagType] || editingItem.tagType}
                    disabled
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-main)", color: "var(--text-muted)" }}
                  />
                </div>

                <div className="field">
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "6px", color: "var(--text-main)" }}>Nội dung ghi NFC đề xuất (Custom URL / URI)</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <code style={{ flex: 1, background: "var(--bg-main)", color: "#065f46", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "14px", fontFamily: "monospace", fontWeight: "bold", overflowX: "auto" }}>
                        {editingRecommendedUri || "—"}
                      </code>
                      {editingItem.payloadValue && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(editingRecommendedUri);
                            alert("Đã copy URI: " + editingRecommendedUri);
                          }}
                          style={{ padding: "8px 14px", fontSize: "13px" }}
                        >
                          Copy URI
                        </button>
                      )}
                    </div>
                    {editingItem.payloadValue && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(editingItem.payloadValue || "");
                          alert("Đã copy payload nội bộ: " + editingItem.payloadValue);
                        }}
                        style={{ background: "none", border: "none", color: "#3b82f6", textDecoration: "underline", fontSize: "12px", cursor: "pointer", textAlign: "left", width: "fit-content" }}
                      >
                        Copy payload nội bộ ({editingItem.payloadValue})
                      </button>
                    )}
                  </div>
                </div>

                <div className="field">
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "6px", color: "var(--text-main)" }}>Nội dung TTS đọc *</label>
                  <input
                    type="text"
                    value={editSpokenText}
                    onChange={(e) => setEditSpokenText(e.target.value)}
                    required
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-main)" }}
                  />
                </div>

                <div className="field">
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "6px", color: "var(--text-main)" }}>Nguồn nội dung (Mô tả) *</label>
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    required
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-main)" }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
                  <label style={{ fontWeight: 600, color: "var(--text-main)" }}>Trạng thái hoạt động</label>
                  <ToggleSwitch id="edit-active" label="" checked={editIsActive} onChange={(value) => setEditIsActive(value)} />
                </div>

                {/* Reselect content button */}
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", marginTop: "8px" }}>
                  <button
                    type="button"
                    onClick={handleSelectNewContent}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      background: "rgba(59, 130, 246, 0.1)",
                      color: "var(--primary)",
                      border: "1px solid rgba(59, 130, 246, 0.3)",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    Chọn lại nội dung liên kết (Tạo payload mới)
                  </button>
                </div>

                {/* Technical Info Accordion */}
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px", marginTop: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setShowTechInfo(!showTechInfo)}
                    style={{
                      background: "none",
                      border: "none",
                      width: "100%",
                      textAlign: "left",
                      padding: "4px 0",
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>Thông tin kỹ thuật dành cho lập trình viên</span>
                    <span>{showTechInfo ? "▲" : "▼"}</span>
                  </button>

                  {showTechInfo && (
                    <div style={{
                      marginTop: "10px",
                      padding: "12px",
                      background: "var(--bg-main)",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      fontSize: "13px"
                    }}>
                      <div style={{ fontStyle: "italic", color: "var(--text-muted)", marginBottom: "4px" }}>
                        ℹ️ Phần này chỉ dùng để kiểm tra kỹ thuật. Admin thông thường không cần chỉnh sửa hoặc quan tâm đến các thông tin này.
                      </div>
                      <div>
                        <span style={{ color: "var(--text-muted)", display: "inline-block", width: "180px" }}>Mã bản ghi hệ thống:</span>
                        <code style={{ color: "var(--text-main)", fontWeight: "bold" }}>{editingItem.id}</code>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-muted)", display: "inline-block", width: "180px" }}>Loại thẻ:</span>
                        <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
                          {BUSINESS_TYPE_LABELS[editingItem.tagType] || editingItem.tagType}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-muted)", display: "inline-block", width: "180px" }}>Kiểu liên kết:</span>
                        <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
                          {editingItem.targetType === "RAW_VALUE" ? "Dùng nội dung ghi trong thẻ" :
                            editingItem.targetType === "FLASHCARD" ? "Liên kết Flashcard" :
                              editingItem.targetType === "ANSWER_OPTION" || editingItem.targetType === "ANSWER_VALUE" ? "Liên kết đáp án" :
                                editingItem.targetType === "PECS_CARD" ? "Liên kết thẻ PECS" :
                                  editingItem.targetType === "NUMBER_ITEM" ? "Liên kết số học" :
                                    editingItem.targetType === "NUMBER_EXAMPLE" ? "Liên kết ví dụ số" :
                                      editingItem.targetType === "SHAPE_ITEM" ? "Liên kết hình khối" :
                                        editingItem.targetType === "SHAPE_EXAMPLE" ? "Liên kết ví dụ hình" :
                                          editingItem.targetType || "Dùng nội dung ghi trong thẻ"}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-muted)", display: "inline-block", width: "180px" }}>Mã nội dung liên kết:</span>
                        <code style={{ color: "var(--text-main)" }}>{editingItem.targetId || "Không có"}</code>
                      </div>
                      <div>
                        <span style={{ color: "var(--text-muted)", display: "inline-block", width: "180px" }}>UID vật lý cũ:</span>
                        <code style={{ color: "var(--text-main)" }}>{editingItem.tagUid || "Không sử dụng"}</code>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Modal Footer */}
              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setEditingItem(null)}
                  disabled={saving}
                  style={{ padding: "10px 16px", borderRadius: "8px", cursor: "pointer" }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    background: "var(--primary)",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600
                  }}
                >
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Helpers
function getQuestionsForLibrary(
  library: QuestionLibrary,
  questions: MathQuestionSource[],
  lessons: LessonSource[]
): MathQuestionSource[] {
  return questions.filter((question) => getQuestionLibrary(question, lessons) === library);
}

function getQuestionForLibrary(
  questionId: string,
  library: QuestionLibrary,
  questions: MathQuestionSource[],
  lessons: LessonSource[]
): MathQuestionSource | undefined {
  return getQuestionsForLibrary(library, questions, lessons).find((question) => question.id === questionId);
}

function getQuestionAnswerOptions(question: MathQuestionSource) {
  return [
    { key: "A", text: question.optionA ?? "" },
    { key: "B", text: question.optionB ?? "" },
    { key: "C", text: question.optionC ?? "" },
    { key: "D", text: question.optionD ?? "" },
  ].filter((option) => option.text.trim().length > 0);
}

function getQuestionAnswerText(question: MathQuestionSource, answerKey: string) {
  const options = {
    A: question.optionA ?? "",
    B: question.optionB ?? "",
    C: question.optionC ?? "",
    D: question.optionD ?? "",
  } as Record<string, string>;
  return options[answerKey]?.trim() || "";
}

function getQuestionLibrary(question: MathQuestionSource, lessons: LessonSource[]) {
  const category = `${question.category ?? ""}`.trim().toUpperCase();
  if (QUESTION_LIBRARY_OPTIONS.includes(category as QuestionLibrary)) {
    return category as QuestionLibrary;
  }

  const lesson = lessons.find((item) => item.id === question.lessonId);
  const lessonType = `${lesson?.type ?? "MATH"}`.trim().toUpperCase();
  if (QUESTION_LIBRARY_OPTIONS.includes(lessonType as QuestionLibrary)) {
    return lessonType as QuestionLibrary;
  }

  return "MATH";
}

function buildFlashcardSpeech(frontText: string, backText: string) {
  const front = frontText.trim();
  const back = backText.trim();
  if (!front && !back) return "";
  if (!back) return front;
  if (!front) return back;
  return `${ensureSentence(front)} ... ${back}`;
}

function buildNumberSpeech(numberValue: number) {
  return `Đây là số ${NUMBER_WORDS[numberValue] ?? numberValue}.`;
}

function formatShapeDisplayName(shapeName: string) {
  const trimmed = shapeName.trim();
  if (!trimmed) return "Hình";
  if (trimmed.toLowerCase().startsWith("hình ")) return trimmed;
  return `Hình ${trimmed}`;
}

function normalizeSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "D")
    .toUpperCase()
    .replace(/[^A-Z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function deriveShapeCode(shapeName: string) {
  const normalized = normalizeComparable(shapeName);
  if (normalized.includes("tron") || normalized.includes("circle")) return "CIRCLE";
  if (normalized.includes("vuong") || normalized.includes("square")) return "SQUARE";
  if (normalized.includes("tamgiac") || normalized.includes("triangle")) return "TRIANGLE";
  if (normalized.includes("chunhat") || normalized.includes("rectangle")) return "RECTANGLE";
  if (normalized.includes("sao") || normalized.includes("star")) return "STAR";
  if (normalized.includes("traitim") || normalized.includes("heart")) return "HEART";
  if (normalized.includes("bauduc") || normalized.includes("oval")) return "OVAL";
  return normalizeSlug(shapeName);
}

function normalizeComparable(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]/g, "");
}

function ensureSentence(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}
