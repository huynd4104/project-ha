import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { childApi } from "../api/childApi";
import { progressApi } from "../api/progressApi";
import { AppCard } from "../components/ui/AppCard";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingState } from "../components/ui/LoadingState";
import { ProgressBar } from "../components/ui/ProgressBar";
import { colors } from "../theme/colors";
import { AppIcon } from "../theme/icons";
import { typography } from "../theme/typography";
import { getTodayKey } from "../utils/gamification";
import { QUIZ_LESSON_TYPES, getLessonActivityType } from "../utils/lessonTypes";
import { formatUsage, learningInsightsService } from "../services/learningInsightsService";
import { common } from "./common";

export function ParentDashboardScreen({ route }: any) {
  const childId = route.params?.childId;
  const [child, setChild] = useState<any>(null);
  const [summary, setSummary] = useState<any>({});
  const [missions, setMissions] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    (async () => {
      let activeChildId = childId;
      const childRes = await childApi.list();
      const activeChild = childId ? childRes.data.data.find((c: any) => c.id === childId) : childRes.data.data[0];
      setChild(activeChild || null);
      activeChildId = activeChildId || activeChild?.id;
      if (activeChildId) {
        const [sumRes, misRes, actRes] = await Promise.all([
          progressApi.summary(activeChildId),
          progressApi.dailyMissions(activeChildId),
          progressApi.recentActivities(activeChildId),
        ]);
        setSummary(sumRes.data.data || {});
        setMissions(misRes.data.data || []);
        setActivities(actRes.data.data || []);
        setInsights(await learningInsightsService.getInsights());
      }
    })().catch((err) => console.error(err)).finally(() => setLoading(false));
  }, [childId]));

  if (loading) return <View style={common.screen}><LoadingState message="Đang tổng hợp báo cáo..." /></View>;
  if (!child) return <View style={common.screen}><EmptyState icon="🧒" title="Chưa có thông tin trẻ" message="Bố mẹ vui lòng tạo hồ sơ cho bé trước." /></View>;

  const studiedToday = summary?.streak?.lastActiveDate === getTodayKey();
  const totalMissions = missions.length;
  const completedMissions = missions.filter((m) => m.progress?.isCompleted).length;
  const missionPct = totalMissions ? (completedMissions / totalMissions) * 100 : 0;

  const history = summary?.history || [];
  const quizCount = history.filter((h: any) => h.status === "COMPLETED" && QUIZ_LESSON_TYPES.includes(h.lesson?.type)).length;
  const dialogueCount = history.filter((h: any) => h.status === "COMPLETED" && h.lesson?.type === "DIALOGUE").length;
  const flashcardCount = history.filter((h: any) => h.status === "COMPLETED" && getLessonActivityType(h) === "FLASHCARD").length;

  return (
    <ScrollView style={common.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Góc phụ huynh</Text>
      <Text style={styles.subtitle}>Tổng quan dễ đọc để đồng hành cùng {child.name}.</Text>

      <AppCard variant={studiedToday ? "green" : "yellow"}>
        <Text style={styles.sectionTitle}>Tổng quan hôm nay</Text>
        <View style={styles.overviewRow}>
          <InfoBox label="Trạng thái" value={studiedToday ? "Đã học" : "Chưa học"} icon="check" />
          <InfoBox label="Nhiệm vụ" value={`${completedMissions}/${totalMissions}`} icon="star" />
          <InfoBox label="Chuỗi" value={`${summary?.streak?.currentStreak || 0} ngày`} icon="streak" />
        </View>
        <ProgressBar value={missionPct} color={colors.primary} />
      </AppCard>

      <Text style={styles.sectionTitle}>Tiến độ tuần này</Text>
      <View style={styles.grid}>
        <Stat label="Bài học" value={summary.completedLessons || 0} icon="path" />
        <Stat label="Bài tập" value={quizCount} icon="math" />
        <Stat label="Hội thoại" value={dialogueCount} icon="dialogue" />
        <Stat label="Thẻ học" value={flashcardCount} icon="flashcard" />
        <Stat label="Mascot" value={summary.unlockedNpcs || 0} icon="collection" />
        <Stat label="XP" value={summary.xp || 0} icon="xp" />
      </View>

      <Text style={styles.sectionTitle}>Sở thích & thời gian sử dụng</Text>
      <AppCard variant="purple">
        <View style={styles.preferenceRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.preferenceLabel}>Khóa học yêu thích nhất</Text>
            <Text style={styles.preferenceValue}>{insights?.mostFavoriteLesson?.title || insights?.favoriteLessons?.[0]?.title || "Chưa có dữ liệu"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.preferenceLabel}>Hay học nhất</Text>
            <Text style={styles.preferenceValue}>{insights?.mostOpenedLesson?.title || "Chưa có dữ liệu"}</Text>
          </View>
        </View>
        <View style={styles.preferenceRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.preferenceLabel}>Hôm nay</Text>
            <Text style={styles.preferenceValue}>{formatUsage(insights?.todayUsageMs || 0)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.preferenceLabel}>Tổng sử dụng</Text>
            <Text style={styles.preferenceValue}>{formatUsage(insights?.totalUsageMs || 0)}</Text>
          </View>
        </View>
      </AppCard>

      <Text style={styles.sectionTitle}>Hoạt động gần đây</Text>
      <AppCard>
        {activities.length ? activities.map((act, idx) => (
          <View key={act.id || idx} style={styles.activityRow}>
            <Text style={styles.activityIcon}>{act.icon || "★"}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.activityTitle}>{act.title}</Text>
              <Text style={styles.activityDetail}>{act.detail}</Text>
            </View>
          </View>
        )) : <Text style={styles.muted}>Chưa ghi nhận hoạt động học nào.</Text>}
      </AppCard>

      <Text style={styles.sectionTitle}>Gợi ý đồng hành</Text>
      <AppCard variant="blue">
        {["Duy trì 5-10 phút mỗi ngày.", "Khen nỗ lực nhỏ thay vì chỉ khen điểm.", "Tạm dừng khi bé mệt hoặc không hứng thú."].map((tip, idx) => (
          <View key={tip} style={styles.tipRow}><Text style={styles.tipNo}>{idx + 1}</Text><Text style={styles.tipText}>{tip}</Text></View>
        ))}
      </AppCard>

      <AppCard variant="pink">
        <Text style={styles.disclaimerTitle}>Lưu ý an toàn</Text>
        <Text style={styles.disclaimer}>Ứng dụng chỉ hỗ trợ học tập tại nhà, không chẩn đoán, không điều trị và không thay thế đánh giá từ chuyên gia y tế hoặc giáo dục.</Text>
      </AppCard>
    </ScrollView>
  );
}

function InfoBox({ label, value, icon }: { label: string; value: string; icon: any }) {
  return <View style={styles.infoBox}><AppIcon name={icon} color={colors.primaryDark} /><Text style={styles.infoValue}>{value}</Text><Text style={styles.infoLabel}>{label}</Text></View>;
}

function Stat({ label, value, icon }: { label: string; value: number; icon: any }) {
  return <AppCard style={styles.statCard}><AppIcon name={icon} color={colors.sky} /><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></AppCard>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },
  title: { ...typography.title, color: colors.text },
  subtitle: { ...typography.body, color: colors.muted, marginBottom: 16 },
  sectionTitle: { ...typography.subtitle, color: colors.text, marginTop: 10, marginBottom: 10 },
  overviewRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  infoBox: { flex: 1, alignItems: "center" },
  infoValue: { ...typography.button, color: colors.text, marginTop: 5 },
  infoLabel: { ...typography.caption, color: colors.muted },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  statCard: { width: "31%", alignItems: "center", padding: 12, marginBottom: 12 },
  statValue: { ...typography.title, color: colors.text, fontSize: 24, lineHeight: 30 },
  statLabel: { ...typography.caption, color: colors.muted, textAlign: "center" },
  activityRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.softBorder },
  activityIcon: { fontSize: 22, marginRight: 12 },
  activityTitle: { ...typography.body, color: colors.text },
  activityDetail: { ...typography.caption, color: colors.muted },
  muted: { ...typography.body, color: colors.muted, textAlign: "center" },
  tipRow: { flexDirection: "row", alignItems: "center", marginVertical: 7 },
  tipNo: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.card, textAlign: "center", lineHeight: 30, fontWeight: "900", color: colors.sky, marginRight: 10 },
  tipText: { ...typography.body, color: colors.text, flex: 1 },
  disclaimerTitle: { ...typography.button, color: colors.errorDark, marginBottom: 6 },
  disclaimer: { ...typography.body, color: colors.text },
  preferenceRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  preferenceLabel: { ...typography.caption, color: colors.muted },
  preferenceValue: { ...typography.button, color: colors.text, marginTop: 4 },
});
