import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/radius";
import { typography } from "../../theme/typography";
import { AppIcon } from "../../theme/icons";

export function StreakPill({ count }: { count: number }) {
  return (
    <View style={styles.pill}>
      <AppIcon name="streak" size={18} />
      <Text style={styles.text}>{count} ngày</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.yellowSoft, borderColor: "#FFE999", borderWidth: 2, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill },
  text: { ...typography.caption, color: colors.orange },
});
