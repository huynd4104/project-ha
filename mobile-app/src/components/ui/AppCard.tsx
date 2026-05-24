import { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/radius";
import { shadows } from "../../theme/shadows";
import { spacing } from "../../theme/spacing";

type Variant = "default" | "green" | "blue" | "yellow" | "pink" | "purple";
const variants: Record<Variant, { bg: string; border: string; bottom: string }> = {
  default: { bg: colors.card, border: colors.border, bottom: "#D1D5DB" },
  green: { bg: colors.successSoft, border: "#B7EFA5", bottom: colors.primary },
  blue: { bg: colors.blueSoft, border: "#B9E7FF", bottom: colors.sky },
  yellow: { bg: colors.yellowSoft, border: "#FFE999", bottom: colors.yellow },
  pink: { bg: colors.pinkSoft, border: "#FFD0E0", bottom: colors.pink },
  purple: { bg: colors.purpleSoft, border: "#DAC8FF", bottom: colors.purple },
};

export function AppCard({ children, variant = "default", style }: { children: ReactNode; variant?: Variant; style?: ViewStyle }) {
  const theme = variants[variant];
  return <View style={[styles.card, shadows.soft, { backgroundColor: theme.bg, borderColor: theme.border, borderBottomColor: theme.bottom }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: spacing.card,
    borderWidth: 2,
    borderBottomWidth: 5,
    marginBottom: spacing.lg,
  },
});
