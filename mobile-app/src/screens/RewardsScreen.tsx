import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { childApi } from "../api/childApi";
import { progressApi } from "../api/progressApi";
import { BadgeCard } from "../components/gamification/BadgeCard";
import { DailyMissionCard } from "../components/gamification/DailyMissionCard";
import { LevelCard } from "../components/gamification/LevelCard";
import { AppCard } from "../components/ui/AppCard";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingState } from "../components/ui/LoadingState";
import { StreakPill } from "../components/ui/StreakPill";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { calculateLevel } from "../utils/gamification";
import { getLessonActivityType } from "../utils/lessonTypes";
import { common } from "./common";

export function RewardsScreen({ navigation }: any) {
  const [child, setChild] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [missions, setMissions] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const loadData = async () => {
    const childRes = await childApi.list();
    const activeChild = childRes.data.data[0] || null;
    setChild(activeChild);
    if (activeChild) {
      const [sumRes, misRes, badRes] = await Promise.all([
        progressApi.summary(activeChild.id),
        progressApi.dailyMissions(activeChild.id),
        progressApi.badges(activeChild.id),
      ]);
      setSummary(sumRes.data.data);
      setMissions(misRes.data.data || []);
      setBadges(badRes.data.data || []);
    }
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    loadData().catch((err) => console.error(err)).finally(() => setLoading(false));
  }, []));

  const handleClaimReward = async (progressId: string) => {
    if (!child) return;
    setClaimingId(progressId);
    try {
      const res = await progressApi.claimMissionReward(progressId, child.id);
      Alert.alert("Nhận thưởng", `Bé nhận được +${res.data.data.xpAmount} XP.`);
      await loadData();
    } catch (err: any) {
      Alert.alert("Lỗi", err.message || "Không thể nhận thưởng lúc này.");
    } finally {
      setClaimingId(null);
    }
  };

  if (loading) return <View style={common.screen}><LoadingState message="Đang tải phần thưởng..." /></View>;
  if (!child) return <View style={common.screen}><EmptyState icon="🧒" title="Chưa có hồ sơ bé" message="Bố mẹ hãy tạo hồ sơ cho bé trước." /></View>;

  const level = calculateLevel(summary?.xp || 0);

  return (
    <ScrollView style={common.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Phần thưởng</Text>
      <Text style={styles.subtitle}>XP, chuỗi học và huy hiệu của {child.name}.</Text>

      <LevelCard childName={child.name} level={level.level} xpInCurrentLevel={level.xpInCurrentLevel} xpToNextLevel={level.xpToNextLevel} />

      <AppCard variant="yellow" style={styles.streakCard}>
        <Text style={styles.sectionTitle}>Chuỗi học</Text>
        <View style={styles.streakRow}>
          <StreakPill count={summary?.streak?.currentStreak || 0} />
          <Text style={styles.streakText}>Kỷ lục: {summary?.streak?.longestStreak || 0} ngày</Text>
        </View>
      </AppCard>

      <Text style={styles.sectionTitle}>Nhiệm vụ ngày</Text>
      {missions.length ? missions.map(({ mission, progress }) => (
        <DailyMissionCard key={mission.id} mission={mission} progress={progress} claiming={claimingId === progress.id} onClaim={() => handleClaimReward(progress.id)} />
      )) : <EmptyState icon="☀️" title="Chưa có nhiệm vụ" />}

      <Text style={styles.sectionTitle}>Huy hiệu</Text>
      {badges.length ? (
        <View style={styles.badgeGrid}>
          {badges.map((badge) => <BadgeCard key={badge.id} badge={badge} onPress={() => Alert.alert(badge.isEarned ? "Huy hiệu đã đạt" : "Huy hiệu chưa mở", `${badge.name}\n\n${badge.description || ""}`)} />)}
        </View>
      ) : <EmptyState icon="🏅" title="Chưa có huy hiệu" />}

      <Text style={styles.sectionTitle}>Hoạt động gần đây</Text>
      <AppCard>
        {(summary?.history || []).slice(0, 5).length ? (summary.history || []).slice(0, 5).map((log: any, idx: number) => (
          <View key={log.id || idx} style={styles.historyRow}>
            <Text style={styles.historyIcon}>{getLessonActivityType(log) === "FLASHCARD" ? "▣" : "★"}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.historyTitle}>{log.lesson?.title || "Hoàn thành bài học"}</Text>
              <Text style={styles.historyDesc}>{typeof log.score === "number" ? `Điểm ${log.score}%` : "Ôn tập"}</Text>
            </View>
          </View>
        )) : <Text style={styles.emptyText}>Chưa có hoạt động học tập.</Text>}
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },
  title: { ...typography.title, color: colors.text },
  subtitle: { ...typography.body, color: colors.muted, marginBottom: 16 },
  sectionTitle: { ...typography.subtitle, color: colors.text, marginTop: 10, marginBottom: 10 },
  streakCard: { marginBottom: 14 },
  streakRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  streakText: { ...typography.body, color: colors.muted },
  badgeGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  historyRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.softBorder },
  historyIcon: { fontSize: 22, color: colors.sky, marginRight: 12 },
  historyTitle: { ...typography.body, color: colors.text },
  historyDesc: { ...typography.caption, color: colors.muted },
  emptyText: { ...typography.body, color: colors.muted, textAlign: "center" },
});
