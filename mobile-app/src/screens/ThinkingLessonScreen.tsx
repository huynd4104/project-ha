import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { lessonApi } from "../api/lessonApi";
import { AnswerOption, AnswerState } from "../components/learning/AnswerOption";
import { FeedbackSheet } from "../components/learning/FeedbackSheet";
import { AppButton } from "../components/ui/AppButton";
import { AppCard } from "../components/ui/AppCard";
import { EmptyState } from "../components/ui/EmptyState";
import { IconButton } from "../components/ui/IconButton";
import { LoadingState } from "../components/ui/LoadingState";
import { ProgressBar } from "../components/ui/ProgressBar";
import { Lesson, Question } from "../types";
import { colors } from "../theme/colors";
import { AppIcon } from "../theme/icons";
import { typography } from "../theme/typography";
import { learningInsightsService } from "../services/learningInsightsService";
import { common } from "./common";

export function ThinkingLessonScreen({ route, navigation }: any) {
  const lesson: Lesson = route.params.lesson;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    navigation.setOptions?.({ title: "Tư duy" });
  }, [navigation]);

  useEffect(() => {
    setLoading(true);
    lessonApi.questions(lesson.id)
      .then((res) => setQuestions(res.data.data || []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [lesson.id]);

  const current = questions[currentIndex];
  const isCorrect = selectedOption === current?.correctOption;

  const handleCheck = () => {
    if (!selectedOption || !current) return;
    setAnswers((prev) => ({ ...prev, [current.id]: selectedOption }));
    setHasChecked(true);
  };

  const handleContinue = async () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((v) => v + 1);
      setSelectedOption(null);
      setHasChecked(false);
      setShowHint(false);
      return;
    }

    setLoading(true);
    try {
      const finalAnswers = { ...answers, [current.id]: selectedOption! };
      const payload = Object.entries(finalAnswers).map(([questionId, selectedOption]) => ({ questionId, selectedOption }));
      const res = await lessonApi.submitThinking(lesson.id, { answers: payload });
      await learningInsightsService.recordLessonComplete(lesson);
      navigation.replace("Result", { lesson, result: res.data.data, mode: "thinking" });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <View style={common.screen}><LoadingState message="Đang tải câu đố tư duy..." /></View>;
  if (!questions.length) return <View style={common.screen}><EmptyState icon="🧠" title="Chưa có câu đố" message="Bài tư duy này chưa có nội dung." action={<AppButton title="Quay lại" onPress={() => navigation.goBack()} />} /></View>;

  const progress = ((currentIndex + (hasChecked ? 1 : 0)) / questions.length) * 100;
  const hintText = current.explanation || "Con hãy nhìn kỹ tình huống và chọn đáp án hợp lý nhất.";

  return (
    <View style={common.screen}>
      <View style={styles.header}>
        <IconButton label="Quay lại" onPress={() => navigation.goBack()}><AppIcon name="close" /></IconButton>
        <View style={{ flex: 1, marginHorizontal: 12 }}><ProgressBar value={progress} color={colors.primary} /></View>
        <Text style={styles.counter}>{currentIndex + 1}/{questions.length}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <AppCard variant="green" style={styles.caseCard}>
          <Text style={styles.caseLabel}>Câu đố logic</Text>
          <Text style={styles.caseText}>{current.questionText}</Text>
          <AppButton title={showHint ? "Đã xem gợi ý" : "Xem gợi ý"} variant="secondary" onPress={() => setShowHint((v) => !v)} />
          {showHint ? <Text style={styles.hint}>{hintText}</Text> : null}
        </AppCard>

        {(["A", "B", "C", "D"] as const).map((key) => {
          const optionState: AnswerState = hasChecked
            ? current.correctOption === key ? "correct" : selectedOption === key ? "wrong" : "default"
            : selectedOption === key ? "selected" : "default";
          return (
            <AnswerOption
              key={key}
              label={key}
              text={(current as any)[`option${key}`]}
              state={optionState}
              disabled={hasChecked}
              onPress={() => setSelectedOption(key)}
            />
          );
        })}
      </ScrollView>

      {!hasChecked ? <View style={styles.footer}><AppButton title="Xác nhận suy luận" disabled={!selectedOption} variant={selectedOption ? "primary" : "secondary"} onPress={handleCheck} /></View> : null}

      <FeedbackSheet
        visible={hasChecked}
        correct={isCorrect}
        title={isCorrect ? "Suy luận tốt!" : "Thử lại nhé"}
        message={isCorrect ? "Con chọn đáp án rất hợp lý." : `Đáp án đúng là ${current.correctOption}: ${(current as any)[`option${current.correctOption}`]}`}
        explanation={current.explanation}
        buttonTitle={currentIndex + 1 === questions.length ? "Xem kết quả" : "Tiếp tục"}
        onContinue={handleContinue}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  counter: { ...typography.caption, color: colors.muted, minWidth: 44, textAlign: "right" },
  content: { paddingBottom: 170 },
  caseCard: { marginBottom: 16 },
  caseLabel: { ...typography.caption, color: colors.primaryDark, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 },
  caseText: { ...typography.title, fontSize: 24, lineHeight: 30, color: colors.text, marginBottom: 12 },
  hint: { ...typography.body, color: colors.text, marginTop: 12, backgroundColor: colors.background, padding: 12, borderRadius: 16 },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: colors.background, paddingTop: 10, paddingBottom: 18 },
});
