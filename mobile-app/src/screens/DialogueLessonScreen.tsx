import { useEffect, useState } from "react";
import { Audio } from "expo-av";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { lessonApi } from "../api/lessonApi";
import { AnswerOption, AnswerState } from "../components/learning/AnswerOption";
import { FeedbackSheet } from "../components/learning/FeedbackSheet";
import { AppButton } from "../components/ui/AppButton";
import { AppCard } from "../components/ui/AppCard";
import { EmptyState } from "../components/ui/EmptyState";
import { IconButton } from "../components/ui/IconButton";
import { LoadingState } from "../components/ui/LoadingState";
import { MascotBubble } from "../components/ui/MascotBubble";
import { ProgressBar } from "../components/ui/ProgressBar";
import { Dialogue, Lesson } from "../types";
import { colors } from "../theme/colors";
import { AppIcon } from "../theme/icons";
import { typography } from "../theme/typography";
import { learningInsightsService } from "../services/learningInsightsService";
import { common } from "./common";

export function DialogueLessonScreen({ route, navigation }: any) {
  const lesson: Lesson = route.params.lesson;
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setLoading(true);
    lessonApi.dialogues(lesson.id)
      .then((res) => setDialogues(res.data.data || []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [lesson.id]);

  useEffect(() => () => { sound?.unloadAsync(); }, [sound]);

  const current = dialogues[currentIndex];
  const isCorrect = selectedOption === current?.correctOption;

  async function playAudio(url?: string) {
    if (!url) return;
    try {
      setIsPlaying(true);
      if (sound) await sound.unloadAsync();
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: true });
      setSound(newSound);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) setIsPlaying(false);
      });
    } catch {
      setIsPlaying(false);
    }
  }

  const handleCheck = () => {
    if (!selectedOption || !current) return;
    setAnswers((prev) => ({ ...prev, [current.id]: selectedOption }));
    setHasChecked(true);
  };

  const handleContinue = async () => {
    if (sound) {
      await sound.stopAsync();
      setIsPlaying(false);
    }
    if (currentIndex + 1 < dialogues.length) {
      setCurrentIndex((v) => v + 1);
      setSelectedOption(null);
      setHasChecked(false);
      return;
    }
    setLoading(true);
    try {
      const finalAnswers = { ...answers, [current.id]: selectedOption! };
      const payload = Object.entries(finalAnswers).map(([dialogueId, selectedOption]) => ({ dialogueId, selectedOption }));
      const res = await lessonApi.submitDialogue(lesson.id, { dialogueAnswers: payload });
      await learningInsightsService.recordLessonComplete(lesson);
      navigation.replace("Result", { lesson, result: res.data.data, mode: "dialogue" });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <View style={common.screen}><LoadingState message="Đang tải hội thoại..." /></View>;
  if (!dialogues.length) return <View style={common.screen}><EmptyState icon="💬" title="Chưa có hội thoại" message="Bài học này chưa có câu thoại." action={<AppButton title="Quay lại" onPress={() => navigation.goBack()} />} /></View>;

  const progress = ((currentIndex + (hasChecked ? 1 : 0)) / dialogues.length) * 100;

  return (
    <View style={common.screen}>
      <View style={styles.header}>
        <IconButton label="Quay lại" onPress={() => navigation.goBack()}><AppIcon name="close" /></IconButton>
        <View style={{ flex: 1, marginHorizontal: 12 }}><ProgressBar value={progress} color={colors.sky} /></View>
        <Text style={styles.counter}>{currentIndex + 1}/{dialogues.length}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <AppCard variant="blue">
          <MascotBubble imageUrl={lesson.npc?.imageUrl} name={lesson.npc?.name || current.title} message={current.sceneText} />
          <AppButton
            title={current.audioUrl ? (isPlaying ? "Đang phát..." : "Nghe thoại") : "Audio sẽ được bổ sung sau"}
            variant={current.audioUrl ? "secondary" : "ghost"}
            disabled={!current.audioUrl}
            onPress={() => playAudio(current.audioUrl)}
            iconLeft={<AppIcon name="sound" color={current.audioUrl ? colors.sky : colors.muted} />}
          />
        </AppCard>

        <View style={styles.questionCard}>
          <Text style={styles.question}>{current.questionText}</Text>
        </View>

        {(["A", "B", "C", "D"] as const).map((key) => {
          const optionState: AnswerState = hasChecked
            ? current.correctOption === key ? "correct" : selectedOption === key ? "wrong" : "default"
            : selectedOption === key ? "selected" : "default";
          return <AnswerOption key={key} label={key} text={(current as any)[`option${key}`]} state={optionState} disabled={hasChecked} onPress={() => setSelectedOption(key)} />;
        })}
      </ScrollView>

      {!hasChecked ? <View style={styles.footer}><AppButton title="Kiểm tra" disabled={!selectedOption} variant={selectedOption ? "primary" : "secondary"} onPress={handleCheck} /></View> : null}

      <FeedbackSheet
        visible={hasChecked}
        correct={isCorrect}
        title={isCorrect ? "Chính xác!" : "Mình thử lại nhé"}
        message={isCorrect ? "Bé hiểu tình huống rất tốt." : `Đáp án đúng là ${current.correctOption}: ${(current as any)[`option${current.correctOption}`]}`}
        buttonTitle={currentIndex + 1 === dialogues.length ? "Xem kết quả" : "Tiếp tục"}
        onContinue={handleContinue}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  counter: { ...typography.caption, color: colors.muted, minWidth: 44, textAlign: "right" },
  content: { paddingBottom: 170 },
  questionCard: { backgroundColor: colors.card, borderRadius: 26, borderWidth: 2, borderBottomWidth: 6, borderColor: colors.border, borderBottomColor: "#D1D5DB", padding: 20, marginBottom: 12 },
  question: { ...typography.title, fontSize: 23, lineHeight: 30, color: colors.text, textAlign: "center" },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: colors.background, paddingTop: 10, paddingBottom: 18 },
});
