import { ReactNode, useRef } from "react";
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/radius";
import { shadows } from "../../theme/shadows";
import { typography } from "../../theme/typography";
import { soundService } from "../../services/soundService";

export type AppButtonVariant = "primary" | "secondary" | "yellow" | "danger" | "ghost";
export type AppButtonSize = "large" | "medium" | "small";

type Props = {
  title: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  secondary?: boolean;
  danger?: boolean;
};

const palette: Record<AppButtonVariant, { bg: string; text: string; border: string; bottom: string }> = {
  primary: { bg: colors.primary, text: "#FFFFFF", border: colors.primary, bottom: colors.primaryDark },
  secondary: { bg: colors.card, text: colors.text, border: colors.border, bottom: "#CBD5E1" },
  yellow: { bg: colors.yellow, text: colors.text, border: colors.yellow, bottom: colors.yellowDark },
  danger: { bg: colors.error, text: "#FFFFFF", border: colors.error, bottom: colors.errorDark },
  ghost: { bg: "transparent", text: colors.muted, border: "transparent", bottom: "transparent" },
};

const heights: Record<AppButtonSize, number> = { large: 64, medium: 56, small: 44 };

export function AppButton({ title, onPress, variant = "primary", size = "medium", iconLeft, iconRight, disabled, loading, style, secondary, danger }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const resolvedVariant = danger ? "danger" : secondary ? "secondary" : variant;
  const theme = palette[resolvedVariant];
  const isDisabled = disabled || loading;

  const animateTo = (value: number) => {
    Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 22, bounciness: 7 }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, resolvedVariant !== "ghost" && shadows.soft]}>
      <Pressable
        accessibilityRole="button"
        disabled={isDisabled}
        onPressIn={() => animateTo(0.96)}
        onPressOut={() => animateTo(1)}
        onPress={() => {
          if (resolvedVariant === "primary" || resolvedVariant === "yellow" || resolvedVariant === "danger") {
            soundService.playUiPrimary();
          } else if (resolvedVariant === "ghost") {
            soundService.playUiNav();
          } else {
            soundService.playUiSoft();
          }
          onPress();
        }}
        style={[
          styles.button,
          {
            minHeight: heights[size],
            borderRadius: size === "small" ? radius.lg : radius.xl,
            backgroundColor: isDisabled ? colors.disabledSoft : theme.bg,
            borderColor: isDisabled ? colors.disabled : theme.border,
            borderBottomColor: isDisabled ? colors.disabled : theme.bottom,
            paddingHorizontal: size === "small" ? 14 : 20,
          },
          resolvedVariant === "ghost" && styles.ghost,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={theme.text} />
        ) : (
          <View style={styles.content}>
            {iconLeft ? <View style={styles.iconLeft}>{iconLeft}</View> : null}
            <Text style={[styles.text, { color: isDisabled ? colors.muted : theme.text, fontSize: size === "small" ? 14 : 16 }]}>{title}</Text>
            {iconRight ? <View style={styles.iconRight}>{iconRight}</View> : null}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 2,
    borderBottomWidth: 5,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 6,
  },
  ghost: {
    borderWidth: 0,
    borderBottomWidth: 0,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    ...typography.button,
    letterSpacing: 0,
    textAlign: "center",
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
