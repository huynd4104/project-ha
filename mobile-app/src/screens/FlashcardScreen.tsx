import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { lessonApi } from "../api/lessonApi";
import { AppButton } from "../components/ui/AppButton";
import { EmptyState } from "../components/ui/EmptyState";
import { IconButton } from "../components/ui/IconButton";
import { LoadingState } from "../components/ui/LoadingState";
import { ProgressBar } from "../components/ui/ProgressBar";
import { Flashcard, Lesson } from "../types";
import { colors } from "../theme/colors";
import { AppIcon } from "../theme/icons";
import { typography } from "../theme/typography";
import { common } from "./common";
import { RemoteImage } from "../components/ui/RemoteImage";
import { learningInsightsService } from "../services/learningInsightsService";

export function FlashcardScreen({ route, navigation }: any) {
  const lesson: Lesson = route.params.lesson;
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const flipAnim = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setLoading(true);
    lessonApi.flashcards(lesson.id)
      .then((res) => setCards(res.data.data || []))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [lesson.id]);

  const flip = () => {
    const next = !flipped;
    Animated.parallel([
      Animated.timing(flipAnim, {
        toValue: next ? 1 : 0,
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0.88, duration: 140, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.97, duration: 140, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
        ]),
      ]),
    ]).start();
    setFlipped(next);
  };

  const markMastered = async () => {
    const card = cards[currentIndex];
    await lessonApi.markFlashcard(card.id, {});
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((v) => v + 1);
      setFlipped(false);
      flipAnim.setValue(0);
      return;
    }
    setLoading(true);
    try {
      const res = await lessonApi.submitFlashcardComplete(lesson.id);
      await learningInsightsService.recordLessonComplete(lesson);
      navigation.replace("Result", { lesson, result: res.data.data, mode: "flashcard", flashcardCount: cards.length });
    } catch (e) {
      navigation.replace("Result", { lesson, result: { xpGained: 0, score: 100, totalQuestions: cards.length, correctAnswers: cards.length }, mode: "flashcard", flashcardCount: cards.length });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <View style={common.screen}><LoadingState message="Đang tải thẻ học..." /></View>;
  if (!cards.length) return <View style={common.screen}><EmptyState icon="▣" title="Chưa có thẻ học" message="Bài học này chưa có flashcard." action={<AppButton title="Quay lại" onPress={() => navigation.goBack()} />} /></View>;

  const current = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;
  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });
  const backRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });

  return (
    <View style={common.screen}>
      <View style={styles.header}>
        <IconButton onPress={() => navigation.goBack()}><AppIcon name="close" /></IconButton>
        <View style={{ flex: 1, marginHorizontal: 12 }}><ProgressBar value={progress} color={colors.purple} /></View>
        <Text style={styles.counter}>{currentIndex + 1}/{cards.length}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={flip} style={styles.cardPressable}>
          <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}> 
            <Animated.View style={[styles.cardFace, styles.cardFront, { transform: [{ perspective: 1200 }, { rotateY: frontRotate }] }]}>
              {current.imageUrl ? <RemoteImage uri={current.imageUrl} style={styles.image} fallback="▣" /> : null}
              <Text style={styles.cardText}>{current.frontText}</Text>
              <Text style={styles.hint}>Mặt trước • Chạm để lật</Text>
            </Animated.View>
            <Animated.View style={[styles.cardFace, styles.cardBack, { transform: [{ perspective: 1200 }, { rotateY: backRotate }] }]}>
              <Text style={[styles.cardText, styles.backText]}>{current.backText}</Text>
              <Text style={styles.hint}>Mặt sau • Chạm để lật</Text>
            </Animated.View>
          </Animated.View>
        </Pressable>
        <AppButton title="Đã nhớ" onPress={markMastered} iconLeft={<AppIcon name="check" color="#FFFFFF" />} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  counter: { ...typography.caption, color: colors.muted, minWidth: 44, textAlign: "right" },
  content: { alignItems: "center", paddingBottom: 36 },
  cardPressable: { width: "100%" },
  card: { width: "100%", minHeight: 390, backgroundColor: colors.card, borderRadius: 32, borderWidth: 2, borderBottomWidth: 8, borderColor: colors.border, borderBottomColor: colors.purple, marginBottom: 18, position: "relative", overflow: "hidden" },
  cardFace: { position: "absolute", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", padding: 24, backfaceVisibility: "hidden" },
  cardFront: { backgroundColor: colors.card },
  cardBack: { backgroundColor: colors.background },
  image: { width: 190, height: 170, resizeMode: "contain", marginBottom: 18, borderRadius: 24, backgroundColor: colors.background },
  cardText: { fontSize: 34, lineHeight: 42, fontWeight: "900", color: colors.text, textAlign: "center" },
  backText: { color: colors.purple },
  hint: { ...typography.caption, color: colors.muted, position: "absolute", bottom: 22 },
});
