import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { lessonApi } from "../api/lessonApi";
import { AnswerOption, AnswerState } from "../components/learning/AnswerOption";
import { FeedbackSheet } from "../components/learning/FeedbackSheet";
import { AppButton } from "../components/ui/AppButton";
import { EmptyState } from "../components/ui/EmptyState";
import { IconButton } from "../components/ui/IconButton";
import { LoadingState } from "../components/ui/LoadingState";
import { ProgressBar } from "../components/ui/ProgressBar";
import { RemoteImage } from "../components/ui/RemoteImage";
import { Lesson, Question } from "../types";
import { colors } from "../theme/colors";
import { AppIcon } from "../theme/icons";
import { typography } from "../theme/typography";
import { learningInsightsService } from "../services/learningInsightsService";
import { common } from "./common";
import { getLessonMeta } from "../utils/lessonTypes";

export function MathLessonScreen({ route, navigation }: any) {
  const lesson: Lesson = route.params.lesson;
  const meta = getLessonMeta(lesson.type);
  const resultMode = lesson.type === "MATH" ? "math" : lesson.type.toLowerCase();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions?.({ title: meta.label });
  }, [navigation, meta.label]);

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
      return;
    }

    setLoading(true);
    try {
      const finalAnswers = { ...answers, [current.id]: selectedOption! };
      const payload = Object.entries(finalAnswers).map(([questionId, selectedOption]) => ({ questionId, selectedOption }));
      const res = await lessonApi.submitMath(lesson.id, { answers: payload });
      await learningInsightsService.recordLessonComplete(lesson);
      navigation.replace("Result", { lesson, result: res.data.data, mode: resultMode });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <View style={common.screen}><LoadingState message="Đang tải câu hỏi..." /></View>;
  if (!questions.length) return <View style={common.screen}><EmptyState icon="🧩" title="Chưa có câu hỏi" message={`Bài học ${meta.shortLabel} này chưa có nội dung.`} action={<AppButton title="Quay lại" onPress={() => navigation.goBack()} />} /></View>;

  const progress = ((currentIndex + (hasChecked ? 1 : 0)) / questions.length) * 100;

  return (
    <View style={common.screen}>
      <View style={styles.header}>
        <IconButton label="Quay lại" onPress={() => navigation.goBack()}><AppIcon name="close" /></IconButton>
        <View style={{ flex: 1, marginHorizontal: 12 }}><ProgressBar value={progress} /></View>
        <Text style={styles.counter}>{currentIndex + 1}/{questions.length}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.questionCard}>
          {current.imageUrl ? <RemoteImage uri={current.imageUrl} style={styles.image} fallback="#" /> : <View style={styles.mathIcon}><AppIcon name="math" size={42} color={colors.orange} /></View>}
          <Text style={styles.question}>{current.questionText}</Text>
        </View>

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

      {!hasChecked ? (
        <View style={styles.footer}><AppButton title="Kiểm tra" disabled={!selectedOption} variant={selectedOption ? "primary" : "secondary"} onPress={handleCheck} /></View>
      ) : null}

      <FeedbackSheet
        visible={hasChecked}
        correct={isCorrect}
        title={isCorrect ? "Đúng rồi!" : "Gần đúng rồi"}
        message={isCorrect ? `Bé làm rất tốt với bài ${meta.shortLabel}.` : `Đáp án đúng là ${current.correctOption}: ${(current as any)[`option${current.correctOption}`]}`}
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
  questionCard: { backgroundColor: colors.card, borderRadius: 28, borderWidth: 2, borderBottomWidth: 6, borderColor: colors.border, borderBottomColor: "#D1D5DB", padding: 20, alignItems: "center", marginBottom: 16 },
  image: { width: "100%", height: 170, resizeMode: "contain", borderRadius: 22, backgroundColor: colors.background, marginBottom: 14 },
  mathIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.yellowSoft, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  question: { ...typography.title, fontSize: 24, lineHeight: 30, color: colors.text, textAlign: "center" },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: colors.background, paddingTop: 10, paddingBottom: 18 },
});
