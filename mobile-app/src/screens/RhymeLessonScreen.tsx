import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { lessonApi } from "../api/lessonApi";
import { AppButton } from "../components/ui/AppButton";
import { AppCard } from "../components/ui/AppCard";
import { EmptyState } from "../components/ui/EmptyState";
import { IconButton } from "../components/ui/IconButton";
import { LoadingState } from "../components/ui/LoadingState";
import { ProgressBar } from "../components/ui/ProgressBar";
import { Lesson, RhymeChallenge } from "../types";
import { colors } from "../theme/colors";
import { AppIcon } from "../theme/icons";
import { typography } from "../theme/typography";
import { learningInsightsService } from "../services/learningInsightsService";
import { common } from "./common";

export function RhymeLessonScreen({ route, navigation }: any) {
  const lesson: Lesson = route.params.lesson;
  const [challenges, setChallenges] = useState<RhymeChallenge[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [hasChecked, setHasChecked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions?.({ title: "Ghép vần" });
  }, [navigation]);

  useEffect(() => {
    setLoading(true);
    lessonApi.rhymeChallenges(lesson.id)
      .then((res) => setChallenges(res.data.data || []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [lesson.id]);

  const current = challenges[currentIndex];
  const isCorrect = selectedOption === current?.correctOption;
  const options = useMemo(() => [current?.optionA, current?.optionB, current?.optionC, current?.optionD].filter(Boolean), [current]);

  const recordCurrentAnswer = () => {
    if (!current || !selectedOption) return;
    setAnswers((prev) => ({ ...prev, [current.id]: selectedOption }));
  };

  const handleCheck = () => {
    if (!selectedOption || !current) return;
    recordCurrentAnswer();
    setHasChecked(true);
  };

  const handleContinue = async () => {
    recordCurrentAnswer();
    if (currentIndex + 1 < challenges.length) {
      setCurrentIndex((v) => v + 1);
      setSelectedOption(null);
      setHasChecked(false);
      return;
    }

    setLoading(true);
    try {
      const finalAnswers = { ...answers, [current.id]: selectedOption || "" };
      const payload = challenges.map((item) => {
        const selectedKey = finalAnswers[item.id] || "";
        const selectedWord = (item as any)[`option${selectedKey}`] || "";
        return { itemId: item.id, answer: selectedWord, selectedOption: selectedKey };
      });
      const res = await lessonApi.submitRhyme(lesson.id, { answers: payload });
      await learningInsightsService.recordLessonComplete(lesson);
      navigation.replace("Result", { lesson, result: res.data.data, mode: "rhyme" });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <View style={common.screen}><LoadingState message="Đang tải bài ghép vần..." /></View>;
  if (!challenges.length) return <View style={common.screen}><EmptyState icon="🔗" title="Chưa có bài ghép vần" message="Bài học này chưa có nội dung ghép vần." action={<AppButton title="Quay lại" onPress={() => navigation.goBack()} />} /></View>;

  const progress = ((currentIndex + (hasChecked ? 1 : 0)) / challenges.length) * 100;

  return (
    <View style={common.screen}>
      <View style={styles.header}>
        <IconButton label="Quay lại" onPress={() => navigation.goBack()}><AppIcon name="close" /></IconButton>
        <View style={{ flex: 1, marginHorizontal: 12 }}><ProgressBar value={progress} color={colors.yellow} /></View>
        <Text style={styles.counter}>{currentIndex + 1}/{challenges.length}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <AppCard variant="yellow" style={styles.promptCard}>
          <Text style={styles.promptLabel}>Ghép âm/vần</Text>
          <Text style={styles.promptWord}>{current.promptWord}</Text>
          <Text style={styles.question}>{current.questionText}</Text>
        </AppCard>

        <View style={styles.matchBoard}>
          <Text style={styles.boardLabel}>Chọn từ có cùng vần</Text>
          <View style={styles.optionGrid}>
            {options.map((option, index) => {
              const key = [`A`, `B`, `C`, `D`][index];
              const active = selectedOption === key;
              return (
                <Text
                  key={key}
                  onPress={() => !hasChecked && setSelectedOption(key)}
                  style={[styles.optionChip, active && styles.optionChipActive, hasChecked && current.correctOption === key && styles.optionChipCorrect]}
                >
                  {option}
                </Text>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {!hasChecked ? <View style={styles.footer}><AppButton title="Kiểm tra" disabled={!selectedOption} variant={selectedOption ? "primary" : "secondary"} onPress={handleCheck} /></View> : null}

      {hasChecked ? (
        <View style={styles.feedbackBox}>
          <Text style={styles.feedbackTitle}>{isCorrect ? "Ghép đúng!" : "Gần đúng rồi"}</Text>
          <Text style={styles.feedbackText}>{isCorrect ? "Con đã ghép được đúng vần rồi." : `Đáp án đúng là ${current.correctOption}: ${current["option" + current.correctOption as keyof RhymeChallenge]}`}</Text>
          <AppButton title={currentIndex + 1 === challenges.length ? "Xem kết quả" : "Tiếp tục"} onPress={handleContinue} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  counter: { ...typography.caption, color: colors.muted, minWidth: 44, textAlign: "right" },
  content: { paddingBottom: 170 },
  promptCard: { marginBottom: 16 },
  promptLabel: { ...typography.caption, color: colors.primaryDark, textTransform: "uppercase", letterSpacing: 1 },
  promptWord: { ...typography.title, fontSize: 36, lineHeight: 42, color: colors.text, marginTop: 8 },
  question: { ...typography.body, color: colors.text, marginTop: 10 },
  matchBoard: { backgroundColor: colors.card, borderRadius: 28, borderWidth: 2, borderBottomWidth: 6, borderColor: colors.border, borderBottomColor: colors.yellowDark, padding: 18, marginBottom: 16 },
  boardLabel: { ...typography.button, color: colors.text, marginBottom: 12 },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  optionChip: { minWidth: 74, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 18, backgroundColor: colors.background, color: colors.text, fontWeight: "900", textAlign: "center" },
  optionChipActive: { backgroundColor: colors.yellowSoft, borderWidth: 2, borderColor: colors.yellow },
  optionChipCorrect: { backgroundColor: colors.successSoft, borderColor: colors.primary },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: colors.background, paddingTop: 10, paddingBottom: 18 },
  feedbackBox: { position: "absolute", left: 16, right: 16, bottom: 16, backgroundColor: "#fff", borderRadius: 22, padding: 16, borderWidth: 2, borderColor: colors.border, borderBottomWidth: 6, borderBottomColor: colors.yellow },
  feedbackTitle: { ...typography.subtitle, color: colors.text, marginBottom: 8 },
  feedbackText: { ...typography.body, color: colors.text, marginBottom: 12 },
});
