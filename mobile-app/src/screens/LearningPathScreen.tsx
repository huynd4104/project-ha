import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { lessonApi } from "../api/lessonApi";
import { AppCard } from "../components/ui/AppCard";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingState } from "../components/ui/LoadingState";
import { StreakPill } from "../components/ui/StreakPill";
import { XPProgressBar } from "../components/ui/XPProgressBar";
import { LearningMap, LessonMapItem } from "../components/learning/LearningMap";
import { Lesson } from "../types";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { learningInsightsService } from "../services/learningInsightsService";
import { common } from "./common";

const ALLOW_ALL_LESSONS_FOR_DEMO = false;

export function LearningPathScreen({ navigation }: any) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      lessonApi.list()
        .then(async (res) => {
          setLessons(res.data.data || []);
          setFavoriteIds(await learningInsightsService.getFavoriteIds());
        })
        .catch(() => null)
        .finally(() => setLoading(false));
    }, [])
  );

  const items: LessonMapItem[] = [];
  let prevCompleted = true;
  let firstOpenAssigned = false;
  lessons.forEach((lesson) => {
    const isCompleted = !!(lesson.progress && lesson.progress.some((p: any) => p.status === "COMPLETED"));
    const unlocked = ALLOW_ALL_LESSONS_FOR_DEMO || prevCompleted;
    const status = isCompleted ? "completed" : unlocked && !firstOpenAssigned ? "current" : unlocked ? "available" : "locked";
    if (!isCompleted && unlocked && !firstOpenAssigned) firstOpenAssigned = true;
    items.push({ lesson, status });
    prevCompleted = isCompleted;
  });

  if (loading) {
    return <View style={common.screen}><LoadingState message="Đang dựng bản đồ học tập..." /></View>;
  }

  return (
    <ScrollView style={common.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Lộ trình học của bé</Text>
      <Text style={styles.subtitle}>Mỗi ngày một hoạt động nhỏ. Chọn một điểm sáng trên bản đồ để bắt đầu.</Text>

      <AppCard variant="blue" style={styles.topCard}>
        <View style={styles.topRow}>
          <View style={styles.avatar}><Text style={styles.avatarText}>🧭</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.topTitle}>Hành trình hôm nay</Text>
            <XPProgressBar level={1} xpInCurrentLevel={Math.min(items.filter(i => i.status === "completed").length * 20, 100)} xpToNextLevel={100} />
          </View>
        </View>
        <View style={styles.pills}><StreakPill count={0} /><Text style={styles.demoNote}>Mở khóa theo thứ tự bài học</Text></View>
      </AppCard>

      {items.length === 0 ? (
        <EmptyState icon="⌁" title="Chưa có bài học" message="Admin cần cấu hình bài học trước khi bản đồ hiển thị." />
      ) : (
        <>
        {favoriteIds.length ? (
          <AppCard variant="pink">
            <Text style={styles.topTitle}>Khóa học yêu thích</Text>
            <Text style={styles.favoriteText}>
              {lessons.filter((lesson) => favoriteIds.includes(lesson.id)).map((lesson) => lesson.title).slice(0, 3).join(" • ")}
            </Text>
          </AppCard>
        ) : null}
        <LearningMap items={items} onOpenLesson={(lesson) => navigation.navigate("LessonDetail", { lesson })} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 48 },
  title: { ...typography.title, color: colors.text },
  subtitle: { ...typography.body, color: colors.muted, marginBottom: 16 },
  topCard: { marginBottom: 24 },
  topRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.card, alignItems: "center", justifyContent: "center", marginRight: 14 },
  avatarText: { fontSize: 30 },
  topTitle: { ...typography.subtitle, color: colors.text, marginBottom: 8 },
  pills: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  demoNote: { ...typography.caption, color: colors.muted },
  favoriteText: { ...typography.body, color: colors.text },
});
