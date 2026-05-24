import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { ProgressBar } from "./ProgressBar";

export function XPProgressBar({ level, xpInCurrentLevel, xpToNextLevel }: { level: number; xpInCurrentLevel: number; xpToNextLevel: number }) {
  const pct = xpToNextLevel ? (xpInCurrentLevel / xpToNextLevel) * 100 : 0;
  return (
    <View>
      <View style={styles.row}>
        <Text style={styles.level}>Cấp {level}</Text>
        <Text style={styles.xp}>{xpInCurrentLevel}/{xpToNextLevel} XP</Text>
      </View>
      <ProgressBar value={pct} color={colors.sky} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  level: { ...typography.button, color: colors.text },
  xp: { ...typography.caption, color: colors.sky },
});
