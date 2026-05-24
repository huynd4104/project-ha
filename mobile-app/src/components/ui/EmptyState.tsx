import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { AppCard } from "./AppCard";

export function EmptyState({ icon = "○", title, message, action }: { icon?: string; title: string; message?: string; action?: ReactNode }) {
  return (
    <AppCard style={styles.card}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {action}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: "center", marginTop: 16 },
  icon: { fontSize: 48, marginBottom: 8 },
  title: { ...typography.subtitle, color: colors.text, textAlign: "center" },
  message: { ...typography.body, color: colors.muted, textAlign: "center", marginTop: 6, marginBottom: 12 },
});
