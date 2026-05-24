import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/radius";
import { typography } from "../../theme/typography";

type Status = "completed" | "new" | "locked" | "active";
const stylesByStatus: Record<Status, { bg: string; color: string; label: string }> = {
  completed: { bg: colors.successSoft, color: colors.primaryDark, label: "Đã xong" },
  new: { bg: colors.blueSoft, color: colors.skyDark, label: "Mới" },
  locked: { bg: colors.disabledSoft, color: colors.muted, label: "Khóa" },
  active: { bg: colors.yellowSoft, color: colors.orange, label: "Đang học" },
};

export function BadgePill({ status, label }: { status: Status; label?: string }) {
  const theme = stylesByStatus[status];
  return <View style={[styles.pill, { backgroundColor: theme.bg }]}><Text style={[styles.text, { color: theme.color }]}>{label || theme.label}</Text></View>;
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  text: { ...typography.caption },
});
