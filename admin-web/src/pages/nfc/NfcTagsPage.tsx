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
type TabName = "LIST" | "GUIDED" | "MANUAL";

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

interface ManualDraft {
  tagUid: string;
  displayName: string;
  tagType: BusinessType;
  targetType: ManualTargetType;
  targetId: string;
  payloadValue: string;
  spokenText: string;
  description: string;
  isActive: boolean;
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
}

const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  ANSWER: "Đáp án",
  FLASHCARD: "Flashcard",
  NUMBER: "Số học",
  SHAPE: "Hình khối",
  PECS: "Giao tiếp hình ảnh",
  GENERIC: "Khác / thủ công",
};

const QUESTION_LIBRARY_LABELS: Record<QuestionLibrary, string> = {
  MATH: "Thư viện câu hỏi toán",
  THINKING: "Thư viện tư duy",
  SPELLING: "Thư viện đánh vần",
  RHYME: "Thư viện ghép vần",
};

const QUESTION_LIBRARY_OPTIONS = Object.keys(QUESTION_LIBRARY_LABELS) as QuestionLibrary[];
const BUSINESS_TYPE_OPTIONS = Object.keys(BUSINESS_TYPE_LABELS) as BusinessType[];

const PECS_CATEGORY_LABELS: Record<PecsCategory, string> = {
  EMOTION: "Cảm xúc",
  DAILY_ACTIVITY: "Sinh hoạt hằng ngày",
  NON_TOPIC: "Non-topic",
};

const PECS_CATEGORY_OPTIONS = Object.keys(PECS_CATEGORY_LABELS) as PecsCategory[];
const NUMBER_SUBTYPE_LABELS: Record<NumberSubtype, string> = {
  CARD: "Thẻ số",
  EXAMPLE: "Ví dụ số",
};
const NUMBER_SUBTYPE_OPTIONS = Object.keys(NUMBER_SUBTYPE_LABELS) as NumberSubtype[];

const SHAPE_SUBTYPE_LABELS: Record<ShapeSubtype, string> = {
  CARD: "Thẻ hình",
  EXAMPLE: "Ví dụ hình",
};
const SHAPE_SUBTYPE_OPTIONS = Object.keys(SHAPE_SUBTYPE_LABELS) as ShapeSubtype[];

const TAG_TYPE_LABELS: Record<string, string> = {
  ANSWER: "Đáp án",
  FLASHCARD: "Flashcard",
  NUMBER: "Số học",
  SHAPE: "Hình khối",
  PECS: "Giao tiếp hình ảnh",
  GENERIC: "Khác",
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  ANSWER_OPTION: "Lựa chọn đáp án",
  ANSWER_VALUE: "Giá trị đáp án",
  FLASHCARD: "Flashcard",
  RAW_VALUE: "Giá trị thô",
};

const MANUAL_TARGET_TYPES: ManualTargetType[] = ["ANSWER_OPTION", "ANSWER_VALUE", "FLASHCARD", "RAW_VALUE"];

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

const EMPTY_MANUAL_DRAFT: ManualDraft = {
  tagUid: "",
  displayName: "",
  tagType: "ANSWER",
  targetType: "ANSWER_VALUE",
  targetId: "",
  payloadValue: "",
  spokenText: "",
  description: "",
  isActive: true,
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
  const [editingItem, setEditingItem] = useState<NfcTagRecord | null>(null);

  const [lessons, setLessons] = useState<LessonSource[]>([]);
  const [mathQuestions, setMathQuestions] = useState<MathQuestionSource[]>([]);
  const [flashcards, setFlashcards] = useState<FlashcardSource[]>([]);
  const [numberItems, setNumberItems] = useState<NumberItemSource[]>([]);
  const [numberExamples, setNumberExamples] = useState<NumberExampleSource[]>([]);
  const [shapeItems, setShapeItems] = useState<ShapeItemSource[]>([]);
  const [shapeExamples, setShapeExamples] = useState<ShapeExampleSource[]>([]);
  const [pecsCards, setPecsCards] = useState<PecsCardSource[]>([]);

  const [guidedDraft, setGuidedDraft] = useState<GuidedDraft>(EMPTY_GUIDED_DRAFT);
  const [manualDraft, setManualDraft] = useState<ManualDraft>(EMPTY_MANUAL_DRAFT);

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
          item.tagUid.toLowerCase().includes(q) ||
          item.displayName.toLowerCase().includes(q) ||
          (item.payloadValue ?? "").toLowerCase().includes(q) ||
          (item.spokenText ?? "").toLowerCase().includes(q) ||
          (item.description ?? "").toLowerCase().includes(q)
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
      { value: "displayName", label: "Tên hiển thị", getValue: (item) => item.displayName },
      { value: "tagUid", label: "UID", getValue: (item) => item.tagUid },
      { value: "tagType", label: "Loại", getValue: (item) => BUSINESS_TYPE_LABELS[item.tagType] || item.tagType },
      { value: "spokenText", label: "Nội dung đọc", getValue: (item) => item.spokenText || "" },
      { value: "payloadValue", label: "Giá trị lưu", getValue: (item) => item.payloadValue || "" },
      { value: "status", label: "Trạng thái", getValue: (item) => item.isActive },
    ],
    "displayName"
  );

  const openManualCreate = () => {
    setEditingItem(null);
    setManualDraft(EMPTY_MANUAL_DRAFT);
    setErrors({});
    setActiveTab("MANUAL");
  };

  const openManualEdit = (item: NfcTagRecord) => {
    setEditingItem(item);
    setManualDraft({
      tagUid: item.tagUid || "",
      displayName: item.displayName || "",
      tagType: item.tagType || "GENERIC",
      targetType: normalizeManualTargetType(item.targetType),
      targetId: item.targetId || "",
      payloadValue: item.payloadValue || "",
      spokenText: item.spokenText || "",
      description: item.description || "",
      isActive: item.isActive !== false,
    });
    setErrors({});
    setActiveTab("MANUAL");
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

  const validateTagUid = (tagUid: string) => {
    const trimmed = tagUid.trim();
    if (!trimmed) {
      return "UID thẻ NFC không được để trống.";
    }

    const duplicate = items.find(
      (item) => item.tagUid.trim().toLowerCase() === trimmed.toLowerCase() && (!editingItem || item.id !== editingItem.id)
    );
    if (duplicate) {
      return "Mã UID thẻ này đã tồn tại trong hệ thống.";
    }

    return "";
  };

  const persistTag = async (payload: Record<string, any>) => {
    setSaving(true);
    try {
      if (editingItem) {
        await adminApi.update("/nfc-tags", editingItem.id, payload);
      } else {
        await adminApi.create("/nfc-tags", payload);
      }
      await loadData();
      setErrors({});
      setEditingItem(null);
    } finally {
      setSaving(false);
    }
  };

  const handleManualSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    const uidTrimmed = manualDraft.tagUid.trim();
    if (uidTrimmed) {
      const duplicate = items.find(
        (item) => item.tagUid && item.tagUid.trim().toLowerCase() === uidTrimmed.toLowerCase() && (!editingItem || item.id !== editingItem.id)
      );
      if (duplicate) {
        nextErrors.tagUid = "Mã UID thẻ này đã tồn tại trong hệ thống.";
      }
    }

    const payloadTrimmed = manualDraft.payloadValue.trim().toUpperCase();
    if (payloadTrimmed) {
      if (!payloadTrimmed.match(/^PHA_[A-Z0-9_]+$/)) {
        nextErrors.payloadValue = "Nội dung ghi thẻ không hợp lệ. Phải bắt đầu bằng 'PHA_' và chỉ chứa chữ hoa, số và gạch dưới.";
      } else {
        const duplicate = items.find(
          (item) => item.payloadValue && item.payloadValue.trim().toUpperCase() === payloadTrimmed && (!editingItem || item.id !== editingItem.id)
        );
        if (duplicate) {
          nextErrors.payloadValue = "Mã nội dung ghi thẻ này đã tồn tại.";
        }
      }
    }

    if (!uidTrimmed && !payloadTrimmed) {
      nextErrors.payloadValue = "Vui lòng nhập ít nhất UID vật lý hoặc nội dung ghi vào thẻ.";
    }

    if (!manualDraft.displayName.trim()) nextErrors.displayName = "Tên hiển thị không được để trống.";
    if (!manualDraft.tagType) nextErrors.tagType = "Loại thẻ không được để trống.";
    if (!manualDraft.targetType) nextErrors.targetType = "Kiểu mục tiêu không được để trống.";
    if (!manualDraft.spokenText.trim()) nextErrors.spokenText = "Nội dung đọc không được để trống.";

    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    await persistTag({
      tagUid: uidTrimmed || null,
      displayName: manualDraft.displayName.trim(),
      tagType: manualDraft.tagType,
      targetType: manualDraft.targetType,
      targetId: manualDraft.targetId.trim() || null,
      payloadValue: payloadTrimmed || null,
      spokenText: manualDraft.spokenText.trim(),
      description: manualDraft.description.trim() || null,
      isActive: manualDraft.isActive,
    });

    if (editingItem) {
      setActiveTab("LIST");
    } else {
      setManualDraft(EMPTY_MANUAL_DRAFT);
    }
  };

  const buildGuidedPreview = (): GuidedPreview | null => {
    if (guidedDraft.businessType === "GENERIC") return null;

    if (guidedDraft.businessType === "ANSWER") {
      const question = getQuestionForLibrary(guidedDraft.questionId, guidedDraft.questionLibrary, mathQuestions, lessons);
      if (!question || !guidedDraft.answerKey) return null;
      const answerText = getQuestionAnswerText(question, guidedDraft.answerKey);
      if (!answerText) return null;

      const sourceLabel = `${QUESTION_LIBRARY_LABELS[guidedDraft.questionLibrary]} · Câu hỏi: ${question.questionText} · Đáp án: ${answerText}`;
      return {
        tagType: "ANSWER",
        targetType: "ANSWER_VALUE",
        targetId: guidedDraft.answerKey,
        displayName: `Đáp án: ${answerText}`,
        spokenText: answerText,
        payloadValue: `PHA_ANSWER_${normalizeSlug(answerText)}`,
        description: `Tạo từ ${QUESTION_LIBRARY_LABELS[guidedDraft.questionLibrary]} - câu hỏi: ${question.questionText}`,
        sourceLabel,
        note: "Dùng chung cho nhiều câu hỏi có cùng đáp án.",
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
        description: `Tạo từ flashcard có mặt trước “${flashcard.frontText}” và mặt sau “${flashcard.backText}”.`,
        sourceLabel: `${flashcard.frontText} · ${flashcard.backText}`,
        note: "Một thẻ NFC dùng cho toàn bộ flashcard.",
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
          description: `Tạo từ thẻ số ${numberItem.numberValue} - ${numberItem.title}.`,
          sourceLabel: `${numberItem.numberValue} · ${numberItem.title}`,
          note: "Dùng cho nhận diện và trả lời số 0 đến 10.",
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
        description: `Tạo từ ví dụ của số ${numberItem.numberValue} - ${numberItem.title}.`,
        sourceLabel: `${numberItem.numberValue} · ${numberExample.exampleText}`,
        note: "Dùng cho ví dụ minh hoạ số học.",
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
          description: `Tạo từ thẻ ${shapeDisplayName.toLowerCase()}.`,
          sourceLabel: shapeDisplayName,
          note: "Dùng cho nhận diện hình khối và bài học nhập môn.",
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
        description: `Tạo từ ví dụ của ${shapeDisplayName.toLowerCase()}.`,
        sourceLabel: `${shapeDisplayName} · ${shapeExample.exampleText}`,
        note: "Dùng cho ví dụ minh hoạ hình khối.",
      };
    }

    const pecsCard = pecsCards.find((item) => item.id === guidedDraft.pecsCardId && item.category === guidedDraft.pecsCategory);
    if (!pecsCard) return null;
    return {
      tagType: "PECS",
      targetType: "RAW_VALUE",
      targetId: pecsCard.id,
      displayName: `PECS: ${pecsCard.title}`,
      spokenText: pecsCard.spokenText,
      payloadValue: `PHA_PECS_${pecsCard.category.toUpperCase()}_${normalizeSlug(pecsCard.title)}`,
      description: `Nhóm: ${PECS_CATEGORY_LABELS[pecsCard.category]}`,
      sourceLabel: `${PECS_CATEGORY_LABELS[pecsCard.category]} · ${pecsCard.title}`,
      note: "Chỉ dùng cho thẻ giao tiếp hình ảnh đúng nhóm.",
    };
  };

  const handleGuidedSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    const preview = buildGuidedPreview();
    if (!preview && guidedDraft.businessType !== "GENERIC") {
      nextErrors.preview = "Vui lòng chọn đủ dữ liệu nội dung trước khi lưu.";
    }
    if (guidedDraft.businessType === "GENERIC") {
      nextErrors.preview = "Hãy chuyển sang chế độ thủ công để tạo thẻ Khác / thủ công.";
    }

    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    if (!preview) return;

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
      tagUid: "",
      isActive: current.isActive,
    }));
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
    <div>
      <div className="toolbar" style={{ alignItems: "flex-start", gap: "16px" }}>
        <div>
          <h1>Quản lý thẻ NFC</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "4px" }}>
            Tạo và quản lý thẻ NFC cho đáp án, flashcard, số học, hình khối và PECS.
          </p>
        </div>
        <button onClick={openManualCreate}>➕ Tạo thẻ thủ công</button>
      </div>

      <div className="tab-nav">
        <button className={`tab-btn ${activeTab === "LIST" ? "active" : ""}`} onClick={() => setActiveTab("LIST")}>
          Danh sách thẻ
        </button>
        <button className={`tab-btn ${activeTab === "GUIDED" ? "active" : ""}`} onClick={() => setActiveTab("GUIDED")}>
          Tạo thẻ theo nội dung
        </button>
        <button className={`tab-btn ${activeTab === "MANUAL" ? "active" : ""}`} onClick={() => setActiveTab("MANUAL")}>
          Chế độ thủ công
        </button>
      </div>

      {activeTab === "LIST" && renderListView()}
      {activeTab === "GUIDED" && renderGuidedView()}
      {activeTab === "MANUAL" && renderManualView()}
    </div>
  );

  function renderListView() {
    return (
      <>
        <div className="panel" style={{ padding: "16px", marginBottom: "16px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Tìm theo UID, tên hiển thị, giá trị lưu hoặc nội dung đọc..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="search-input"
            style={{ flex: 1, minWidth: "260px" }}
          />

          <select
            value={filterTagType}
            onChange={(event) => setFilterTagType((event.target.value as BusinessType) || "")}
            style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)" }}
          >
            <option value="">-- Tất cả loại thẻ --</option>
            {BUSINESS_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {BUSINESS_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p>Đang tải danh sách thẻ NFC...</p>
        ) : filtered.length === 0 ? (
          <div className="panel" style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ color: "var(--text-muted)" }}>Không tìm thấy thẻ NFC nào.</p>
          </div>
        ) : (
          <>
            <TableControls {...table} />
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Loại</th>
                    <th>Tên hiển thị</th>
                    <th>Nội dung đọc</th>
                    <th>Nội dung ghi vào thẻ</th>
                    <th>UID vật lý</th>
                    <th style={{ width: "120px" }}>Trạng thái</th>
                    <th style={{ width: "150px" }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {table.pagedItems.map((item) => (
                    <tr key={item.id}>
                      <td><span className="badge info">{BUSINESS_TYPE_LABELS[item.tagType] || item.tagType}</span></td>
                      <td style={{ fontWeight: 600 }}>{item.displayName}</td>
                      <td style={{ color: "var(--text-muted)" }}>{item.spokenText || "—"}</td>
                      <td>
                        <code style={{ background: "#ecfdf5", color: "#065f46", padding: "4px 8px", borderRadius: "6px", fontWeight: "bold" }}>{item.payloadValue || "—"}</code>
                      </td>
                      <td>
                        {item.tagUid ? <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>{item.tagUid}</code> : <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>Không có (NDEF Only)</span>}
                      </td>
                      <td>
                        <span className={`badge ${item.isActive ? "active" : "inactive"}`}>
                          {item.isActive ? "Hoạt động" : "Tạm khóa"}
                        </span>
                      </td>
                      <td>
                        <div className="actions">
                          <button className="secondary" onClick={() => openManualEdit(item)}>Sửa</button>
                          <button className="danger" onClick={() => handleDelete(item.id)}>Xóa</button>
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
      <div className="panel" style={{ padding: "18px", display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(320px, 0.8fr)", gap: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="field">
            <label>Step 1. Chọn loại thẻ *</label>
            <select
              value={guidedDraft.businessType}
              onChange={(event) => handleGuidedTypeChange(event.target.value as BusinessType)}
            >
              {BUSINESS_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {BUSINESS_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
            <span className="helper">Chọn đúng loại nội dung để hệ thống tự sinh tên, giá trị lưu và nội dung đọc.</span>
          </div>

          {guidedDraft.businessType === "ANSWER" && (
            <>
              <div className="field">
                <label>Step 2. Chọn thư viện câu hỏi *</label>
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
                >
                  {QUESTION_LIBRARY_OPTIONS.map((library) => (
                    <option key={library} value={library}>
                      {QUESTION_LIBRARY_LABELS[library]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Step 3. Chọn câu hỏi *</label>
                <select
                  value={guidedDraft.questionId}
                  onChange={(event) =>
                    setGuidedDraft((current) => ({
                      ...current,
                      questionId: event.target.value,
                      answerKey: "",
                    }))
                  }
                >
                  <option value="">-- Chọn câu hỏi --</option>
                  {getQuestionsForLibrary(guidedDraft.questionLibrary, mathQuestions, lessons).map((question) => (
                    <option key={question.id} value={question.id}>
                      {question.questionText}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Step 4. Chọn đáp án *</label>
                <div style={{ display: "grid", gap: "10px" }}>
                  {answerOptions.length === 0 ? (
                    <div className="helper">Chọn một câu hỏi để thấy toàn bộ đáp án.</div>
                  ) : (
                    answerOptions.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setGuidedDraft((current) => ({ ...current, answerKey: option.key }))}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          borderRadius: "12px",
                          border: guidedDraft.answerKey === option.key ? "2px solid var(--primary)" : "1px solid var(--border)",
                          background: guidedDraft.answerKey === option.key ? "rgba(59,130,246,0.08)" : "white",
                          padding: "12px 14px",
                        }}
                      >
                        <strong style={{ display: "block", marginBottom: "4px" }}>{option.key}</strong>
                        <span>{option.text}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {guidedDraft.businessType === "FLASHCARD" && (
            <>
              <div className="field">
                <label>Step 2. Chọn flashcard *</label>
                <select
                  value={guidedDraft.flashcardId}
                  onChange={(event) => setGuidedDraft((current) => ({ ...current, flashcardId: event.target.value }))}
                >
                  <option value="">-- Chọn flashcard --</option>
                  {flashcards.map((flashcard) => (
                    <option key={flashcard.id} value={flashcard.id}>
                      {flashcard.frontText}
                    </option>
                  ))}
                </select>
              </div>

              {selectedFlashcard && (
                <div className="field">
                  <label>Step 3. Xem trước thẻ</label>
                  <div style={{ border: "1px solid var(--border)", borderRadius: "16px", padding: "16px", background: "#fff" }}>
                    <div style={{ fontWeight: 700, fontSize: "18px", marginBottom: "10px" }}>{selectedFlashcard.frontText}</div>
                    <div style={{ color: "var(--text-muted)", marginBottom: "10px" }}>{selectedFlashcard.backText}</div>
                    {selectedFlashcard.imageUrl && (
                      <img src={selectedFlashcard.imageUrl} alt={selectedFlashcard.frontText} style={{ maxWidth: "100%", maxHeight: "160px", objectFit: "contain", borderRadius: "12px" }} />
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {guidedDraft.businessType === "NUMBER" && (
            <>
              <div className="field">
                <label>Step 2. Chọn kiểu thẻ *</label>
                <select
                  value={guidedDraft.numberSubtype}
                  onChange={(event) =>
                    setGuidedDraft((current) => ({
                      ...current,
                      numberSubtype: event.target.value as NumberSubtype,
                      numberItemId: "",
                      numberExampleId: "",
                    }))
                  }
                >
                  {NUMBER_SUBTYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {NUMBER_SUBTYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Step 3. Chọn số *</label>
                <select
                  value={guidedDraft.numberItemId}
                  onChange={(event) =>
                    setGuidedDraft((current) => ({
                      ...current,
                      numberItemId: event.target.value,
                      numberExampleId: "",
                    }))
                  }
                >
                  <option value="">-- Chọn số --</option>
                  {numberItems.map((numberItem) => (
                    <option key={numberItem.id} value={numberItem.id}>
                      {numberItem.numberValue} - {numberItem.title}
                    </option>
                  ))}
                </select>
              </div>

              {guidedDraft.numberSubtype === "EXAMPLE" && selectedNumberItem && (
                <div className="field">
                  <label>Step 4. Chọn ví dụ *</label>
                  <select
                    value={guidedDraft.numberExampleId}
                    onChange={(event) => setGuidedDraft((current) => ({ ...current, numberExampleId: event.target.value }))}
                  >
                    <option value="">-- Chọn ví dụ --</option>
                    {numberExamples
                      .filter((example) => example.numberItemId === selectedNumberItem.id)
                      .map((example) => (
                        <option key={example.id} value={example.id}>
                          {example.exampleText}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {guidedDraft.numberSubtype === "CARD" && selectedNumberItem && (
                <div className="field">
                  <label>Step 4. Xem trước thẻ</label>
                  <div style={{ border: "1px solid var(--border)", borderRadius: "16px", padding: "16px", background: "#fff" }}>
                    <div style={{ fontSize: "42px", fontWeight: 800, color: "#f97316" }}>{selectedNumberItem.numberValue}</div>
                    <div style={{ fontWeight: 700, marginBottom: "8px" }}>{selectedNumberItem.title}</div>
                    {selectedNumberItem.imageUrl && <img src={selectedNumberItem.imageUrl} alt={selectedNumberItem.title} style={{ maxWidth: "100%", maxHeight: "140px", objectFit: "contain", borderRadius: "12px" }} />}
                  </div>
                </div>
              )}

              {guidedDraft.numberSubtype === "EXAMPLE" && selectedNumberItem && selectedNumberExample && (
                <div className="field">
                  <label>Step 5. Xem trước thẻ</label>
                  <div style={{ border: "1px solid var(--border)", borderRadius: "16px", padding: "16px", background: "#fff" }}>
                    <div style={{ fontWeight: 700, marginBottom: "8px" }}>{selectedNumberExample.exampleText}</div>
                    {selectedNumberExample.imageUrl && <img src={selectedNumberExample.imageUrl} alt={selectedNumberExample.exampleText} style={{ maxWidth: "100%", maxHeight: "140px", objectFit: "contain", borderRadius: "12px" }} />}
                  </div>
                </div>
              )}
            </>
          )}

          {guidedDraft.businessType === "SHAPE" && (
            <>
              <div className="field">
                <label>Step 2. Chọn kiểu thẻ *</label>
                <select
                  value={guidedDraft.shapeSubtype}
                  onChange={(event) =>
                    setGuidedDraft((current) => ({
                      ...current,
                      shapeSubtype: event.target.value as ShapeSubtype,
                      shapeItemId: "",
                      shapeExampleId: "",
                    }))
                  }
                >
                  {SHAPE_SUBTYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {SHAPE_SUBTYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Step 3. Chọn hình *</label>
                <select
                  value={guidedDraft.shapeItemId}
                  onChange={(event) =>
                    setGuidedDraft((current) => ({
                      ...current,
                      shapeItemId: event.target.value,
                      shapeExampleId: "",
                    }))
                  }
                >
                  <option value="">-- Chọn hình --</option>
                  {shapeItems.map((shapeItem) => (
                    <option key={shapeItem.id} value={shapeItem.id}>
                      {formatShapeDisplayName(shapeItem.shapeName)}
                    </option>
                  ))}
                </select>
              </div>

              {guidedDraft.shapeSubtype === "EXAMPLE" && selectedShapeItem && (
                <div className="field">
                  <label>Step 4. Chọn ví dụ *</label>
                  <select
                    value={guidedDraft.shapeExampleId}
                    onChange={(event) => setGuidedDraft((current) => ({ ...current, shapeExampleId: event.target.value }))}
                  >
                    <option value="">-- Chọn ví dụ --</option>
                    {shapeExamples
                      .filter((example) => example.shapeItemId === selectedShapeItem.id)
                      .map((example) => (
                        <option key={example.id} value={example.id}>
                          {example.exampleText}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {guidedDraft.shapeSubtype === "CARD" && selectedShapeItem && (
                <div className="field">
                  <label>Step 4. Xem trước thẻ</label>
                  <div style={{ border: "1px solid var(--border)", borderRadius: "16px", padding: "16px", background: "#fff" }}>
                    <div style={{ fontWeight: 700, fontSize: "18px", marginBottom: "8px" }}>{formatShapeDisplayName(selectedShapeItem.shapeName)}</div>
                    {selectedShapeItem.imageUrl && <img src={selectedShapeItem.imageUrl} alt={selectedShapeItem.shapeName} style={{ maxWidth: "100%", maxHeight: "140px", objectFit: "contain", borderRadius: "12px" }} />}
                  </div>
                </div>
              )}

              {guidedDraft.shapeSubtype === "EXAMPLE" && selectedShapeItem && selectedShapeExample && (
                <div className="field">
                  <label>Step 5. Xem trước thẻ</label>
                  <div style={{ border: "1px solid var(--border)", borderRadius: "16px", padding: "16px", background: "#fff" }}>
                    <div style={{ fontWeight: 700, marginBottom: "8px" }}>{selectedShapeExample.exampleText}</div>
                    {selectedShapeExample.imageUrl && <img src={selectedShapeExample.imageUrl} alt={selectedShapeExample.exampleText} style={{ maxWidth: "100%", maxHeight: "140px", objectFit: "contain", borderRadius: "12px" }} />}
                  </div>
                </div>
              )}
            </>
          )}

          {guidedDraft.businessType === "PECS" && (
            <>
              <div className="field">
                <label>Step 2. Chọn nhóm nội dung *</label>
                <select
                  value={guidedDraft.pecsCategory}
                  onChange={(event) =>
                    setGuidedDraft((current) => ({
                      ...current,
                      pecsCategory: event.target.value as PecsCategory,
                      pecsCardId: "",
                    }))
                  }
                >
                  {PECS_CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category}>
                      {PECS_CATEGORY_LABELS[category]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Step 3. Chọn thẻ PECS *</label>
                <select
                  value={guidedDraft.pecsCardId}
                  onChange={(event) => setGuidedDraft((current) => ({ ...current, pecsCardId: event.target.value }))}
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

              {selectedPecsCard && (
                <div className="field">
                  <label>Step 4. Xem trước thẻ</label>
                  <div style={{ border: "1px solid var(--border)", borderRadius: "16px", padding: "16px", background: "#fff" }}>
                    <div style={{ fontWeight: 700, fontSize: "18px", marginBottom: "8px" }}>{selectedPecsCard.title}</div>
                    <div style={{ color: "var(--text-muted)", marginBottom: "10px" }}>{selectedPecsCard.spokenText}</div>
                    {selectedPecsCard.imageUrl && <img src={selectedPecsCard.imageUrl} alt={selectedPecsCard.title} style={{ maxWidth: "100%", maxHeight: "140px", objectFit: "contain", borderRadius: "12px" }} />}
                  </div>
                </div>
              )}
            </>
          )}

          {guidedDraft.businessType === "GENERIC" && (
            <div className="panel" style={{ padding: "16px", background: "#fff7ed", border: "1px solid #fed7aa" }}>
              <strong>Khác / thủ công</strong>
              <p style={{ marginTop: "8px", color: "var(--text-muted)" }}>
                Loại này dùng cho fallback hoặc debug. Hãy chuyển sang tab Chế độ thủ công để nhập trực tiếp các trường NFC.
              </p>
              <button type="button" className="secondary" onClick={() => setActiveTab("MANUAL")}>
                Mở Chế độ thủ công
              </button>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {guidedPreview ? (
            <div className="field" style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid var(--border)" }}>
              <label style={{ fontWeight: 600, color: "var(--text-main)", display: "block", marginBottom: "8px" }}>Step 5: Ghi nội dung vào thẻ NFC</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ fontSize: "14px", color: "var(--text-muted)" }}>Nội dung cần ghi vào thẻ NFC:</div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    readOnly
                    value={guidedPreview.payloadValue}
                    style={{ flex: 1, padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "#f1f5f9", fontWeight: "bold", fontFamily: "monospace" }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(guidedPreview.payloadValue);
                      alert("Đã copy: " + guidedPreview.payloadValue);
                    }}
                    style={{ padding: "8px 16px", borderRadius: "6px" }}
                  >
                    📋 Copy nội dung
                  </button>
                </div>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "8px", lineHeight: "1.4" }}>
                  💡 <strong>Hướng dẫn:</strong> Mở NFC Tools &gt; Write &gt; Add a record &gt; Text. Dán nội dung này vào, sau đó bấm Write và chạm thẻ NFC.
                </p>
              </div>
            </div>
          ) : (
            <div className="panel" style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)" }}>
              Hoàn thành các bước chọn nội dung để lấy thông tin ghi thẻ.
            </div>
          )}

          <div className="field">
            <ToggleSwitch id="guided-active" label="Kích hoạt thẻ" checked={guidedDraft.isActive} onChange={(value) => setGuidedDraft((current) => ({ ...current, isActive: value }))} />
          </div>

          <div className="panel" style={{ padding: "16px", background: "#f8fafc", border: "1px solid var(--border)" }}>
            <h2 style={{ marginBottom: "12px" }}>Xem trước dữ liệu NFC</h2>
            {guidedPreview ? (
              <div style={{ display: "grid", gap: "10px" }}>
                {previewRow("Loại thẻ", BUSINESS_TYPE_LABELS[guidedPreview.tagType] || guidedPreview.tagType)}
                {previewRow("Nội dung liên kết", guidedPreview.sourceLabel)}
                {previewRow("Nội dung sẽ đọc", guidedPreview.spokenText)}
                {previewRow("Giá trị lưu trên thẻ", guidedPreview.payloadValue)}
                {previewRow("Ghi chú", guidedPreview.description)}
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: "10px", color: "var(--text-muted)", fontSize: "13px" }}>
                  {guidedPreview.note}
                </div>
              </div>
            ) : (
              <div style={{ color: "var(--text-muted)" }}>
                Chọn đủ dữ liệu nội dung để xem trước thẻ.
              </div>
            )}
            {errors.preview && <div className="error-msg" style={{ marginTop: "10px" }}>{errors.preview}</div>}
          </div>

          <div className="panel" style={{ padding: "16px", background: "#fff" }}>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button type="button" className="secondary" onClick={resetGuidedForm} disabled={saving}>
                Làm mới
              </button>
              <button type="button" onClick={handleGuidedSubmit} disabled={saving || guidedDraft.businessType === "GENERIC"}>
                {saving ? "Đang lưu..." : "Lưu thẻ theo nội dung"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderManualView() {
    return (
      <form onSubmit={handleManualSubmit}>
        <div className="panel" style={{ padding: "18px", display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(320px, 0.8fr)", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="field">
              <label>UID thẻ NFC (Tùy chọn / legacy)</label>
              <input
                type="text"
                placeholder="Ví dụ: 04:A2:3B:4C:5D:6E:7F"
                value={manualDraft.tagUid}
                onChange={(event) => setManualDraft((current) => ({ ...current, tagUid: event.target.value }))}
              />
              {errors.tagUid && <span className="error-msg">{errors.tagUid}</span>}
              {manualDraft.tagUid.trim() && !manualDraft.payloadValue.trim() && (
                <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", color: "#b45309", padding: "10px", borderRadius: "8px", fontSize: "13px", marginTop: "6px" }}>
                  ⚠️ Thẻ chỉ sử dụng UID vật lý là thẻ phiên bản cũ (legacy). Hãy cân nhắc sử dụng nội dung ghi vào thẻ (NDEF Payload) để tương thích tốt nhất trên iOS.
                </div>
              )}
            </div>

            <div className="field">
              <label>Tên hiển thị *</label>
              <input
                type="text"
                placeholder="Ví dụ: Đáp án: Chiếc ô"
                value={manualDraft.displayName}
                onChange={(event) => setManualDraft((current) => ({ ...current, displayName: event.target.value }))}
              />
              {errors.displayName && <span className="error-msg">{errors.displayName}</span>}
            </div>

            <div className="field">
              <label>Loại thẻ *</label>
              <select
                value={manualDraft.tagType}
                onChange={(event) => handleManualTagTypeChange(event.target.value as BusinessType)}
              >
                {BUSINESS_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {BUSINESS_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
              {errors.tagType && <span className="error-msg">{errors.tagType}</span>}
            </div>

            <div className="field">
              <label>Kiểu mục tiêu *</label>
              <select
                value={manualDraft.targetType}
                onChange={(event) => setManualDraft((current) => ({ ...current, targetType: event.target.value as ManualTargetType }))}
              >
                {MANUAL_TARGET_TYPES.map((targetType) => (
                  <option key={targetType} value={targetType}>
                    {TARGET_TYPE_LABELS[targetType] || targetType}
                  </option>
                ))}
              </select>
              {errors.targetType && <span className="error-msg">{errors.targetType}</span>}
            </div>

            <div className="field">
              <label>ID mục tiêu</label>
              <input
                type="text"
                placeholder="Tùy chọn"
                value={manualDraft.targetId}
                onChange={(event) => setManualDraft((current) => ({ ...current, targetId: event.target.value }))}
              />
            </div>

            <div className="field">
              <label>Nội dung ghi vào thẻ (Payload - Khuyên dùng) *</label>
              <input
                type="text"
                placeholder="Ví dụ: chiec_o, 5, CIRCLE"
                value={manualDraft.payloadValue}
                onChange={(event) => setManualDraft((current) => ({ ...current, payloadValue: event.target.value }))}
              />
              {errors.payloadValue && <span className="error-msg">{errors.payloadValue}</span>}
            </div>

            <div className="field">
              <label>Nội dung sẽ đọc *</label>
              <textarea
                placeholder="Nội dung TTS sẽ phát khi quét thẻ"
                value={manualDraft.spokenText}
                onChange={(event) => setManualDraft((current) => ({ ...current, spokenText: event.target.value }))}
                style={{ minHeight: "90px" }}
              />
              {errors.spokenText && <span className="error-msg">{errors.spokenText}</span>}
            </div>

            <div className="field">
              <label>Ghi chú</label>
              <textarea
                placeholder="Mô tả, nguồn hoặc ghi chú vận hành"
                value={manualDraft.description}
                onChange={(event) => setManualDraft((current) => ({ ...current, description: event.target.value }))}
                style={{ minHeight: "90px" }}
              />
            </div>

            <div className="field">
              <ToggleSwitch id="manual-active" label="Kích hoạt thẻ" checked={manualDraft.isActive} onChange={(value) => setManualDraft((current) => ({ ...current, isActive: value }))} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="panel" style={{ padding: "16px", background: "#f8fafc", border: "1px solid var(--border)" }}>
              <h2 style={{ marginBottom: "12px" }}>{editingItem ? "Đang chỉnh sửa" : "Chế độ thủ công"}</h2>
              <div style={{ display: "grid", gap: "10px" }}>
                {previewRow("Loại thẻ", BUSINESS_TYPE_LABELS[manualDraft.tagType] || manualDraft.tagType)}
                {previewRow("Nội dung liên kết", manualDraft.targetId || "—")}
                {previewRow("Nội dung sẽ đọc", manualDraft.spokenText || "—")}
                {previewRow("Giá trị lưu trên thẻ", manualDraft.payloadValue || "—")}
                {previewRow("Ghi chú", manualDraft.description || "—")}
              </div>
            </div>

            <div className="panel" style={{ padding: "16px", background: "#fff" }}>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                <button type="button" className="secondary" onClick={resetManualForm} disabled={saving}>
                  Làm mới
                </button>
                <button type="submit" disabled={saving}>
                  {saving ? "Đang lưu..." : editingItem ? "Cập nhật thẻ" : "Lưu thẻ thủ công"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    );
  }

  function handleGuidedTypeChange(nextType: BusinessType) {
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
  }

  function handleManualTagTypeChange(nextType: BusinessType) {
    setManualDraft((current) => ({
      ...current,
      tagType: nextType,
      targetType: defaultTargetTypeForBusinessType(nextType),
    }));
  }

  function resetGuidedForm() {
    setGuidedDraft((current) => ({
      ...EMPTY_GUIDED_DRAFT,
      tagUid: current.tagUid,
      isActive: current.isActive,
    }));
    setErrors({});
  }

  function resetManualForm() {
    setEditingItem(null);
    setManualDraft(EMPTY_MANUAL_DRAFT);
    setErrors({});
  }
}

function previewRow(label: string, value: string) {
  return (
    <div style={{ display: "grid", gap: "4px" }}>
      <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ fontWeight: 600, wordBreak: "break-word" }}>{value}</div>
    </div>
  );
}

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

function slugifyNfcValue(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "") || "nfc_tag";
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

function defaultTargetTypeForBusinessType(type: BusinessType): ManualTargetType {
  if (type === "FLASHCARD") return "FLASHCARD";
  if (type === "ANSWER") return "ANSWER_VALUE";
  return "RAW_VALUE";
}

function normalizeManualTargetType(value: string): ManualTargetType {
  if (value === "ANSWER_OPTION" || value === "ANSWER_VALUE" || value === "FLASHCARD" || value === "RAW_VALUE") {
    return value;
  }
  return "RAW_VALUE";
}
