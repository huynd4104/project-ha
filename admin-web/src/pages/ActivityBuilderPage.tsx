import { useEffect, useState } from "react";
import { adminApi } from "../api/adminApi";
import { MultiSelect } from "../components/MultiSelect";
import { ToggleSwitch } from "../components/ToggleSwitch";
import { validateActivityRequired } from "../utils/publishValidation";
import { ACTIVITY_TYPE_LABELS, uiLabel } from "../utils/adminLabels";
import type { Activity, ActivityOption, ActivityType, Lesson, AccessType } from "../types/firebaseModels";

const ACTIVITY_TYPES: ActivityType[] = [
  "MULTIPLE_CHOICE", "LISTEN_AND_CHOOSE_IMAGE", "LOOK_AND_CHOOSE_WORD",
  "VOICE_ANSWER", "EMOTION_RECOGNITION", "DAILY_LIFE_SCENARIO",
  "PARENT_MARK_RESULT", "HEAR_AND_REPEAT", "MATCH_OBJECTS", "FLASHCARD_REVIEW"
];

type LibrarySource = "flashcards" | "dialogues" | "math" | "thinking" | "spelling" | "rhyme";
type ChoiceKey = "A" | "B" | "C" | "D";

interface OptionItem { id?: string; text: string; imageUrl?: string; isCorrect: boolean }

interface ChoiceLibraryItem {
  id: string;
  lessonId?: string;
  questionText?: string;
  imageUrl?: string | null;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctOption?: ChoiceKey;
  explanation?: string;
  orderIndex?: number;
}

interface DialogueLibraryItem extends ChoiceLibraryItem {
  title?: string;
  sceneText?: string;
  audioUrl?: string | null;
}

interface FlashcardLibraryItem {
  id: string;
  lessonId?: string;
  frontText?: string;
  backText?: string;
  imageUrl?: string | null;
  audioUrl?: string | null;
  orderIndex?: number;
}

type LibraryItem = ChoiceLibraryItem | DialogueLibraryItem | FlashcardLibraryItem;
type ContentLibraryItems = Record<LibrarySource, LibraryItem[]>;

const CHOICE_KEYS: ChoiceKey[] = ["A", "B", "C", "D"];

const LIBRARY_SOURCE_CONFIG: Record<LibrarySource, {
  label: string;
  shortLabel: string;
  collection: "flashcards" | "dialogues" | "mathQuestions";
  activityType: ActivityType;
  instruction: string;
}> = {
  flashcards: {
    label: "Flashcard",
    shortLabel: "Flashcard",
    collection: "flashcards",
    activityType: "FLASHCARD_REVIEW",
    instruction: "Chạm vào thẻ để lật xem nội dung."
  },
  dialogues: {
    label: "Hội thoại",
    shortLabel: "Hội thoại",
    collection: "dialogues",
    activityType: "DAILY_LIFE_SCENARIO",
    instruction: "Nghe tình huống và luyện câu trả lời phù hợp."
  },
  math: {
    label: "Câu hỏi toán",
    shortLabel: "Toán",
    collection: "mathQuestions",
    activityType: "MULTIPLE_CHOICE",
    instruction: "Chọn đáp án đúng."
  },
  thinking: {
    label: "Câu hỏi tư duy",
    shortLabel: "Tư duy",
    collection: "mathQuestions",
    activityType: "MULTIPLE_CHOICE",
    instruction: "Quan sát và chọn đáp án phù hợp."
  },
  spelling: {
    label: "Câu hỏi đánh vần",
    shortLabel: "Đánh vần",
    collection: "mathQuestions",
    activityType: "LOOK_AND_CHOOSE_WORD",
    instruction: "Nhìn gợi ý và chọn từ đúng."
  },
  rhyme: {
    label: "Câu hỏi ghép vần",
    shortLabel: "Ghép vần",
    collection: "mathQuestions",
    activityType: "LOOK_AND_CHOOSE_WORD",
    instruction: "Chọn tiếng hoặc vần phù hợp."
  }
};

const EMPTY_CONTENT_LIBRARY_ITEMS: ContentLibraryItems = {
  flashcards: [],
  dialogues: [],
  math: [],
  thinking: [],
  spelling: [],
  rhyme: []
};

export function ActivityBuilderPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isActivityPreviewFlipped, setIsActivityPreviewFlipped] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [lessonSearch, setLessonSearch] = useState("");
  const [contentLibraryCounts, setContentLibraryCounts] = useState<Record<string, number>>({});
  const [contentLibraryItems, setContentLibraryItems] = useState<ContentLibraryItems>(EMPTY_CONTENT_LIBRARY_ITEMS);
  const [libraryPickerSource, setLibraryPickerSource] = useState<LibrarySource | null>(null);
  const [librarySearch, setLibrarySearch] = useState("");
  const [creatingFromLibraryId, setCreatingFromLibraryId] = useState("");

  // Form state
  const [activityType, setActivityType] = useState<ActivityType>("MULTIPLE_CHOICE");
  const [prompt, setPrompt] = useState("");
  const [instruction, setInstruction] = useState("");
  const [parentInstruction, setParentInstruction] = useState("");
  const [options, setOptions] = useState<OptionItem[]>([
    { text: "", isCorrect: true }, { text: "", isCorrect: false }
  ]);
  const [audioUrl, setAudioUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [acceptedAnswersStr, setAcceptedAnswersStr] = useState("");
  const [almostAnswersStr, setAlmostAnswersStr] = useState("");
  const [flashcardBackText, setFlashcardBackText] = useState("");
  const [retryLimit, setRetryLimit] = useState(3);
  const [feedbackCorrect, setFeedbackCorrect] = useState("");
  const [feedbackWrong, setFeedbackWrong] = useState("");
  const [feedbackAlmost, setFeedbackAlmost] = useState("");
  const [ttsPromptText, setTtsPromptText] = useState("");
  const [orderIndex, setOrderIndex] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [activitySkillTags, setActivitySkillTags] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [accessType, setAccessType] = useState<AccessType>("FREE");
  const [voicePremiumRequired, setVoicePremiumRequired] = useState(false);
  const [openLessonGroups, setOpenLessonGroups] = useState<Record<string, boolean>>({});
  const [isReorderingActivities, setIsReorderingActivities] = useState(false);
  const [draftActivities, setDraftActivities] = useState<Activity[]>([]);
  const [draggingActivityId, setDraggingActivityId] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const [lRes, sRes, fRes, dRes, qRes] = await Promise.all([
        adminApi.list("/lessons"),
        adminApi.list("/skills"),
        adminApi.list("/flashcards"),
        adminApi.list("/dialogues"),
        adminApi.list("/math-questions")
      ]);
      const all = (lRes.data.data || []) as Lesson[];
      all.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      setLessons(all);
      setSkills(sRes.data.data || []);
      const flashcards = (fRes.data.data || []) as FlashcardLibraryItem[];
      const dialogues = (dRes.data.data || []) as DialogueLibraryItem[];
      const questions = (qRes.data.data || []) as ChoiceLibraryItem[];
      const lessonById = new Map(all.map((lesson) => [lesson.id, lesson]));
      const questionsByLessonType = (type: Lesson["type"]) =>
        questions.filter((item) => lessonById.get(item.lessonId || "")?.type === type);
      const nextLibraryItems: ContentLibraryItems = {
        flashcards,
        dialogues,
        math: questionsByLessonType("MATH"),
        thinking: questionsByLessonType("THINKING"),
        spelling: questionsByLessonType("SPELLING"),
        rhyme: questionsByLessonType("RHYME")
      };
      setContentLibraryItems(nextLibraryItems);
      setContentLibraryCounts(Object.fromEntries(
        (Object.keys(nextLibraryItems) as LibrarySource[]).map((source) => [source, nextLibraryItems[source].length])
      ));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  async function loadActivities(lessonId: string) {
    if (!lessonId) { setActivities([]); return; }
    setLoadingActivities(true);
    try {
      const res = await adminApi.list("/activities");
      const all = (res.data.data || []) as Activity[];
      const filtered = all.filter((a) => a.lessonId === lessonId);
      filtered.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
      setActivities(filtered);
    } catch (e) { console.error(e); }
    finally { setLoadingActivities(false); }
  }

  useEffect(() => { if (selectedLessonId) loadActivities(selectedLessonId); }, [selectedLessonId]);
  useEffect(() => {
    if (!isReorderingActivities) setDraftActivities(activities);
  }, [activities, isReorderingActivities]);

  const showToast = (msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3000); };
  const selectedLesson = lessons.find((l) => l.id === selectedLessonId);
  const filteredLessons = lessonSearch ? lessons.filter((l) => l.title?.toLowerCase().includes(lessonSearch.toLowerCase())) : lessons;
  const groupedLessons = filteredLessons.reduce<Record<string, Lesson[]>>((acc, lesson) => {
    const key = lesson.lessonType || lesson.type || "OTHER";
    acc[key] = acc[key] || [];
    acc[key].push(lesson);
    return acc;
  }, {});
  const lessonGroupKeys = Object.keys(groupedLessons).sort((a, b) => uiLabel(a).localeCompare(uiLabel(b)));
  const visibleActivities = isReorderingActivities ? draftActivities : activities;
  const skillOptions = skills.filter((s: any) => s.isActive).map((s: any) => ({ value: s.key, label: s.label }));

  const needsOptions = ["MULTIPLE_CHOICE", "LISTEN_AND_CHOOSE_IMAGE", "LOOK_AND_CHOOSE_WORD", "EMOTION_RECOGNITION", "DAILY_LIFE_SCENARIO"].includes(activityType);
  const needsVoice = activityType === "VOICE_ANSWER" || activityType === "HEAR_AND_REPEAT";
  const needsParent = activityType === "PARENT_MARK_RESULT";
  const needsFlashcard = activityType === "FLASHCARD_REVIEW";
  const needsMatch = activityType === "MATCH_OBJECTS";
  const editingSource = asLibrarySource(editingActivity?.sourceLibrary);
  const editingSourceConfig = editingSource ? LIBRARY_SOURCE_CONFIG[editingSource] : null;

  const resetForm = () => {
    setPrompt(""); setInstruction(""); setParentInstruction("");
    setOptions([{ text: "", isCorrect: true }, { text: "", isCorrect: false }]);
    setAudioUrl(""); setImageUrl(""); setAcceptedAnswersStr(""); setAlmostAnswersStr("");
    setFlashcardBackText("");
    setRetryLimit(3); setFeedbackCorrect(""); setFeedbackWrong(""); setFeedbackAlmost("");
    setTtsPromptText(""); setIsActive(true); setActivitySkillTags([]); setFormErrors([]);
    setAccessType("FREE");
    setVoicePremiumRequired(false);
    setIsActivityPreviewFlipped(false);
    setOrderIndex(activities.length ? Math.max(...activities.map((a) => a.orderIndex ?? 0)) + 10 : 10);
  };

  const openAddModal = () => {
    setEditingActivity(null);
    setActivityType("MULTIPLE_CHOICE");
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (act: Activity) => {
    setEditingActivity(act);
    setActivityType(act.activityType || "MULTIPLE_CHOICE");
    setPrompt(act.prompt || ""); setInstruction(act.instruction || "");
    setParentInstruction(act.parentInstruction || "");
    setOptions(act.options?.length ? act.options.map((o: any) => ({
      id: o.id || "", text: o.text || "", imageUrl: o.imageUrl || "", isCorrect: !!o.isCorrect
    })) : [{ text: "", isCorrect: true }, { text: "", isCorrect: false }]);
    setAudioUrl(act.audioUrl || ""); setImageUrl(act.imageUrl || "");
    setAcceptedAnswersStr((act.acceptedAnswers || []).join(", "));
    setAlmostAnswersStr((act.almostAnswers || []).join(", "));
    setFlashcardBackText(act.correctAnswers?.[0] || "");
    setRetryLimit(act.retryLimit ?? 3);
    setFeedbackCorrect(act.feedback?.correct || ""); setFeedbackWrong(act.feedback?.wrong || "");
    setFeedbackAlmost(act.feedback?.almost || "");
    setTtsPromptText(act.ttsPromptText || "");
    setOrderIndex(act.orderIndex ?? 0); setIsActive(act.isActive !== false);
    setActivitySkillTags(act.skillTags || []);
    setAccessType(act.accessType || "FREE");
    setVoicePremiumRequired(act.voicePremiumRequired === true);
    setIsActivityPreviewFlipped(false);
    setFormErrors([]);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedOptions = needsOptions
      ? options.map((o, index) => ({
        id: o.id || CHOICE_KEYS[index] || `${index + 1}`,
        text: o.text.trim(),
        imageUrl: o.imageUrl || null,
        isCorrect: o.isCorrect
      }))
      : null;
    const correctAnswers = normalizedOptions
      ? uniqueStrings(normalizedOptions.filter((o) => o.isCorrect).flatMap((o) => [o.id, o.text]))
      : undefined;
    const payload: any = {
      lessonId: selectedLessonId, activityType, prompt: prompt.trim(),
      instruction: instruction.trim() || null,
      orderIndex: Number(orderIndex), isActive,
      skillTags: activitySkillTags,
      accessType,
      voicePremiumRequired: needsVoice ? voicePremiumRequired : false,
      options: normalizedOptions,
      audioUrl: audioUrl.trim() || null, imageUrl: imageUrl.trim() || null,
      mediaRefs: mediaRefs([
        imageUrl.trim() ? { type: "image", url: imageUrl.trim(), label: prompt.trim() } : null,
        audioUrl.trim() ? { type: "audio", url: audioUrl.trim(), label: prompt.trim() } : null
      ]),
      feedback: { correct: feedbackCorrect.trim() || null, wrong: feedbackWrong.trim() || null, almost: feedbackAlmost.trim() || null },
    };
    if (correctAnswers !== undefined) payload.correctAnswers = correctAnswers;

    if (needsFlashcard) {
      payload.correctAnswers = flashcardBackText.trim() ? [flashcardBackText.trim()] : [];
      payload.acceptedAnswers = ["REVIEWED"];
      payload.retryLimit = 0;
    }

    if (needsVoice) {
      payload.acceptedAnswers = acceptedAnswersStr.split(",").map((s) => s.trim()).filter(Boolean);
      payload.almostAnswers = almostAnswersStr.split(",").map((s) => s.trim()).filter(Boolean);
      payload.retryLimit = retryLimit;
      payload.ttsPromptText = ttsPromptText.trim() || null;
    }

    if (needsParent) {
      payload.parentInstruction = parentInstruction.trim();
    }

    const validationErrors = validateActivityRequired(payload);
    if (needsFlashcard) {
      if (!payload.prompt) validationErrors.push("Mặt trước flashcard không được để trống.");
      if (!flashcardBackText.trim()) validationErrors.push("Mặt sau flashcard không được để trống.");
    }
    if (validationErrors.length > 0) { setFormErrors(validationErrors); return; }
    setFormErrors([]);

    try {
      if (editingActivity) await adminApi.update("/activities", editingActivity.id, payload);
      else await adminApi.create("/activities", payload);
      setIsModalOpen(false);
      showToast(editingActivity ? "Cập nhật thành công!" : "Tạo mới thành công!");
      loadActivities(selectedLessonId);
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa hoạt động này?")) return;
    await adminApi.remove("/activities", id);
    showToast("Đã xóa!"); loadActivities(selectedLessonId);
  };

  const moveActivity = async (act: Activity, direction: "up" | "down") => {
    const idx = activities.indexOf(act);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= activities.length) return;
    const other = activities[swapIdx];
    await Promise.all([
      adminApi.update("/activities", act.id, { orderIndex: other.orderIndex }),
      adminApi.update("/activities", other.id, { orderIndex: act.orderIndex })
    ]);
    loadActivities(selectedLessonId);
  };

  const toggleLessonGroup = (groupKey: string) => {
    setOpenLessonGroups((prev) => ({ ...prev, [groupKey]: !(prev[groupKey] ?? true) }));
  };

  const startActivityReorder = () => {
    setDraftActivities(activities);
    setIsReorderingActivities(true);
  };

  const cancelActivityReorder = () => {
    setDraftActivities(activities);
    setDraggingActivityId("");
    setIsReorderingActivities(false);
  };

  const reorderDraftActivities = (fromId: string, toId: string) => {
    if (!fromId || fromId === toId) return;
    const fromIndex = draftActivities.findIndex((item) => item.id === fromId);
    const toIndex = draftActivities.findIndex((item) => item.id === toId);
    if (fromIndex < 0 || toIndex < 0) return;
    const next = [...draftActivities];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setDraftActivities(next);
  };

  const saveActivityOrder = async () => {
    if (!selectedLessonId) return;
    await Promise.all(draftActivities.map((activity, index) => (
      adminApi.update("/activities", activity.id, { orderIndex: (index + 1) * 10 })
    )));
    setIsReorderingActivities(false);
    setDraggingActivityId("");
    showToast("Đã lưu thứ tự hoạt động.");
    loadActivities(selectedLessonId);
  };

  const updateOption = (idx: number, field: keyof OptionItem, value: any) => {
    setOptions(options.map((o, i) => i === idx ? { ...o, [field]: value } : o));
  };

  const addOption = () => { if (options.length < 4) setOptions([...options, { text: "", isCorrect: false }]); };
  const removeOption = (idx: number) => { if (options.length > 2) setOptions(options.filter((_, i) => i !== idx)); };

  const openLibraryPicker = (source: LibrarySource) => {
    setLibraryPickerSource(source);
    setLibrarySearch("");
    setFormErrors([]);
  };

  const closeLibraryPicker = () => {
    setLibraryPickerSource(null);
    setLibrarySearch("");
    setCreatingFromLibraryId("");
  };

  const createActivityFromLibrary = async (source: LibrarySource, item: LibraryItem) => {
    if (!selectedLessonId) {
      showToast("Vui lòng chọn bài học trước khi lấy nội dung từ thư viện.");
      return;
    }
    const creatingKey = `${source}:${item.id}`;
    setCreatingFromLibraryId(creatingKey);
    try {
      const payload = buildActivityPayloadFromLibrary(source, item);
      const validationErrors = validateActivityRequired(payload);
      if (validationErrors.length > 0) {
        setFormErrors(validationErrors);
        showToast("Nội dung thư viện thiếu dữ liệu bắt buộc để tạo hoạt động.");
        return;
      }
      await adminApi.create("/activities", payload);
      showToast(`Đã tạo hoạt động từ ${LIBRARY_SOURCE_CONFIG[source].shortLabel}.`);
      closeLibraryPicker();
      await loadActivities(selectedLessonId);
    } catch (e) {
      console.error(e);
      showToast("Không thể tạo hoạt động từ thư viện. Vui lòng thử lại.");
    } finally {
      setCreatingFromLibraryId("");
    }
  };

  const buildActivityPayloadFromLibrary = (source: LibrarySource, item: LibraryItem): any => {
    const config = LIBRARY_SOURCE_CONFIG[source];
    const sourceLesson = lessons.find((lesson) => lesson.id === item.lessonId);
    const skillTags = uniqueStrings([
      ...(selectedLesson?.skillTags || []),
      ...(sourceLesson?.skillTags || [])
    ]);
    const base: Partial<Activity> & Record<string, unknown> = {
      lessonId: selectedLessonId,
      activityType: config.activityType,
      orderIndex: nextOrderIndex(),
      instruction: config.instruction,
      isActive: true,
      accessType: selectedLesson?.accessType || "FREE",
      skillTags,
      sourceLibrary: source,
      sourceCollection: config.collection,
      sourceId: item.id,
      sourceLessonId: item.lessonId || null,
      sourceSnapshot: stripUndefined(item as unknown as Record<string, unknown>)
    };

    if (source === "flashcards") {
      const flashcard = item as FlashcardLibraryItem;
      const image = cleanString(flashcard.imageUrl);
      const audio = cleanString(flashcard.audioUrl);
      return stripUndefined({
        ...base,
        prompt: cleanString(flashcard.frontText) || "Ôn tập thẻ học",
        correctAnswers: cleanString(flashcard.backText) ? [cleanString(flashcard.backText)] : [],
        acceptedAnswers: ["REVIEWED"],
        imageUrl: image || null,
        audioUrl: audio || null,
        mediaRefs: mediaRefs([
          image ? { type: "image", url: image, label: cleanString(flashcard.frontText) } : null,
          audio ? { type: "audio", url: audio, label: cleanString(flashcard.frontText) } : null
        ]),
        feedback: { correct: "Đã ôn tập thẻ học.", wrong: null, almost: null },
        retryLimit: 0
      });
    }

    if (source === "dialogues") {
      const dialogue = item as DialogueLibraryItem;
      const options = choiceOptions(dialogue, true);
      const correct = correctChoice(dialogue);
      const audio = cleanString(dialogue.audioUrl);
      return stripUndefined({
        ...base,
        prompt: cleanString(dialogue.questionText) || cleanString(dialogue.title) || "Luyện tình huống giao tiếp",
        instruction: cleanString(dialogue.sceneText) || config.instruction,
        audioUrl: audio || null,
        mediaRefs: mediaRefs([
          audio ? { type: "audio", url: audio, label: cleanString(dialogue.title) || cleanString(dialogue.questionText) } : null
        ]),
        options,
        correctAnswers: uniqueStrings([correct?.id, correct?.text]),
        feedback: {
          correct: "Con trả lời phù hợp rồi.",
          wrong: "Mình nghe lại tình huống và thử câu trả lời khác nhé.",
          almost: null
        },
        retryLimit: 1
      });
    }

    const question = item as ChoiceLibraryItem;
    const image = cleanString(question.imageUrl);
    const correct = correctChoice(question);
    return stripUndefined({
      ...base,
      prompt: cleanString(question.questionText) || `${config.label} từ thư viện`,
      imageUrl: image || null,
      mediaRefs: mediaRefs([
        image ? { type: "image", url: image, label: cleanString(question.questionText) } : null
      ]),
      options: choiceOptions(question),
      correctAnswers: uniqueStrings([correct?.id, correct?.text]),
      feedback: {
        correct: cleanString(question.explanation) || "Đúng rồi! Con làm tốt lắm.",
        wrong: cleanString(question.explanation) || "Mình quan sát lại và thử thêm lần nữa nhé.",
        almost: null
      },
      retryLimit: 1
    });
  };

  const nextOrderIndex = () => (
    activities.length ? Math.max(...activities.map((a) => a.orderIndex ?? 0)) + 10 : 10
  );

  const activeLibraryConfig = libraryPickerSource ? LIBRARY_SOURCE_CONFIG[libraryPickerSource] : null;
  const libraryPickerItems = libraryPickerSource
    ? contentLibraryItems[libraryPickerSource].filter((item) => matchesLibrarySearch(libraryPickerSource, item, librarySearch))
    : [];

  function matchesLibrarySearch(source: LibrarySource, item: LibraryItem, search: string) {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [
      libraryItemTitle(source, item),
      libraryItemDescription(source, item),
      sourceLessonTitle(item.lessonId)
    ].some((value) => value.toLowerCase().includes(query));
  }

  function libraryItemTitle(source: LibrarySource, item: LibraryItem) {
    if (source === "flashcards") return cleanString((item as FlashcardLibraryItem).frontText) || "Flashcard chưa có mặt trước";
    if (source === "dialogues") return cleanString((item as DialogueLibraryItem).title) || cleanString((item as DialogueLibraryItem).questionText) || "Hội thoại chưa có tiêu đề";
    return cleanString((item as ChoiceLibraryItem).questionText) || "Câu hỏi chưa có nội dung";
  }

  function libraryItemDescription(source: LibrarySource, item: LibraryItem) {
    if (source === "flashcards") return cleanString((item as FlashcardLibraryItem).backText);
    if (source === "dialogues") return cleanString((item as DialogueLibraryItem).sceneText) || cleanString((item as DialogueLibraryItem).questionText);
    return cleanString((item as ChoiceLibraryItem).explanation);
  }

  function sourceLessonTitle(lessonId?: string) {
    if (!lessonId) return "Chưa gắn bài học nguồn";
    return lessons.find((lesson) => lesson.id === lessonId)?.title || "Bài học nguồn không còn tồn tại";
  }

  function choiceOptions(item: ChoiceLibraryItem, correctFirst = false): ActivityOption[] {
    const correct = cleanString(item.correctOption || "A") as ChoiceKey;
    const options = CHOICE_KEYS
      .map((key) => ({
        id: key,
        text: cleanString(item[`option${key}` as keyof ChoiceLibraryItem]),
        isCorrect: key === correct
      }))
      .filter((option) => option.text);
    if (!correctFirst) return options;
    return [...options].sort((a, b) => Number(b.isCorrect) - Number(a.isCorrect));
  }

  function correctChoice(item: ChoiceLibraryItem) {
    const key = cleanString(item.correctOption || "A") as ChoiceKey;
    const text = cleanString(item[`option${key}` as keyof ChoiceLibraryItem]);
    return text ? { id: key, text } : null;
  }

  function isLibraryItemAlreadyUsed(source: LibrarySource, item: LibraryItem) {
    return activities.some((activity) => (
      activity.sourceLibrary === source &&
      activity.sourceId === item.id
    ));
  }

  function cleanString(value: unknown) {
    return `${value ?? ""}`.trim();
  }

  function uniqueStrings(values: Array<string | null | undefined>) {
    return Array.from(new Set(values.map(cleanString).filter(Boolean)));
  }

  function mediaRefs(items: Array<{ type: string; url: string; label: string } | null>) {
    return items.filter(Boolean) as Array<{ type: string; url: string; label: string }>;
  }

  function stripUndefined<T extends Record<string, unknown>>(value: T): T {
    return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
  }

  function asLibrarySource(value?: string | null): LibrarySource | null {
    return value && value in LIBRARY_SOURCE_CONFIG ? value as LibrarySource : null;
  }

  function sourceSnapshotForEdit() {
    if (!editingActivity || !editingSource || !editingActivity.sourceSnapshot) return null;
    const snapshot = editingActivity.sourceSnapshot as Record<string, unknown>;
    return {
      ...snapshot,
      id: cleanString(snapshot.id) || editingActivity.sourceId || editingActivity.id,
      lessonId: cleanString(snapshot.lessonId) || editingActivity.sourceLessonId || undefined
    } as LibraryItem;
  }

  function renderDetailRow(label: string, value: any) {
    return (
      <div className="library-detail-row">
        <span className="library-detail-label">{label}</span>
        <div className="library-detail-value">{value || <span className="muted-value">Không có</span>}</div>
      </div>
    );
  }

  function renderImageValue(url?: string | null, alt?: string) {
    const cleanUrl = cleanString(url);
    if (!cleanUrl) return <span className="muted-value">Không có</span>;
    return (
      <div className="library-media-value">
        <img src={cleanUrl} alt={alt || ""} className="library-thumb" />
      </div>
    );
  }

  function renderAudioValue(url?: string | null) {
    const cleanUrl = cleanString(url);
    if (!cleanUrl) return <span className="muted-value">Không có</span>;
    return <audio src={cleanUrl} controls className="library-audio" />;
  }

  function renderOptionsSummary(optionsForPreview: ActivityOption[]) {
    if (optionsForPreview.length === 0) return <span className="muted-value">Không có</span>;
    return (
      <div className="library-option-list">
        {optionsForPreview.map((option) => (
          <span key={option.id || option.text} className={option.isCorrect ? "correct" : ""}>
            {option.id ? `${option.id}. ` : ""}{option.text}
          </span>
        ))}
      </div>
    );
  }

  function renderLibraryItemDetails(source: LibrarySource, item: LibraryItem) {
    if (source === "flashcards") {
      const flashcard = item as FlashcardLibraryItem;
      return (
        <div className="library-detail-card">
          <div className="library-detail-grid">
            {renderDetailRow("Bài học", sourceLessonTitle(flashcard.lessonId))}
            {renderDetailRow("Mặt trước", cleanString(flashcard.frontText))}
            {renderDetailRow("Mặt sau", cleanString(flashcard.backText))}
            {renderDetailRow("Minh hoạ", renderImageValue(flashcard.imageUrl, flashcard.frontText))}
            {renderDetailRow("Âm thanh", renderAudioValue(flashcard.audioUrl))}
          </div>
        </div>
      );
    }

    if (source === "dialogues") {
      const dialogue = item as DialogueLibraryItem;
      const correct = correctChoice(dialogue);
      return (
        <div className="library-detail-card">
          <div className="library-detail-grid">
            {renderDetailRow("Bài học", sourceLessonTitle(dialogue.lessonId))}
            {renderDetailRow("Tiêu đề", cleanString(dialogue.title))}
            {renderDetailRow("Bối cảnh", cleanString(dialogue.sceneText))}
            {renderDetailRow("Âm thanh", renderAudioValue(dialogue.audioUrl))}
            {renderDetailRow("Câu hỏi", cleanString(dialogue.questionText))}
            {renderDetailRow("Lựa chọn", renderOptionsSummary(choiceOptions(dialogue)))}
            {renderDetailRow("Đáp án đúng", correct ? `${correct.id}. ${correct.text}` : "")}
          </div>
        </div>
      );
    }

    const question = item as ChoiceLibraryItem;
    const correct = correctChoice(question);
    return (
      <div className="library-detail-card">
        <div className="library-detail-grid">
          {renderDetailRow("Bài học", sourceLessonTitle(question.lessonId))}
          {renderDetailRow("Câu hỏi", cleanString(question.questionText))}
          {renderDetailRow("Minh hoạ", renderImageValue(question.imageUrl, question.questionText))}
          {renderDetailRow("Lựa chọn", renderOptionsSummary(choiceOptions(question)))}
          {renderDetailRow("Đáp án đúng", correct ? `${correct.id}. ${correct.text}` : "")}
          {renderDetailRow("Giải thích", cleanString(question.explanation))}
        </div>
      </div>
    );
  }

  function renderSourceEditContext() {
    const snapshot = sourceSnapshotForEdit();
    if (!editingSource || !editingSourceConfig) return null;
    return (
      <div className="library-edit-context">
        <div className="library-edit-context-head">
          <strong>Nội dung gốc từ thư viện {editingSourceConfig.label}</strong>
          <span className="badge info">{ACTIVITY_TYPE_LABELS[activityType] || activityType}</span>
        </div>
        {snapshot ? (
          renderLibraryItemDetails(editingSource, snapshot)
        ) : (
          <div className="library-source-fallback">
            <span>Collection: {editingActivity?.sourceCollection || editingSourceConfig.collection}</span>
            <span>ID: {editingActivity?.sourceId || "Không có"}</span>
          </div>
        )}
      </div>
    );
  }

  function renderLockedActivityType() {
    return (
      <div className="library-locked-type">
        <span>Loại hoạt động</span>
        <strong>{ACTIVITY_TYPE_LABELS[activityType] || activityType}</strong>
      </div>
    );
  }

  function renderOptionsEditor(title = `Lựa chọn (${options.length}/4)`, allowImages = activityType === "LISTEN_AND_CHOOSE_IMAGE" || activityType === "EMOTION_RECOGNITION") {
    return (
      <div className="activity-form-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <label style={{ fontWeight: "600" }}>{title}</label>
          {options.length < 4 && <button type="button" className="secondary" onClick={addOption} style={{ padding: "4px 10px", fontSize: "12px" }}>+ Thêm</button>}
        </div>
        {options.map((opt, i) => (
          <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
            <input type="text" placeholder={`Lựa chọn ${CHOICE_KEYS[i] || i + 1}`} value={opt.text} onChange={(e) => updateOption(i, "text", e.target.value)} style={{ flex: 1 }} />
            {allowImages && (
              <input type="text" placeholder="Đường dẫn hình ảnh" value={opt.imageUrl || ""} onChange={(e) => updateOption(i, "imageUrl", e.target.value)} style={{ width: "160px" }} />
            )}
            <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", whiteSpace: "nowrap" }}>
              <input type="checkbox" checked={opt.isCorrect} onChange={(e) => updateOption(i, "isCorrect", e.target.checked)} style={{ width: "16px", height: "16px" }} />
              Đúng
            </label>
            {options.length > 2 && <button type="button" className="danger" onClick={() => removeOption(i)} style={{ padding: "4px 8px", fontSize: "11px" }}>×</button>}
          </div>
        ))}
      </div>
    );
  }

  function renderFlashcardEditFields() {
    return (
      <>
        {renderSourceEditContext()}
        {renderLockedActivityType()}
        <div className="field">
          <label>Mặt trước <span style={{ color: "red" }}>*</span></label>
          <textarea placeholder="VD: Cảm ơn" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </div>
        <div className="field">
          <label>Mặt sau <span style={{ color: "red" }}>*</span></label>
          <textarea placeholder="VD: Dùng khi nhận giúp đỡ" value={flashcardBackText} onChange={(e) => setFlashcardBackText(e.target.value)} />
        </div>
        <div className="field">
          <label>Hướng dẫn khi học</label>
          <input type="text" placeholder="Gợi ý ngắn cho trẻ" value={instruction} onChange={(e) => setInstruction(e.target.value)} />
        </div>
        <div className="form-grid">
          <div className="field">
            <label>Minh hoạ URL</label>
            <input type="text" placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          </div>
          <div className="field">
            <label>Âm thanh URL</label>
            <input type="text" placeholder="https://..." value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} />
          </div>
        </div>
      </>
    );
  }

  function renderDialogueEditFields() {
    return (
      <>
        {renderSourceEditContext()}
        {renderLockedActivityType()}
        <div className="field">
          <label>Câu hỏi / tình huống <span style={{ color: "red" }}>*</span></label>
          <textarea placeholder="VD: Khi được giúp đỡ, con nói gì?" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </div>
        <div className="field">
          <label>Bối cảnh / lời thoại mẫu</label>
          <textarea placeholder="Ngữ cảnh hội thoại cho trẻ" value={instruction} onChange={(e) => setInstruction(e.target.value)} />
        </div>
        <div className="field">
          <label>Âm thanh hội thoại</label>
          <input type="text" placeholder="https://..." value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} />
        </div>
        {renderOptionsEditor("Câu trả lời lựa chọn", false)}
      </>
    );
  }

  function renderQuestionEditFields() {
    return (
      <>
        {renderSourceEditContext()}
        {renderLockedActivityType()}
        <div className="field">
          <label>Câu hỏi <span style={{ color: "red" }}>*</span></label>
          <textarea placeholder="Nội dung câu hỏi" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </div>
        <div className="field">
          <label>Minh hoạ URL</label>
          <input type="text" placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
        </div>
        <div className="field">
          <label>Hướng dẫn ngắn</label>
          <input type="text" placeholder="Gợi ý ngắn cho trẻ" value={instruction} onChange={(e) => setInstruction(e.target.value)} />
        </div>
        {renderOptionsEditor("Đáp án lựa chọn", false)}
      </>
    );
  }

  function renderManualActivityFields() {
    return (
      <>
        <div className="field">
          <label>Loại hoạt động <span style={{ color: "red" }}>*</span></label>
          <select value={activityType} onChange={(e) => setActivityType(e.target.value as ActivityType)}>
            {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{ACTIVITY_TYPE_LABELS[t] || t}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Câu hỏi / Đề bài <span style={{ color: "red" }}>*</span></label>
          <textarea placeholder="VD: Con vật nào kêu 'meo meo'?" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </div>

        {needsFlashcard && (
          <div className="field">
            <label>Mặt sau flashcard <span style={{ color: "red" }}>*</span></label>
            <textarea placeholder="Nội dung mặt sau của thẻ" value={flashcardBackText} onChange={(e) => setFlashcardBackText(e.target.value)} />
          </div>
        )}

        <div className="field">
          <label>Hướng dẫn ngắn</label>
          <input type="text" placeholder="Gợi ý ngắn cho trẻ" value={instruction} onChange={(e) => setInstruction(e.target.value)} />
        </div>

        {(activityType === "LISTEN_AND_CHOOSE_IMAGE" || activityType === "HEAR_AND_REPEAT" || needsVoice || needsFlashcard) && (
          <div className="field">
            <label>Đường dẫn âm thanh</label>
            <input type="text" placeholder="https://..." value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} />
          </div>
        )}

        {(activityType === "LOOK_AND_CHOOSE_WORD" || activityType === "EMOTION_RECOGNITION" || activityType === "DAILY_LIFE_SCENARIO" || needsFlashcard) && (
          <div className="field">
            <label>Hình ảnh URL</label>
            <input type="text" placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          </div>
        )}

        {needsOptions && renderOptionsEditor()}

        {needsVoice && (
          <div className="activity-form-section">
            <h3 style={{ fontSize: "14px", marginBottom: "8px", color: "var(--text-muted)" }}>Cấu hình giọng nói</h3>
            <div className="field">
              <label>Nội dung đọc cho trẻ</label>
              <input type="text" value={ttsPromptText} onChange={(e) => setTtsPromptText(e.target.value)} placeholder="Nội dung TTS phát cho trẻ" />
            </div>
            <div className="field">
              <label>Đáp án chấp nhận (phân cách bởi dấu phẩy)</label>
              <input type="text" value={acceptedAnswersStr} onChange={(e) => setAcceptedAnswersStr(e.target.value)} placeholder="con mèo, mèo" />
            </div>
            <div className="field">
              <label>Đáp án gần đúng</label>
              <input type="text" value={almostAnswersStr} onChange={(e) => setAlmostAnswersStr(e.target.value)} placeholder="con chó, chó" />
            </div>
            <div className="field">
              <label>Số lần thử lại</label>
              <input type="number" min={0} max={10} value={retryLimit} onChange={(e) => setRetryLimit(Number(e.target.value))} />
            </div>
            <div className="field" style={{ marginTop: "8px" }}>
              <ToggleSwitch id="voicePremiumRequired" label="Yêu cầu giọng nói Premium" checked={voicePremiumRequired} onChange={setVoicePremiumRequired} />
            </div>
          </div>
        )}

        {needsParent && (
          <div className="field">
            <label>Hướng dẫn phụ huynh <span style={{ color: "red" }}>*</span></label>
            <textarea placeholder="Mô tả chi tiết cho phụ huynh quan sát và đánh giá..." value={parentInstruction} onChange={(e) => setParentInstruction(e.target.value)} />
          </div>
        )}
      </>
    );
  }

  function renderActivityFields() {
    if (editingSource === "flashcards") return renderFlashcardEditFields();
    if (editingSource === "dialogues") return renderDialogueEditFields();
    if (editingSource) return renderQuestionEditFields();
    return renderManualActivityFields();
  }

  return (
    <div>
      <div className="toolbar">
        <div>
          <h1>Hoạt động trong bài học</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "4px" }}>Tạo từng câu hỏi hoặc nhiệm vụ nhỏ trong một bài học.</p>
        </div>
      </div>

      <div className="drawer-container">
        {/* Lesson selector panel */}
        <div style={{ width: "280px", flexShrink: 0 }}>
          <div className="panel" style={{ padding: "12px" }}>
            <input type="text" placeholder="Tìm bài học..." value={lessonSearch} onChange={(e) => setLessonSearch(e.target.value)} style={{ marginBottom: "12px" }} />
            <div style={{ maxHeight: "480px", overflowY: "auto" }}>
              {loading ? <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Đang tải dữ liệu...</p> : lessonGroupKeys.map((groupKey) => {
                const isOpen = openLessonGroups[groupKey] ?? true;
                return (
                  <div key={groupKey} style={{ marginBottom: "8px" }}>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => toggleLessonGroup(groupKey)}
                      style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", fontSize: "12px" }}
                    >
                      <span>{isOpen ? "▾" : "▸"} {uiLabel(groupKey)}</span>
                      <span className="badge info">{groupedLessons[groupKey].length}</span>
                    </button>
                    {isOpen && groupedLessons[groupKey].map((l) => (
                      <div
                        key={l.id}
                        onClick={() => { setSelectedLessonId(l.id); cancelActivityReorder(); }}
                        style={{
                          padding: "8px 12px", borderRadius: "6px", cursor: "pointer", margin: "4px 0 0 10px", fontSize: "13px",
                          background: selectedLessonId === l.id ? "var(--primary-light)" : "transparent",
                          color: selectedLessonId === l.id ? "var(--primary)" : "var(--text-main)",
                          fontWeight: selectedLessonId === l.id ? "600" : "400"
                        }}
                      >
                        {l.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Activities list */}
        <div className="drawer-main">
          {!selectedLessonId ? (
            <div className="panel" style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>👈</div>
              <h3 style={{ margin: "0 0 8px 0", color: "var(--text-main)", fontWeight: "700" }}>Chưa chọn bài học</h3>
              <p style={{ color: "var(--text-muted)", margin: "0", fontSize: "14px" }}>
                Chọn một bài học từ danh sách bên trái để xem, sắp xếp và thêm mới các hoạt động.
              </p>
            </div>
          ) : (
            <>
              {selectedLesson && (
                <div className="panel" style={{ padding: "16px", marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                    <div>
                      <strong>{selectedLesson.title}</strong>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "8px" }}>{selectedLesson.lessonType || selectedLesson.type}</span>
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {activities.length > 1 && !isReorderingActivities && (
                        <button className="secondary" onClick={startActivityReorder}>Sắp xếp thứ tự</button>
                      )}
                      {isReorderingActivities && (
                        <>
                          <button className="secondary" onClick={cancelActivityReorder}>Hủy sắp xếp</button>
                          <button onClick={saveActivityOrder}>Lưu thứ tự</button>
                        </>
                      )}
                      <button onClick={openAddModal} disabled={isReorderingActivities}>➕ Thêm hoạt động</button>
                    </div>
                  </div>
                  <div style={{ borderTop: "1px solid var(--border)", marginTop: "14px", paddingTop: "14px" }}>
                    <strong style={{ display: "block", marginBottom: "4px" }}>Tạo hoạt động từ kho nội dung</strong>
                    <p style={{ color: "var(--text-muted)", margin: "0 0 10px 0", fontSize: "13px" }}>
                      Chọn item thật trong thư viện, hệ thống sẽ chuyển đổi dữ liệu theo đúng schema của từng loại nội dung rồi tạo hoạt động cho bài học này.
                    </p>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {[
                        ["flashcards", "Từ Flashcard"],
                        ["dialogues", "Từ Hội thoại"],
                        ["math", "Từ Câu hỏi toán"],
                        ["thinking", "Từ Tư duy"],
                        ["spelling", "Từ Đánh vần"],
                        ["rhyme", "Từ Ghép vần"]
                      ].map(([source, label]) => (
                        <button
                          key={source}
                          type="button"
                          className="secondary"
                          disabled={!contentLibraryCounts[source]}
                          onClick={() => openLibraryPicker(source as LibrarySource)}
                        >
                          {label} ({contentLibraryCounts[source] || 0})
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {loadingActivities ? <p>Đang tải hoạt động...</p> : activities.length === 0 ? (
                <div className="panel" style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div style={{ fontSize: "40px", marginBottom: "12px" }}>🧩</div>
                  <h3 style={{ margin: "0 0 8px 0", color: "var(--text-main)", fontWeight: "700" }}>Chưa có hoạt động nào</h3>
                  <p style={{ color: "var(--text-muted)", margin: "0 0 16px 0", fontSize: "14px" }}>
                    Bài học này đang trống. Hãy tạo hoạt động đầu tiên để trẻ bắt đầu học tập.
                  </p>
                  <button onClick={openAddModal}>➕ Thêm Hoạt Động Đầu Tiên</button>
                </div>
              ) : (
                <div>
                  {visibleActivities.map((act, idx) => (
                    <div
                      key={act.id}
                      className={`path-item-card ${draggingActivityId === act.id ? "dragging" : ""}`}
                      draggable={isReorderingActivities}
                      onDragStart={(e) => {
                        setDraggingActivityId(act.id);
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", act.id);
                      }}
                      onDragOver={(e) => {
                        if (isReorderingActivities) e.preventDefault();
                      }}
                      onDrop={(e) => {
                        if (!isReorderingActivities) return;
                        e.preventDefault();
                        reorderDraftActivities(e.dataTransfer.getData("text/plain") || draggingActivityId, act.id);
                      }}
                      onDragEnd={() => setDraggingActivityId("")}
                    >
                      <div className="path-item-seq">{idx + 1}</div>
                      <div className="path-item-info">
                        <strong>{act.prompt || "Hoạt động"}</strong>
                        <small style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "4px" }}>
                          <span className="badge info">
                            {ACTIVITY_TYPE_LABELS[act.activityType] || act.activityType}
                          </span>
                          <span className={`badge ${act.accessType === "PREMIUM" ? "premium" : "free"}`}>
                            {uiLabel(act.accessType || "FREE")}
                          </span>
                          {act.sourceLibrary && (
                            <span className="badge purple">
                              Từ {LIBRARY_SOURCE_CONFIG[act.sourceLibrary as LibrarySource]?.shortLabel || act.sourceLibrary}
                            </span>
                          )}
                          {act.options?.length ? <span>{act.options.length} lựa chọn</span> : ""}
                        </small>
                      </div>
                      <div className="path-item-actions">
                        {isReorderingActivities ? (
                          <span className="badge info">Kéo thả</span>
                        ) : (
                          <>
                            <button className="secondary" onClick={() => openEditModal(act)}>Sửa</button>
                            <button className="danger" onClick={() => handleDelete(act.id)}>Xóa</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {libraryPickerSource && activeLibraryConfig && (
        <div className="modal-overlay" onClick={closeLibraryPicker}>
          <div className="modal-content library-picker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Chọn từ thư viện {activeLibraryConfig.label}</h2>
                <p style={{ color: "var(--text-muted)", marginTop: "4px", fontSize: "13px" }}>
                  Mỗi item sẽ được chuyển thành hoạt động loại {ACTIVITY_TYPE_LABELS[activeLibraryConfig.activityType]} cho bài học đang chọn.
                </p>
              </div>
              <button className="modal-close" onClick={closeLibraryPicker}>&times;</button>
            </div>
            <div className="modal-body">
              {formErrors.length > 0 && (
                <div className="validation-warnings">
                  <p>⚠️ Không thể tạo hoạt động:</p>
                  <ul>{formErrors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                </div>
              )}

              <div className="library-picker-toolbar">
                <div>
                  <span className="badge info">{contentLibraryItems[libraryPickerSource].length} item</span>
                  <span className="badge purple" style={{ marginLeft: "8px" }}>
                    {ACTIVITY_TYPE_LABELS[activeLibraryConfig.activityType]}
                  </span>
                </div>
                <input
                  type="text"
                  placeholder={`Tìm trong thư viện ${activeLibraryConfig.shortLabel.toLowerCase()}...`}
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                />
              </div>

              {libraryPickerItems.length === 0 ? (
                <div className="panel" style={{ textAlign: "center", padding: "32px 20px", marginBottom: 0 }}>
                  <p style={{ color: "var(--text-muted)" }}>Không tìm thấy nội dung phù hợp trong thư viện này.</p>
                </div>
              ) : (
                <div className="library-picker-list">
                  {libraryPickerItems.map((item) => {
                    const alreadyUsed = isLibraryItemAlreadyUsed(libraryPickerSource, item);
                    const creatingKey = `${libraryPickerSource}:${item.id}`;
                    return (
                      <div key={item.id} className="library-picker-item">
                        <div className="library-picker-item-main">
                          {renderLibraryItemDetails(libraryPickerSource, item)}
                        </div>
                        <button
                          type="button"
                          disabled={alreadyUsed || creatingFromLibraryId === creatingKey}
                          onClick={() => createActivityFromLibrary(libraryPickerSource, item)}
                        >
                          {alreadyUsed ? "Đã dùng" : creatingFromLibraryId === creatingKey ? "Đang tạo..." : "Tạo hoạt động"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary" onClick={closeLibraryPicker}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Activity form modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "min(820px, 95vw)" }}>
            <div className="modal-header">
              <h2>
                {editingActivity
                  ? editingSourceConfig
                    ? `Chỉnh sửa hoạt động từ ${editingSourceConfig.shortLabel}`
                    : "Chỉnh sửa hoạt động"
                  : "Thêm hoạt động"}
              </h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {formErrors.length > 0 && (
                  <div className="validation-warnings">
                    <p>⚠️ Lỗi:</p>
                    <ul>{formErrors.map((e, i) => <li key={i}>{e}</li>)}</ul>
                  </div>
                )}

                <div className="drawer-container">
                  <div className="drawer-main" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {renderActivityFields()}

                    {/* Feedback */}
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                      <h3 style={{ fontSize: "14px", marginBottom: "8px", color: "var(--text-muted)" }}>Phản hồi</h3>
                      <div className="feedback-group">
                        <div className="field">
                          <label>Phản hồi đúng</label>
                          <input type="text" value={feedbackCorrect} onChange={(e) => setFeedbackCorrect(e.target.value)} placeholder="Giỏi lắm!" />
                        </div>
                        <div className="field">
                          <label>Phản hồi sai</label>
                          <input type="text" value={feedbackWrong} onChange={(e) => setFeedbackWrong(e.target.value)} placeholder="Thử lại nhé!" />
                        </div>
                      </div>
                      {needsVoice && (
                        <div className="field" style={{ marginTop: "8px" }}>
                          <label>Phản hồi gần đúng</label>
                          <input type="text" value={feedbackAlmost} onChange={(e) => setFeedbackAlmost(e.target.value)} placeholder="Gần đúng rồi!" />
                        </div>
                      )}
                    </div>

                    <MultiSelect label="Kỹ năng liên quan" options={skillOptions} selected={activitySkillTags} onChange={setActivitySkillTags} />

                    <div className="form-grid">
                      <div className="field">
                        <label>Thứ tự</label>
                        <input type="number" value={orderIndex} onChange={(e) => setOrderIndex(Number(e.target.value))} />
                      </div>
                      <div className="field">
                        <label>Truy cập</label>
                        <select value={accessType} onChange={(e) => setAccessType(e.target.value as AccessType)}>
                          <option value="FREE">Miễn phí</option>
                          <option value="PREMIUM">Premium</option>
                        </select>
                      </div>
                    </div>
                    <div className="field">
                      <ToggleSwitch id="actIsActive" label="Đang hoạt động" checked={isActive} onChange={setIsActive} />
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="drawer-aside" style={{ width: "260px" }}>
                    <h3>Xem trước</h3>
                    <div className="activity-preview" style={{ marginTop: "12px" }}>
                      {needsFlashcard ? (
                        <>
                          <div className="activity-preview-header">Thẻ học</div>
                          <span className="helper">Bấm vào thẻ để lật kiểm tra.</span>
                          <div
                            className={`flashcard-preview-wrap ${isActivityPreviewFlipped ? "flipped" : ""}`}
                            onClick={() => setIsActivityPreviewFlipped(!isActivityPreviewFlipped)}
                          >
                            <div className="flashcard-inner">
                              <div className="flashcard-face">
                                {imageUrl && (
                                  <img src={imageUrl} alt="" style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", marginBottom: "8px" }} />
                                )}
                                <strong style={{ fontSize: "20px" }}>{prompt || "Mặt trước"}</strong>
                                <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>Mặt trước</span>
                              </div>
                              <div className="flashcard-face flashcard-back">
                                <strong style={{ fontSize: "20px" }}>{flashcardBackText || "Mặt sau"}</strong>
                                {audioUrl && (
                                  <span style={{ fontSize: "12px", marginTop: "8px" }}>Có phát âm</span>
                                )}
                                <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>Mặt sau</span>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="activity-preview-header">{ACTIVITY_TYPE_LABELS[activityType] || activityType}</div>
                          <div className="activity-preview-prompt">{prompt || "Câu hỏi sẽ hiện ở đây"}</div>
                          {imageUrl && (
                            <img src={imageUrl} alt="" className="activity-preview-media" />
                          )}
                          {audioUrl && (
                            <audio src={audioUrl} controls className="activity-preview-audio" />
                          )}
                        </>
                      )}
                      {needsOptions && (
                        <div className="activity-preview-options">
                          {options.filter((o) => o.text).map((o, i) => (
                            <div key={i} className={`activity-preview-option ${o.isCorrect ? "correct" : ""}`}>
                              {o.text}
                            </div>
                          ))}
                        </div>
                      )}
                      {needsVoice && (
                        <div style={{ textAlign: "center", fontSize: "13px", color: "var(--text-muted)", marginTop: "12px" }}>
                          🎤 Trẻ trả lời bằng giọng nói
                        </div>
                      )}
                      {needsParent && (
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "12px", padding: "8px", background: "#f0f9ff", borderRadius: "8px" }}>
                          👨‍👩‍👧 {parentInstruction || "Hướng dẫn phụ huynh"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
                <button type="submit">{editingActivity ? "Cập nhật" : "Tạo mới"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMsg && <div className="toast"><span>✨</span> {toastMsg}</div>}
    </div>
  );
}
