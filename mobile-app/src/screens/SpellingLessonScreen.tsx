import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, PanResponder, ScrollView, StyleSheet, Text, View } from "react-native";
import { lessonApi } from "../api/lessonApi";
import { AppButton } from "../components/ui/AppButton";
import { AppCard } from "../components/ui/AppCard";
import { EmptyState } from "../components/ui/EmptyState";
import { IconButton } from "../components/ui/IconButton";
import { LoadingState } from "../components/ui/LoadingState";
import { ProgressBar } from "../components/ui/ProgressBar";
import { Lesson, SpellingActivity } from "../types";
import { colors } from "../theme/colors";
import { AppIcon } from "../theme/icons";
import { typography } from "../theme/typography";
import { learningInsightsService } from "../services/learningInsightsService";
import { common } from "./common";

type SlotRect = { x: number; y: number; width: number; height: number };

export function SpellingLessonScreen({ route, navigation }: any) {
  const lesson: Lesson = route.params.lesson;
  const [activities, setActivities] = useState<SpellingActivity[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [placements, setPlacements] = useState<Record<number, string>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [boardWidth, setBoardWidth] = useState(0);
  const [boardOrigin, setBoardOrigin] = useState({ x: 0, y: 0 });
  const [slotRects, setSlotRects] = useState<Record<number, SlotRect>>({});
  const boardRef = useRef<View | null>(null);

  useEffect(() => {
    navigation.setOptions?.({ title: "Đánh vần" });
  }, [navigation]);

  useEffect(() => {
    setLoading(true);
    lessonApi.spellingActivities(lesson.id)
      .then((res) => setActivities(res.data.data || []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [lesson.id]);

  useEffect(() => {
    if (!boardRef.current) return;
    const timer = setTimeout(() => {
      boardRef.current?.measureInWindow((x, y) => setBoardOrigin({ x, y }));
    }, 0);
    return () => clearTimeout(timer);
  }, [currentIndex, boardWidth]);

  const current = activities[currentIndex];
  const letters = useMemo(() => shuffleLetters(current?.letters?.length ? current.letters : (current?.targetWord || "").split("")), [currentIndex, current?.letters, current?.targetWord]);
  const targetChars = (current?.targetWord || "").split("");
  const assembledWord = targetChars.map((_, index) => placements[index] || "").join("");
  const isCorrect = normalizeWord(assembledWord) === normalizeWord(current?.targetWord || "");

  const resetRound = () => {
    setPlacements({});
    setChecked(false);
    setSlotRects({});
  };

  const recordCurrentAnswer = () => {
    if (!current) return;
    setAnswers((prev) => ({ ...prev, [current.id]: assembledWord }));
  };

  const handleDrop = (char: string, moveX: number, moveY: number) => {
    const relativeX = moveX - boardOrigin.x;
    const relativeY = moveY - boardOrigin.y;
    const targetIndex = Object.entries(slotRects).find(([index, rect]) => {
      const inX = relativeX >= rect.x && relativeX <= rect.x + rect.width;
      const inY = relativeY >= rect.y && relativeY <= rect.y + rect.height;
      return inX && inY && placements[Number(index)] == null;
    })?.[0];

    if (targetIndex == null) return false;
    setPlacements((prev) => ({ ...prev, [Number(targetIndex)]: char }));
    return true;
  };

  const handleContinue = async () => {
    recordCurrentAnswer();
    if (currentIndex + 1 < activities.length) {
      setCurrentIndex((v) => v + 1);
      resetRound();
      return;
    }

    setLoading(true);
    try {
      const finalAnswers = { ...answers, [current.id]: assembledWord };
      const payload = activities.map((item) => ({ itemId: item.id, answer: finalAnswers[item.id] || "" }));
      const res = await lessonApi.submitSpelling(lesson.id, { answers: payload });
      await learningInsightsService.recordLessonComplete(lesson);
      navigation.replace("Result", { lesson, result: res.data.data, mode: "spelling" });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <View style={common.screen}><LoadingState message="Đang tải bài đánh vần..." /></View>;
  if (!activities.length) return <View style={common.screen}><EmptyState icon="🔤" title="Chưa có bài đánh vần" message="Bài học này chưa có nội dung đánh vần." action={<AppButton title="Quay lại" onPress={() => navigation.goBack()} />} /></View>;

  const progress = ((currentIndex + (checked ? 1 : 0)) / activities.length) * 100;

  return (
    <View style={common.screen}>
      <View style={styles.header}>
        <IconButton label="Quay lại" onPress={() => navigation.goBack()}><AppIcon name="close" /></IconButton>
        <View style={{ flex: 1, marginHorizontal: 12 }}><ProgressBar value={progress} color={colors.pink} /></View>
        <Text style={styles.counter}>{currentIndex + 1}/{activities.length}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <AppCard variant="pink" style={styles.promptCard}>
          <Text style={styles.promptLabel}>Ghép chữ</Text>
          <Text style={styles.promptText}>{current.promptText}</Text>
          <Text style={styles.hint}>{current.hint || `Tạo thành từ: ${current.targetWord}`}</Text>
        </AppCard>

        <View ref={boardRef as any} onLayout={() => boardRef.current?.measureInWindow((x, y) => setBoardOrigin({ x, y }))} style={styles.board}>
          <View style={styles.slotRow}>
            {targetChars.map((char, index) => (
              <View
                key={`${char}-${index}`}
                onLayout={(e) => setSlotRects((prev) => ({ ...prev, [index]: e.nativeEvent.layout }))}
                style={[styles.slot, placements[index] ? styles.slotFilled : null]}
              >
                <Text style={styles.slotText}>{placements[index] || "_"}</Text>
              </View>
            ))}
          </View>

          <View style={styles.bank}>
            {letters.map((char, index) => (
              <DraggableLetterChip
                key={`${char}-${index}`}
                char={char}
                index={index}
                onDrop={handleDrop}
                disabled={checked}
                boardWidth={boardWidth || 320}
                isUsed={Object.values(placements).includes(char)}
                onStart={() => null}
              />
            ))}
          </View>
        </View>

        <AppButton title="Kiểm tra" disabled={checked || Object.keys(placements).length !== targetChars.length} onPress={() => { recordCurrentAnswer(); setChecked(true); }} />
        {checked ? <Text style={styles.resultText}>{isCorrect ? "Con ghép đúng rồi!" : `Đáp án đúng là ${current.targetWord}`}</Text> : null}
        {checked ? <AppButton title={currentIndex + 1 === activities.length ? "Xem kết quả" : "Tiếp tục"} variant="secondary" onPress={handleContinue} /> : null}
      </ScrollView>
    </View>
  );
}

function DraggableLetterChip({ char, index, onDrop, disabled, boardWidth, isUsed }: { char: string; index: number; onDrop: (char: string, moveX: number, moveY: number) => boolean; disabled: boolean; boardWidth: number; isUsed: boolean; onStart: () => void }) {
  const pan = useRef(new Animated.ValueXY({ x: 20 + (index % 4) * 74, y: 8 + Math.floor(index / 4) * 62 })).current;
  const scale = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled && !isUsed,
      onMoveShouldSetPanResponder: () => !disabled && !isUsed,
      onPanResponderGrant: () => {
        scale.setValue(1.05);
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_evt, gesture) => {
        scale.setValue(1);
        const dropped = onDrop(char, gesture.moveX, gesture.moveY);
        if (!dropped) {
          Animated.spring(pan, { toValue: { x: 20 + (index % 4) * 74, y: 8 + Math.floor(index / 4) * 62 }, useNativeDriver: false }).start();
        }
      },
      onPanResponderTerminate: () => {
        scale.setValue(1);
        Animated.spring(pan, { toValue: { x: 20 + (index % 4) * 74, y: 8 + Math.floor(index / 4) * 62 }, useNativeDriver: false }).start();
      }
    })
  ).current;

  if (isUsed) return null;

  return (
    <Animated.View {...panResponder.panHandlers} style={[styles.letterChip, { transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale }] }]}>
      <Text style={styles.letterText}>{char}</Text>
    </Animated.View>
  );
}

function shuffleLetters<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function normalizeWord(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  counter: { ...typography.caption, color: colors.muted, minWidth: 44, textAlign: "right" },
  content: { paddingBottom: 36 },
  promptCard: { marginBottom: 16 },
  promptLabel: { ...typography.caption, color: colors.primaryDark, textTransform: "uppercase", letterSpacing: 1 },
  promptText: { ...typography.title, fontSize: 24, lineHeight: 30, color: colors.text, marginTop: 8 },
  hint: { ...typography.body, color: colors.text, marginTop: 10 },
  board: { minHeight: 310, backgroundColor: colors.card, borderRadius: 28, borderWidth: 2, borderBottomWidth: 6, borderColor: colors.border, borderBottomColor: colors.purple, marginBottom: 16, position: "relative", overflow: "hidden" },
  slotRow: { flexDirection: "row", justifyContent: "center", flexWrap: "wrap", gap: 10, paddingHorizontal: 16, paddingTop: 26, minHeight: 110 },
  slot: { width: 58, height: 58, borderRadius: 16, borderWidth: 2, borderStyle: "dashed", borderColor: colors.purple, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  slotFilled: { backgroundColor: colors.successSoft, borderStyle: "solid" },
  slotText: { fontSize: 24, fontWeight: "900", color: colors.text },
  bank: { minHeight: 180, marginTop: 18 },
  letterChip: { position: "absolute", width: 58, height: 58, borderRadius: 18, backgroundColor: colors.purple, alignItems: "center", justifyContent: "center", elevation: 2 },
  letterText: { ...typography.subtitle, color: "#FFF", fontSize: 22 },
  resultText: { ...typography.body, color: colors.text, marginVertical: 12, textAlign: "center" },
});
