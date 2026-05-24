import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

export function LoadingState({ message = "Đang tải..." }: { message?: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.mascot}>🌟</Text>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  mascot: { fontSize: 54, marginBottom: 12 },
  text: { ...typography.body, color: colors.muted, marginTop: 10, textAlign: "center" },
});
