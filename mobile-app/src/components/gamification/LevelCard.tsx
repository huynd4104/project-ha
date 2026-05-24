import { StyleSheet, Text, View } from "react-native";
import { AppCard } from "../ui/AppCard";
import { XPProgressBar } from "../ui/XPProgressBar";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/radius";
import { typography } from "../../theme/typography";

export function LevelCard({ childName, level, xpInCurrentLevel, xpToNextLevel }: { childName?: string; level: number; xpInCurrentLevel: number; xpToNextLevel: number }) {
  return (
    <AppCard variant="blue">
      <View style={styles.row}>
        <View style={styles.badge}><Text style={styles.badgeText}>{level}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Cấp độ của {childName || "bé"}</Text>
          <Text style={styles.subtitle}>Còn {Math.max(xpToNextLevel - xpInCurrentLevel, 0)} XP để lên cấp</Text>
        </View>
      </View>
      <XPProgressBar level={level} xpInCurrentLevel={xpInCurrentLevel} xpToNextLevel={xpToNextLevel} />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  badge: { width: 58, height: 58, borderRadius: radius.pill, backgroundColor: colors.sky, alignItems: "center", justifyContent: "center", marginRight: 14 },
  badgeText: { fontSize: 26, fontWeight: "900", color: "#FFFFFF" },
  title: { ...typography.subtitle, color: colors.text },
  subtitle: { ...typography.body, color: colors.muted, marginTop: 2 },
});
