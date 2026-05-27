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
type ManualTargetType = "ANSWER_OPTION" | "ANSWER_VALUE" | "FLASHCARD" | "RAW_VALUE";
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
          item.displayName.toLowerCase().includes(q) ||
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
      { value: "displayName", label: "Tên hiển thị", getValue: (item) => item.displayName },
      { value: "spokenText", label: "Nội dung đọc", getValue: (item) => item.spokenText || "" },
      { value: "payloadValue", label: "Nội dung ghi vào thẻ", getValue: (item) => item.payloadValue || "" },
      { value: "description", label: "Nguồn nội dung", getValue: (item) => item.description || "" },
      { value: "status", label: "Trạng thái", getValue: (item) => item.isActive },
    ],
    "displayName"
  );

  const openGuidedEdit = (item: NfcTagRecord) => {
    setEditingItem(item);
    setEditDisplayName(item.displayName);
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
    const targetType = editingItem.targetType;

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

    if (!editDisplayName.trim()) {
      setErrors({ displayName: "Tên hiển thị không được để trống." });
      return;
    }

    setSaving(true);
    try {
      await adminApi.update("/nfc-tags", editingItem.id, {
        displayName: editDisplayName.trim(),
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
  const answerQuestion = getQuestionForLibrary(guidedDraft.questionId, guidedDraft.questionLibrary, mathQuestions, lessons);
  const answerOptions = answerQuestion ? getQuestionAnswerOptions(answerQuestion) : [];
  const selectedFlashcard = flashcards.find((item) => item.id === guidedDraft.flashcardId);
  const selectedNumberItem = numberItems.find((item) => item.id === guidedDraft.numberItemId);
  const selectedNumberExample = numberExamples.find((item) => item.id === guidedDraft.numberExampleId);
  const selectedShapeItem = shapeItems.find((item) => item.id === guidedDraft.shapeItemId);
  const selectedShapeExample = shapeExamples.find((item) => item.id === guidedDraft.shapeExampleId);
  const selectedPecsCard = pecsCards.find((item) => item.id === guidedDraft.pecsCardId);

  return (
    <div style={{ padding: "8px 0" }}>
      <div className="toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, background: "linear-gradient(135deg, #1e3a8a, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Quản lý thẻ NFC
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: "4px", fontSize: "14px" }}>
            Các thẻ NFC sẽ lưu nội dung logic độc lập (NDEF payload) thay thế cho mã UID vật lý.
          </p>
        </div>
      </div>

      <div className="tab-nav" style={{ display: "flex", gap: "12px", borderBottom: "1px solid var(--border)", marginBottom: "24px" }}>
        <button
          className={`tab-btn ${activeTab === "LIST" ? "active" : ""}`}
          onClick={() => setActiveTab("LIST")}
          style={{ padding: "12px 16px", fontSize: "15px", borderBottom: activeTab === "LIST" ? "2px solid var(--primary)" : "none", fontWeight: 600, background: "none", cursor: "pointer", color: activeTab === "LIST" ? "var(--primary)" : "var(--text-muted)" }}
        >
          🗂️ Danh sách thẻ
        </button>
        <button
          className={`tab-btn ${activeTab === "GUIDED" ? "active" : ""}`}
          onClick={() => setActiveTab("GUIDED")}
          style={{ padding: "12px 16px", fontSize: "15px", borderBottom: activeTab === "GUIDED" ? "2px solid var(--primary)" : "none", fontWeight: 600, background: "none", cursor: "pointer", color: activeTab === "GUIDED" ? "var(--primary)" : "var(--text-muted)" }}
        >
          🧩 Tạo thẻ theo nội dung
        </button>
      </div>

      {activeTab === "LIST" && renderListView()}
      {activeTab === "GUIDED" && renderGuidedView()}

      {/* Modern Clean Edit Modal */}
      {editingItem && (
        <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0, 0, 0, 0.4)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div className="modal-content" style={{ background: "white", padding: "24px", borderRadius: "16px", width: "640px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "14px", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "20px" }}>Cập nhật thẻ NFC</h2>
              <button style={{ border: "none", background: "none", fontSize: "24px", cursor: "pointer" }} onClick={() => setEditingItem(null)}>&times;</button>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", gap: "12px" }}>
                  <div className="field" style={{ flex: 1 }}>
                    <label style={{ fontWeight: 600, display: "block", marginBottom: "6px" }}>Loại thẻ</label>
                    <input type="text" readOnly value={TAG_TYPE_LABELS[editingItem.tagType] || editingItem.tagType} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "#f8fafc" }} />
                  </div>
                  <div className="field" style={{ flex: 1 }}>
                    <label style={{ fontWeight: 600, display: "block", marginBottom: "6px" }}>Nội dung ghi vào thẻ</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input type="text" readOnly value={editingItem.payloadValue || "—"} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "#f8fafc", fontFamily: "monospace", fontWeight: "bold" }} />
                      <button
                        type="button"
                        onClick={() => {
                          if (editingItem.payloadValue) {
                            navigator.clipboard.writeText(editingItem.payloadValue);
                            alert("Đã copy: " + editingItem.payloadValue);
                          }
                        }}
                        style={{ padding: "8px 12px", borderRadius: "8px", cursor: "pointer", border: "1px solid var(--border)" }}
                      >
                        📋
                      </button>
                    </div>
                  </div>
                </div>

                <div className="field">
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "6px" }}>Tên hiển thị *</label>
                  <input
                    type="text"
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                    required
                  />
                  {errors.displayName && <span className="error-msg" style={{ color: "red", fontSize: "13px" }}>{errors.displayName}</span>}
                </div>

                <div className="field">
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "6px" }}>Nội dung phát âm (TTS) khi quét thẻ</label>
                  <textarea
                    value={editSpokenText}
                    onChange={(e) => setEditSpokenText(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", minHeight: "80px" }}
                  />
                </div>

                <div className="field">
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "6px" }}>Mô tả / Ghi chú</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", minHeight: "60px" }}
                  />
                </div>

                <div className="field" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontWeight: 600 }}>Trạng thái hoạt động</label>
                  <ToggleSwitch id="edit-active" label="" checked={editIsActive} onChange={setEditIsActive} />
                </div>

                <div style={{ marginTop: "12px", border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                  <button
                    type="button"
                    onClick={() => setShowTechInfo(!showTechInfo)}
                    style={{ width: "100%", padding: "10px 14px", textAlign: "left", background: "#f8fafc", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", fontWeight: 600 }}
                  >
                    <span>🛠️ Thông tin kỹ thuật</span>
                    <span>{showTechInfo ? "▲" : "▼"}</span>
                  </button>
                  {showTechInfo && (
                    <div style={{ padding: "14px", borderTop: "1px solid #e2e8f0", background: "#fafafa", fontSize: "14px", display: "grid", gap: "8px" }}>
                      <div><strong>UID vật lý cũ:</strong> <code>{editingItem.tagUid || "— (Chỉ lưu logic)"}</code></div>
                      <div><strong>Target Type:</strong> <code>{editingItem.targetType}</code></div>
                      <div><strong>Target ID:</strong> <code>{editingItem.targetId || "—"}</code></div>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "12px", background: "#fffbeb", border: "1px solid #fef3c7", padding: "14px", borderRadius: "10px", marginTop: "12px" }}>
                  <div style={{ fontSize: "20px" }}>⚠️</div>
                  <div>
                    <strong style={{ display: "block", color: "#b45309", marginBottom: "4px" }}>Muốn đổi nội dung liên kết?</strong>
                    <span style={{ fontSize: "13px", color: "#78350f" }}>
                      Để thay đổi liên kết logic sang đối tượng khác, bạn cần chọn lại nội dung. Việc này có thể đổi mã payload ghi thẻ.
                    </span>
                    <button
                      type="button"
                      onClick={handleSelectNewContent}
                      style={{ display: "block", marginTop: "8px", background: "#f59e0b", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
                    >
                      🔄 Chọn lại nội dung
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: "1px solid var(--border)", paddingTop: "14px", marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" className="secondary" onClick={() => setEditingItem(null)} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--border)", background: "none", cursor: "pointer" }}>Hủy</button>
                <button type="submit" disabled={saving} style={{ padding: "8px 16px", borderRadius: "8px", background: "var(--primary)", color: "white", border: "none", cursor: "pointer", fontWeight: 600 }}>
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  function renderListView() {
    return (
      <>
        <div className="panel" style={{ padding: "16px", marginBottom: "16px", display: "flex", gap: "12px", flexWrap: "wrap", background: "#f8fafc", borderRadius: "12px", border: "1px solid var(--border)" }}>
          <input
            type="text"
            placeholder="Tìm theo tên thẻ, nội dung đọc, nội dung ghi vào thẻ…"
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
                    <th>Tên hiển thị</th>
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
                      <td style={{ fontWeight: 600 }}>{item.displayName}</td>
                      <td style={{ color: "var(--text-muted)", fontSize: "14px" }}>{item.spokenText || "—"}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <code style={{ background: "#ecfdf5", color: "#065f46", padding: "4px 8px", borderRadius: "6px", fontWeight: "bold", fontFamily: "monospace", fontSize: "13px" }}>
                            {item.payloadValue || "—"}
                          </code>
                          {item.payloadValue && (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(item.payloadValue || "");
                                alert("Đã copy: " + item.payloadValue);
                              }}
                              style={{ border: "none", background: "none", cursor: "pointer", padding: "2px 4px", fontSize: "14px" }}
                              title="Copy Payload"
                            >
                              📋
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
        <div className="panel" style={{ padding: "20px", border: "1px solid var(--border)", borderRadius: "12px", background: "white", display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Step 1: Choose Tag Type */}
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
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
                    style={{
                      padding: "16px 12px",
                      borderRadius: "10px",
                      border: isSelected ? "2px solid var(--primary)" : "1.5px solid var(--border)",
                      background: isSelected ? "rgba(59,130,246,0.05)" : "white",
                      cursor: "pointer",
                      textAlign: "center",
                      transition: "all 0.2s",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    <span style={{ fontSize: "24px" }}>
                      {type === "ANSWER" ? "📝" : type === "FLASHCARD" ? "🎴" : type === "NUMBER" ? "🔢" : type === "SHAPE" ? "📐" : "💬"}
                    </span>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: isSelected ? "var(--primary)" : "var(--text-main)" }}>
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
            <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ background: "var(--primary)", color: "white", borderRadius: "50%", width: "24px", height: "24px", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "13px" }}>2</span>
              Chọn nội dung liên kết
            </h3>

            {/* Answer (Đáp án) selector workflow */}
            {guidedDraft.businessType === "ANSWER" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="field">
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "6px" }}>Chọn thư viện câu hỏi *</label>
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
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                  >
                    {QUESTION_LIBRARY_OPTIONS.map((library) => (
                      <option key={library} value={library}>
                        {QUESTION_LIBRARY_LABELS[library]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "6px" }}>Chọn câu hỏi nguồn *</label>
                  <div style={{ marginBottom: "8px" }}>
                    <input
                      type="text"
                      placeholder="Tìm nhanh câu hỏi..."
                      value={questionSearch}
                      onChange={(e) => setQuestionSearch(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "14px" }}
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
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", maxHeight: "160px" }}
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
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "6px" }}>Chọn một đáp án *</label>
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
                            background: guidedDraft.answerKey === option.key ? "rgba(59,130,246,0.05)" : "white",
                            padding: "12px",
                            cursor: "pointer"
                          }}
                        >
                          <div style={{ fontWeight: 700, color: "var(--primary)" }}>Option {option.key}</div>
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
                    style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
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
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "10px 14px",
                            borderBottom: "1px solid var(--border)",
                            background: isSelected ? "rgba(59,130,246,0.04)" : "white",
                            cursor: "pointer"
                          }}
                        >
                          {card.imageUrl ? (
                            <img src={card.imageUrl} alt="" style={{ width: "40px", height: "40px", objectFit: "contain", borderRadius: "4px", background: "#f8fafc" }} />
                          ) : (
                            <div style={{ width: "40px", height: "40px", background: "#f1f5f9", borderRadius: "4px", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "16px" }}>🎴</div>
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>{card.frontText}</div>
                            <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>{card.backText}</div>
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
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "6px" }}>Chọn kiểu thẻ số *</label>
                  <div style={{ display: "flex", gap: "10px" }}>
                    {(["CARD", "EXAMPLE"] as NumberSubtype[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setGuidedDraft(curr => ({ ...curr, numberSubtype: st, numberItemId: "", numberExampleId: "" }))}
                        style={{
                          flex: 1,
                          padding: "10px",
                          borderRadius: "8px",
                          border: guidedDraft.numberSubtype === st ? "2px solid var(--primary)" : "1px solid var(--border)",
                          background: guidedDraft.numberSubtype === st ? "rgba(59,130,246,0.04)" : "white",
                          cursor: "pointer",
                          fontWeight: 600
                        }}
                      >
                        {st === "CARD" ? "🔢 Thẻ số gốc (0-10)" : "🍎 Thẻ ví dụ đếm số"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "6px" }}>Chọn số liên kết *</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px" }}>
                    {numberItems.map((n) => {
                      const isSelected = guidedDraft.numberItemId === n.id;
                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => setGuidedDraft(curr => ({ ...curr, numberItemId: n.id, numberExampleId: "" }))}
                          style={{
                            padding: "10px 4px",
                            borderRadius: "8px",
                            border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border)",
                            background: isSelected ? "rgba(59,130,246,0.05)" : "white",
                            fontWeight: 700,
                            fontSize: "15px",
                            cursor: "pointer"
                          }}
                        >
                          {n.numberValue}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {guidedDraft.numberSubtype === "EXAMPLE" && selectedNumberItem && (
                  <div className="field">
                    <label style={{ fontWeight: 600, display: "block", marginBottom: "6px" }}>Chọn hình ảnh ví dụ liên kết *</label>
                    <div style={{ display: "grid", gap: "8px", maxHeight: "180px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "8px", padding: "6px" }}>
                      {numberExamples
                        .filter(e => e.numberItemId === selectedNumberItem.id)
                        .map(ex => {
                          const isSelected = guidedDraft.numberExampleId === ex.id;
                          return (
                            <div
                              key={ex.id}
                              onClick={() => setGuidedDraft(curr => ({ ...curr, numberExampleId: ex.id }))}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "8px",
                                borderRadius: "6px",
                                background: isSelected ? "rgba(59,130,246,0.05)" : "white",
                                cursor: "pointer",
                                border: isSelected ? "1.5px solid var(--primary)" : "1px solid transparent"
                              }}
                            >
                              {ex.imageUrl ? (
                                <img src={ex.imageUrl} alt="" style={{ width: "32px", height: "32px", objectFit: "contain", borderRadius: "4px" }} />
                              ) : (
                                <div style={{ width: "32px", height: "32px", background: "#f1f5f9", borderRadius: "4px" }} />
                              )}
                              <span style={{ fontSize: "14px" }}>{ex.exampleText}</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Shape selector workflow */}
            {guidedDraft.businessType === "SHAPE" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="field">
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "6px" }}>Chọn kiểu thẻ hình học *</label>
                  <div style={{ display: "flex", gap: "10px" }}>
                    {(["CARD", "EXAMPLE"] as ShapeSubtype[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setGuidedDraft(curr => ({ ...curr, shapeSubtype: st, shapeItemId: "", shapeExampleId: "" }))}
                        style={{
                          flex: 1,
                          padding: "10px",
                          borderRadius: "8px",
                          border: guidedDraft.shapeSubtype === st ? "2px solid var(--primary)" : "1px solid var(--border)",
                          background: guidedDraft.shapeSubtype === st ? "rgba(59,130,246,0.04)" : "white",
                          cursor: "pointer",
                          fontWeight: 600
                        }}
                      >
                        {st === "CARD" ? "📐 Thẻ hình gốc" : "🏠 Thẻ vật thể hình học"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "6px" }}>Chọn hình học gốc *</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                    {shapeItems.map((s) => {
                      const isSelected = guidedDraft.shapeItemId === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setGuidedDraft(curr => ({ ...curr, shapeItemId: s.id, shapeExampleId: "" }))}
                          style={{
                            padding: "10px 4px",
                            borderRadius: "8px",
                            border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border)",
                            background: isSelected ? "rgba(59,130,246,0.05)" : "white",
                            fontWeight: 600,
                            fontSize: "13px",
                            cursor: "pointer"
                          }}
                        >
                          {formatShapeDisplayName(s.shapeName)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {guidedDraft.shapeSubtype === "EXAMPLE" && selectedShapeItem && (
                  <div className="field">
                    <label style={{ fontWeight: 600, display: "block", marginBottom: "6px" }}>Chọn ví dụ hình ảnh liên kết *</label>
                    <div style={{ display: "grid", gap: "8px", maxHeight: "180px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "8px", padding: "6px" }}>
                      {shapeExamples
                        .filter(e => e.shapeItemId === selectedShapeItem.id)
                        .map(ex => {
                          const isSelected = guidedDraft.shapeExampleId === ex.id;
                          return (
                            <div
                              key={ex.id}
                              onClick={() => setGuidedDraft(curr => ({ ...curr, shapeExampleId: ex.id }))}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "8px",
                                borderRadius: "6px",
                                background: isSelected ? "rgba(59,130,246,0.05)" : "white",
                                cursor: "pointer",
                                border: isSelected ? "1.5px solid var(--primary)" : "1px solid transparent"
                              }}
                            >
                              {ex.imageUrl ? (
                                <img src={ex.imageUrl} alt="" style={{ width: "32px", height: "32px", objectFit: "contain", borderRadius: "4px" }} />
                              ) : (
                                <div style={{ width: "32px", height: "32px", background: "#f1f5f9", borderRadius: "4px" }} />
                              )}
                              <span style={{ fontSize: "14px" }}>{ex.exampleText}</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PECS cards selector workflow */}
            {guidedDraft.businessType === "PECS" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="field">
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "6px" }}>Chọn nhóm nội dung PECS *</label>
                  <select
                    value={guidedDraft.pecsCategory}
                    onChange={(event) =>
                      setGuidedDraft((current) => ({
                        ...current,
                        pecsCategory: event.target.value as PecsCategory,
                        pecsCardId: "",
                      }))
                    }
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                  >
                    {PECS_CATEGORY_OPTIONS.map((category) => (
                      <option key={category} value={category}>
                        {PECS_CATEGORY_LABELS[category]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "6px" }}>Chọn thẻ PECS *</label>
                  <select
                    value={guidedDraft.pecsCardId}
                    onChange={(event) => setGuidedDraft((current) => ({ ...current, pecsCardId: event.target.value }))}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
                  >
                    <option value="">-- Chọn thẻ PECS --</option>
                    {pecsCards
                      .filter((card) => card.category === guidedDraft.pecsCategory)
                      .map((card) => (
                        <option key={card.id} value={card.id}>
                          {card.title}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--border)" }} />

          {/* Active toggle switch */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label style={{ fontWeight: 600 }}>Tự động kích hoạt thẻ khi lưu</label>
            <ToggleSwitch id="guided-active" label="" checked={guidedDraft.isActive} onChange={(value) => setGuidedDraft((current) => ({ ...current, isActive: value }))} />
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button type="button" className="secondary" onClick={resetGuidedForm} disabled={saving} style={{ padding: "10px 16px", borderRadius: "8px", cursor: "pointer" }}>
              Làm mới
            </button>
            <button type="button" onClick={handleGuidedSubmit} disabled={saving || !guidedPreview} style={{ padding: "10px 20px", borderRadius: "8px", background: guidedPreview ? "var(--primary)" : "#cbd5e1", color: "white", border: "none", cursor: guidedPreview ? "pointer" : "not-allowed", fontWeight: 600 }}>
              {saving ? "Đang lưu..." : "Lưu thẻ NFC"}
            </button>
          </div>
        </div>

        {/* Right column - visual premium preview card */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Xem trước thẻ NFC sinh ra</h3>
          
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
                <div style={{ fontSize: "13px", color: "#94a3b8" }}>Tên hiển thị:</div>
                <div style={{ fontSize: "18px", fontWeight: 700, marginTop: "2px" }}>{guidedPreview.displayName}</div>
              </div>

              <div>
                <div style={{ fontSize: "13px", color: "#94a3b8" }}>Nội dung TTS sẽ đọc:</div>
                <div style={{ fontSize: "14px", marginTop: "2px", color: "#cbd5e1" }}>"{guidedPreview.spokenText}"</div>
              </div>

              <div>
                <div style={{ fontSize: "13px", color: "#94a3b8" }}>Mô tả nguồn:</div>
                <div style={{ fontSize: "13px", marginTop: "2px", color: "#cbd5e1" }}>{guidedPreview.sourceLabel}</div>
              </div>

              <div style={{ borderTop: "1.5px dashed rgba(255,255,255,0.15)", paddingTop: "14px", marginTop: "4px" }}>
                <div style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "6px" }}>Mã Payload (NDEF Text):</div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <code style={{ flex: 1, background: "rgba(255,255,255,0.08)", padding: "8px 12px", borderRadius: "6px", fontSize: "14px", fontWeight: "bold", fontFamily: "monospace", color: "#34d399", overflowX: "auto" }}>
                    {guidedPreview.payloadValue}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(guidedPreview.payloadValue);
                      alert("Đã copy mã payload: " + guidedPreview.payloadValue);
                    }}
                    style={{ background: "#3b82f6", color: "white", border: "none", padding: "8px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "8px", padding: "10px", fontSize: "12px", color: "#fef08a", marginTop: "8px" }}>
                💡 <strong>Hướng dẫn nạp thẻ:</strong> Lưu thẻ này lại, mở ứng dụng <strong>NFC Tools</strong> &gt; chọn <strong>Write</strong> &gt; chọn <strong>Add a record</strong> &gt; chọn <strong>Text</strong>. Dán mã payload trên vào rồi ghi đè lên thẻ NFC vật lý của bé.
              </div>
            </div>
          ) : (
            <div style={{ padding: "40px 20px", textAlign: "center", border: "1.5px dashed var(--border)", borderRadius: "16px", color: "var(--text-muted)", background: "#fafafa" }}>
              Vui lòng chọn đầy đủ thông tin ở cột bên trái để hiển thị thẻ xem trước NFC.
            </div>
          )}
        </div>
      </div>
    );
  }
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
