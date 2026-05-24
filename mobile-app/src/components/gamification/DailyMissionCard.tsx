import { StyleSheet, Text, View } from "react-native";
import { AppButton } from "../ui/AppButton";
import { AppCard } from "../ui/AppCard";
import { ProgressBar } from "../ui/ProgressBar";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

export function DailyMissionCard({ mission, progress, onClaim, claiming }: { mission: any; progress: any; onClaim?: () => void; claiming?: boolean }) {
  const pct = Math.min(((progress?.currentValue || 0) / (progress?.targetValue || mission?.targetValue || 1)) * 100, 100);
  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{mission.title}</Text>
          <Text style={styles.desc}>{mission.description}</Text>
        </View>
        <View style={styles.xp}><Text style={styles.xpText}>+{mission.rewardXp} XP</Text></View>
      </View>
      <View style={styles.progressRow}>
        <View style={{ flex: 1 }}><ProgressBar value={pct} color={colors.yellow} /></View>
        <Text style={styles.counter}>{progress?.currentValue || 0}/{progress?.targetValue || mission.targetValue}</Text>
      </View>
      {progress?.isCompleted && !progress?.rewardClaimed && onClaim ? <AppButton title="Nhận thưởng" variant="yellow" loading={claiming} onPress={onClaim} /> : null}
      {progress?.rewardClaimed ? <Text style={styles.claimed}>Đã nhận thưởng</Text> : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  header: { flexDirection: "row", alignItems: "flex-start", marginBottom: 14 },
  title: { ...typography.button, color: colors.text },
  desc: { ...typography.body, color: colors.muted, marginTop: 2 },
  xp: { backgroundColor: colors.yellowSoft, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6, marginLeft: 8 },
  xpText: { ...typography.caption, color: colors.orange },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  counter: { ...typography.caption, color: colors.muted, minWidth: 46, textAlign: "right" },
  claimed: { ...typography.caption, color: colors.primaryDark, marginTop: 10 },
});
