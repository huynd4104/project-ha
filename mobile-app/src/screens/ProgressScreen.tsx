import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ScrollView, Text, View, StyleSheet, ActivityIndicator } from "react-native";
import { progressApi } from "../api/progressApi";
import { childApi } from "../api/childApi";
import { calculateLevel } from "../utils/gamification";
import { ProgressCard } from "../components/ProgressCard";
import { getLessonActivityType, getLessonMeta, isFlashcardProgress } from "../utils/lessonTypes";
import { common } from "./common";

export function ProgressScreen({ route }: any) {
  const childId = route.params?.childId;
  const [child, setChild] = useState<any>(null);
  const [summary, setSummary] = useState<any>({});
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);

      const fetchProgress = async () => {
        try {
          // Resolve child first
          let activeChildId = childId;
          if (!activeChildId) {
            const childRes = await childApi.list();
            const activeChild = childRes.data.data[0] || null;
            setChild(activeChild);
            if (activeChild) {
              activeChildId = activeChild.id;
            }
          } else {
            const childRes = await childApi.list();
            const current = childRes.data.data.find((c: any) => c.id === activeChildId);
            setChild(current);
          }

          if (activeChildId) {
            const [sumRes, badRes] = await Promise.all([
              progressApi.summary(activeChildId),
              progressApi.badges(activeChildId)
            ]);
            setSummary(sumRes.data.data || {});
            setBadges(badRes.data.data || []);
          }
        } catch (e) {
          console.error("Error loading progress screen data:", e);
        } finally {
          setLoading(false);
        }
      };

      fetchProgress();
    }, [childId])
  );

  const levelStats = summary?.xp !== undefined ? calculateLevel(summary.xp) : { level: 1, xpInCurrentLevel: 0, xpToNextLevel: 100 };
  const earnedBadgesCount = badges.filter(b => b.isEarned).length;

  const formatDate = (ts: any) => {
    if (!ts) return "Hôm nay";
    let date: Date;
    if (ts.seconds) {
      date = new Date(ts.seconds * 1000);
    } else if (ts.toDate) {
      date = ts.toDate();
    } else {
      date = new Date(ts);
    }
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <ScrollView style={common.screen} contentContainerStyle={styles.scrollContent}>
      <Text style={common.title}>Tiến độ học của bé 📈</Text>
      {child ? (
        <Text style={common.subtitle}>Bảng thống kê thành tích học tập và rèn luyện kỹ năng của bé **{child.name}**.</Text>
      ) : (
        <Text style={common.subtitle}>Bảng thống kê thành tích học tập và rèn luyện kỹ năng của bé.</Text>
      )}

      {loading ? (
        <View style={{ marginVertical: 40, alignItems: "center" }}>
          <ActivityIndicator size="large" color="#58CC02" />
        </View>
      ) : (
        <>
          {/* Grid Stats */}
          <View style={styles.grid}>
            <View style={styles.row}>
              <ProgressCard label="Cấp độ bé" value={levelStats.level} emoji="🏅" />
              <ProgressCard label="Tích lũy XP" value={summary.xp || 0} emoji="✨" />
            </View>
            <View style={styles.row}>
              <ProgressCard label="Chuỗi ngày" value={summary.streak?.currentStreak || 0} emoji="🔥" />
              <ProgressCard label="Kỷ lục chuỗi" value={summary.streak?.longestStreak || 0} emoji="🏆" />
            </View>
            <View style={styles.row}>
              <ProgressCard label="Bài học xong" value={summary.completedLessons || 0} emoji="📚" />
              <ProgressCard label="Huy hiệu nhận" value={earnedBadgesCount} emoji="🎖️" />
            </View>
          </View>

          <Text style={[common.label, styles.sectionTitle]}>Lịch sử học tập tích lũy</Text>
          
          {!summary.history || summary.history.length === 0 ? (
            <View style={[common.panel, { alignItems: "center", padding: 24 }]}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>📝</Text>
              <Text style={styles.infoText}>Bé chưa tham gia bài học nào. Hãy bắt đầu từ Lộ trình học!</Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {summary.history.map((item: any) => {
                const isFlashcard = isFlashcardProgress(item);
                const activityType = getLessonActivityType(item);
                const lessonMeta = getLessonMeta(item.lesson?.type);
                let displayTitle = item.lesson?.title || `Bài học ${item.lessonId}`;
                let displayType = lessonMeta.label;
                if (isFlashcard) {
                  const baseId = item.lessonId.replace("_flashcard", "");
                  displayTitle = item.lesson?.title ? `Thẻ học: ${item.lesson.title}` : `Thẻ học bài ${baseId}`;
                  displayType = "Ôn tập thẻ";
                } else if (activityType && activityType !== "LESSON") {
                  displayType = lessonMeta.label;
                }
                return (
                  <View key={item.id} style={[common.panel, styles.historyCard]}>
                    <View style={styles.historyHeader}>
                      <Text style={styles.historyLessonTitle}>{displayTitle}</Text>
                      <View style={styles.scoreBadge}>
                        <Text style={styles.scoreBadgeText}>
                          {isFlashcard ? "Đã ôn" : `${item.score ?? 0} Điểm`}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.historyFooter}>
                      <Text style={styles.historyDate}>
                        ⏰ Ngày học: {formatDate(item.completedAt)}
                      </Text>
                      <Text style={styles.historyStatus}>{displayType}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 32,
  },
  grid: {
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#374151",
    marginTop: 12,
    marginBottom: 12,
  },
  infoText: {
    textAlign: "center",
    color: "#6B7280",
    fontWeight: "700",
    fontSize: 14,
  },
  historyList: {
    marginTop: 4,
  },
  historyCard: {
    padding: 14,
    marginBottom: 10,
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderBottomWidth: 4,
    borderBottomColor: "#E5E7EB",
    borderRadius: 20
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  historyLessonTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#1F2937",
    flex: 1,
    marginRight: 10,
  },
  scoreBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scoreBadgeText: {
    color: "#166534",
    fontSize: 11,
    fontWeight: "800",
  },
  historyFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyDate: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
  },
  historyStatus: {
    fontSize: 11,
    color: "#10B981",
    fontWeight: "800",
    textTransform: "uppercase"
  },
});
