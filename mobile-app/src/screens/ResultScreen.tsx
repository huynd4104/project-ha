import { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../components/ui/AppButton";
import { AppCard } from "../components/ui/AppCard";
import { MascotBubble } from "../components/ui/MascotBubble";
import { XPProgressBar } from "../components/ui/XPProgressBar";
import { BadgePill } from "../components/ui/BadgePill";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { common } from "./common";
import { soundService } from "../services/soundService";
import { RemoteImage } from "../components/ui/RemoteImage";

export function ResultScreen({ route, navigation }: any) {
  const { lesson, result, mode = "lesson", flashcardCount } = route.params || {};
  const xpGained = result?.xpGained ?? 0;
  const levelStats = result?.levelStats || { level: 1, xpInCurrentLevel: xpGained, xpToNextLevel: 100 };

  useEffect(() => {
    soundService.playReward();
  }, []);

  const score = typeof result?.score === "number" ? result.score : 100;
  const total = result?.totalQuestions || flashcardCount || 1;
  const correct = result?.correctAnswers ?? total;

  return (
    <ScrollView style={common.screen} contentContainerStyle={styles.content}>
      <MascotBubble
        imageUrl={lesson?.npc?.imageUrl}
        name={lesson?.npc?.name || "Bạn đồng hành"}
        message={mode === "flashcard" ? "Bé ôn thẻ rất tốt. Mỗi ngày một chút là đủ tiến bộ." : mode === "thinking" ? "Con suy luận rất tốt." : mode === "spelling" ? "Con ghép chữ rất giỏi." : mode === "rhyme" ? "Con ghép vần rất hay." : "Bé đã hoàn thành bài học rồi. Cùng nhận phần thưởng nhé!"}
      />

      <Text style={styles.hero}>Tuyệt vời!</Text>
      <Text style={styles.subtitle}>Bé đã hoàn thành {lesson?.title ? `"${lesson.title}"` : "bài học"}.</Text>

      <AppCard variant="green" style={styles.scoreCard}>
        <Text style={styles.score}>{score}%</Text>
        <Text style={styles.scoreText}>Đúng {correct}/{total}</Text>
        <View style={styles.statRow}>
          <View style={styles.statPill}><Text style={styles.statValue}>+{xpGained}</Text><Text style={styles.statLabel}>XP</Text></View>
          <View style={styles.statPill}><Text style={styles.statValue}>{result?.streak?.currentStreak || 1}</Text><Text style={styles.statLabel}>ngày</Text></View>
        </View>
      </AppCard>

      <AppCard variant="blue">
        <Text style={styles.sectionTitle}>Tiến độ cấp độ</Text>
        <XPProgressBar level={levelStats.level} xpInCurrentLevel={levelStats.xpInCurrentLevel} xpToNextLevel={levelStats.xpToNextLevel} />
      </AppCard>

      {result?.newBadges?.length ? (
        <AppCard variant="yellow">
          <Text style={styles.sectionTitle}>Huy hiệu mới</Text>
          {result.newBadges.map((badge: any) => (
            <View key={badge.id} style={styles.badgeRow}>
              {badge.iconUrl ? <RemoteImage uri={badge.iconUrl} style={styles.badgeImage} fallback="🏅" /> : <Text style={styles.badgeEmoji}>🏅</Text>}
              <View style={{ flex: 1 }}>
                <Text style={styles.badgeName}>{badge.name}</Text>
                <Text style={styles.badgeDesc}>{badge.description}</Text>
              </View>
              <BadgePill status="new" />
            </View>
          ))}
        </AppCard>
      ) : null}

      <AppButton title="Tiếp tục học" onPress={() => navigation.navigate("LearningPath")} />
      <AppButton title="Xem phần thưởng" variant="yellow" onPress={() => navigation.navigate("Rewards")} />
      <AppButton title="Về trang chủ" variant="secondary" onPress={() => navigation.navigate("Home")} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 36 },
  hero: { ...typography.title, color: colors.text, textAlign: "center", marginTop: 22 },
  subtitle: { ...typography.body, color: colors.muted, textAlign: "center", marginBottom: 18 },
  scoreCard: { alignItems: "center" },
  score: { fontSize: 64, fontWeight: "900", color: colors.primaryDark, lineHeight: 72 },
  scoreText: { ...typography.subtitle, color: colors.text, marginBottom: 14 },
  statRow: { flexDirection: "row", gap: 12 },
  statPill: { backgroundColor: "rgba(255,255,255,0.75)", borderRadius: 18, paddingHorizontal: 18, paddingVertical: 10, alignItems: "center", minWidth: 92 },
  statValue: { ...typography.title, color: colors.text },
  statLabel: { ...typography.caption, color: colors.muted },
  sectionTitle: { ...typography.subtitle, color: colors.text, marginBottom: 12 },
  badgeRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  badgeImage: { width: 44, height: 44, resizeMode: "contain", marginRight: 10 },
  badgeEmoji: { fontSize: 34, marginRight: 10 },
  badgeName: { ...typography.button, color: colors.text },
  badgeDesc: { ...typography.caption, color: colors.muted },
});
