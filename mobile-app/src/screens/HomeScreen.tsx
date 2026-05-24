import { useFocusEffect } from "@react-navigation/native";
import { sendEmailVerification } from "firebase/auth";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Alert, Animated, ScrollView, StyleSheet, Text, View } from "react-native";
import { childApi } from "../api/childApi";
import { npcApi } from "../api/npcApi";
import { progressApi } from "../api/progressApi";
import { AppButton } from "../components/ui/AppButton";
import { AppCard } from "../components/ui/AppCard";
import { IconButton } from "../components/ui/IconButton";
import { MascotBubble } from "../components/ui/MascotBubble";
import { StreakPill } from "../components/ui/StreakPill";
import { XPProgressBar } from "../components/ui/XPProgressBar";
import { useAuth } from "../context/AuthContext";
import { Child } from "../types";
import { colors } from "../theme/colors";
import { AppIcon, AppIconName } from "../theme/icons";
import { typography } from "../theme/typography";
import { calculateLevel } from "../utils/gamification";
import { mapAuthError } from "../utils/errors";
import { formatUsage, learningInsightsService } from "../services/learningInsightsService";
import { soundService } from "../services/soundService";
import { mascotCompanionService } from "../services/mascotCompanionService";
import { common } from "./common";

function Entrance({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(18)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 360, delay, useNativeDriver: true }),
      Animated.spring(y, { toValue: 0, delay, useNativeDriver: true }),
    ]).start();
  }, [delay, opacity, y]);
  return <Animated.View style={{ opacity, transform: [{ translateY: y }] }}>{children}</Animated.View>;
}

export function HomeScreen({ navigation }: any) {
  const { user, profile, emailVerified, refreshUserProfile } = useAuth() as any;
  const [child, setChild] = useState<Child | null>(null);
  const [summary, setSummary] = useState<any>({});
  const [unlockedNpcs, setUnlockedNpcs] = useState<any[]>([]);
  const [missions, setMissions] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(soundService.getSoundEnabled());
  const [toastMsg, setToastMsg] = useState("");
  const [favoriteNpcId, setFavoriteNpcId] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => setToastMsg(""), 1600);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  useFocusEffect(
    useCallback(() => {
      setIsSoundEnabled(soundService.getSoundEnabled());
      mascotCompanionService.getFavoriteNpcId().then(setFavoriteNpcId).catch(() => null);
      refreshUserProfile().catch(() => null);
      childApi.list().then((res) => {
        const activeChild = res.data.data[0] || null;
        setChild(activeChild);
        if (activeChild) {
          progressApi.summary(activeChild.id).then((res) => setSummary(res.data.data)).catch(() => null);
          npcApi.collection().then((res) => setUnlockedNpcs(res.data.data || [])).catch(() => null);
          progressApi.dailyMissions(activeChild.id).then((res) => setMissions(res.data.data || [])).catch(() => null);
          learningInsightsService.getInsights().then(setInsights).catch(() => null);
        }
      });
    }, [refreshUserProfile])
  );

  const resendVerification = async () => {
    if (!user || cooldown > 0) return;
    try {
      setSending(true);
      await sendEmailVerification(user);
      setCooldown(60);
      Alert.alert("Đã gửi email", "Vui lòng kiểm tra hộp thư để xác thực tài khoản.");
    } catch (e: any) {
      Alert.alert("Lỗi", mapAuthError(e));
    } finally {
      setSending(false);
    }
  };

  const favoriteNpc = unlockedNpcs.find((item) => item.npc?.id === favoriteNpcId)?.npc;
  const mainNpc = favoriteNpc || unlockedNpcs[0]?.npc;
  const levelStats = calculateLevel(summary?.xp || 0);
  const currentMission = missions.slice(0, 3);

  const toggleSound = async () => {
    const next = !isSoundEnabled;
    setIsSoundEnabled(next);
    try {
      await soundService.setSoundEnabled(next);
      setToastMsg(next ? "Âm thanh đã bật" : "Âm thanh đã tắt");
    } catch {
      setIsSoundEnabled(!next);
      setToastMsg("Không thể đổi cài đặt âm thanh");
    }
  };

  const actionItems: { title: string; icon: AppIconName; color: "green" | "blue" | "yellow" | "pink"; route: string; params?: any }[] = [
    { title: "Lộ trình", icon: "path", color: "green", route: "LearningPath" },
    { title: "Phần thưởng", icon: "reward", color: "yellow", route: "Rewards" },
    { title: "Quét QR", icon: "qr", color: "blue", route: "QRScanner", params: { childId: child?.id } },
    { title: "Bộ sưu tập", icon: "collection", color: "pink", route: "NPCCollection" },
    { title: "Phụ huynh", icon: "parent", color: "yellow", route: "ParentDashboard", params: { childId: child?.id } },
  ];

  return (
    <ScrollView style={common.screen} contentContainerStyle={styles.content}>
      {!emailVerified ? (
        <AppCard variant="yellow">
          <Text style={styles.warningTitle}>Email chưa xác thực</Text>
          <Text style={styles.warningText}>Một số tính năng có thể bị giới hạn cho tới khi phụ huynh xác thực email.</Text>
          <View style={styles.rowGap}>
            <View style={{ flex: 1 }}><AppButton title={cooldown > 0 ? `${cooldown}s` : "Gửi lại"} variant="yellow" loading={sending} disabled={cooldown > 0} onPress={resendVerification} /></View>
            <View style={{ flex: 1 }}><AppButton title="Tài khoản" variant="secondary" onPress={() => navigation.navigate("Profile")} /></View>
          </View>
        </AppCard>
      ) : null}

      <Entrance>
        <View style={styles.header}>
          <View>
            <Text style={styles.hello}>Xin chào, {profile?.fullName || user?.email || "bố mẹ"}</Text>
            <Text style={styles.headerSub}>{child ? `Hôm nay ${child.name} học gì?` : "Tạo hồ sơ bé để bắt đầu."}</Text>
          </View>
          <View style={styles.headerActions}>
            <IconButton label={isSoundEnabled ? "Tắt âm thanh" : "Bật âm thanh"} onPress={toggleSound} style={!isSoundEnabled ? styles.soundMutedBtn : undefined}>
              <AppIcon name="sound" color={isSoundEnabled ? colors.sky : colors.muted} />
            </IconButton>
            <IconButton label="Cài đặt" onPress={() => navigation.navigate("Profile")}><AppIcon name="settings" /></IconButton>
          </View>
        </View>
      </Entrance>

      {toastMsg ? (
        <View style={styles.toastWrap}>
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      ) : null}

      <Entrance delay={80}>
        <AppCard variant="green" style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.childName}>{child ? child.name : "Bạn nhỏ"}</Text>
              <Text style={styles.childMeta}>{child ? `${child.age} tuổi` : "Chưa có hồ sơ"}</Text>
            </View>
            <StreakPill count={summary?.streak?.currentStreak || 0} />
          </View>
          <XPProgressBar level={levelStats.level} xpInCurrentLevel={levelStats.xpInCurrentLevel} xpToNextLevel={levelStats.xpToNextLevel} />
          <View style={styles.mascotWrap}>
            <MascotBubble imageUrl={mainNpc?.imageUrl} name={mainNpc?.name || "Bạn đồng hành"} message={mainNpc?.defaultDialogue || "Quét QR để mở khóa một bạn đồng hành mới cho bé."} />
          </View>
        </AppCard>
      </Entrance>

      <Entrance delay={140}>
        <AppCard variant="yellow">
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Nhiệm vụ hôm nay</Text>
            <AppButton title="Xem tất cả" size="small" variant="ghost" onPress={() => navigation.navigate("Rewards")} />
          </View>
          {currentMission.length ? currentMission.map(({ mission, progress }) => (
            <View key={mission.id} style={styles.missionRow}>
              <AppIcon name="star" color={colors.orange} />
              <Text style={styles.missionText} numberOfLines={1}>{mission.title}</Text>
              <Text style={styles.missionCount}>{progress.currentValue}/{progress.targetValue}</Text>
            </View>
          )) : <Text style={styles.emptyLine}>Chưa có nhiệm vụ mới.</Text>}
        </AppCard>
      </Entrance>

      <Entrance delay={200}>
        <View style={styles.grid}>
          {actionItems.map((item) => (
            <AppCard key={item.title} variant={item.color} style={styles.actionCard}>
              <IconButton onPress={() => navigation.navigate(item.route, item.params)} style={styles.actionIcon}><AppIcon name={item.icon} size={26} /></IconButton>
              <Text style={styles.actionText}>{item.title}</Text>
            </AppCard>
          ))}
        </View>
      </Entrance>

      <Entrance delay={260}>
        <AppCard variant="pink">
          <Text style={styles.sectionTitle}>Góc yêu thích</Text>
          <Text style={styles.continueText}>
            {insights?.favoriteLessons?.[0]
              ? `Bé đang yêu thích "${insights.favoriteLessons[0].title}".`
              : "Bấm yêu thích trong chi tiết bài để tạo lối tắt học nhanh."}
          </Text>
          <View style={styles.insightRow}>
            <View style={styles.insightBox}>
              <Text style={styles.insightValue}>{insights?.favoriteIds?.length || 0}</Text>
              <Text style={styles.insightLabel}>yêu thích</Text>
            </View>
            <View style={styles.insightBox}>
              <Text style={styles.insightValue}>{formatUsage(insights?.todayUsageMs || 0)}</Text>
              <Text style={styles.insightLabel}>hôm nay</Text>
            </View>
          </View>
        </AppCard>
      </Entrance>

      <Entrance delay={320}>
        <AppCard variant="blue">
          <Text style={styles.sectionTitle}>Học tiếp</Text>
          <Text style={styles.continueText}>
            {insights?.mostOpenedLesson ? `Bài bé hay mở nhất: "${insights.mostOpenedLesson.title}".` : "Một hoạt động nhỏ mỗi ngày giúp bé giữ nhịp học vui vẻ."}
          </Text>
          <AppButton title="Vào lộ trình học" onPress={() => navigation.navigate("LearningPath")} iconLeft={<AppIcon name="play" color="#FFFFFF" />} />
        </AppCard>
      </Entrance>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 36 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  hello: { ...typography.subtitle, color: colors.text },
  headerSub: { ...typography.body, color: colors.muted, marginTop: 2 },
  headerActions: { flexDirection: "row", gap: 10 },
  soundMutedBtn: { opacity: 0.75 },
  toastWrap: {
    alignSelf: "center",
    marginBottom: 10,
    backgroundColor: "rgba(37, 50, 58, 0.92)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  toastText: {
    ...typography.caption,
    color: "#FFFFFF",
    fontWeight: "800",
  },
  warningTitle: { ...typography.button, color: colors.orange },
  warningText: { ...typography.body, color: colors.text, marginVertical: 8 },
  rowGap: { flexDirection: "row", gap: 10 },
  heroCard: { overflow: "hidden" },
  heroTop: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  childName: { ...typography.title, color: colors.text },
  childMeta: { ...typography.body, color: colors.muted },
  mascotWrap: { marginTop: 18 },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  sectionTitle: { ...typography.subtitle, color: colors.text },
  missionRow: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.65)", borderRadius: 18, padding: 12, marginTop: 8 },
  missionText: { ...typography.body, color: colors.text, flex: 1, marginLeft: 8 },
  missionCount: { ...typography.caption, color: colors.orange },
  emptyLine: { ...typography.body, color: colors.muted },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  actionCard: { width: "48%", minHeight: 142, alignItems: "center", justifyContent: "center", padding: 14 },
  actionIcon: { marginBottom: 10 },
  actionText: { ...typography.button, color: colors.text, textAlign: "center" },
  continueText: { ...typography.body, color: colors.muted, marginTop: 4, marginBottom: 12 },
  insightRow: { flexDirection: "row", gap: 12 },
  insightBox: { flex: 1, backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 18, padding: 12, alignItems: "center" },
  insightValue: { ...typography.subtitle, color: colors.text, textAlign: "center" },
  insightLabel: { ...typography.caption, color: colors.muted, marginTop: 2 },
});
