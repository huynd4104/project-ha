import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors";
import { AppIcon } from "../../theme/icons";
import { radius } from "../../theme/radius";
import { shadows } from "../../theme/shadows";
import { typography } from "../../theme/typography";
import { soundService } from "../../services/soundService";

export type AnswerState = "default" | "selected" | "correct" | "wrong";

const stateStyle: Record<AnswerState, { bg: string; border: string; bottom: string; text: string }> = {
  default: { bg: colors.card, border: colors.border, bottom: "#D1D5DB", text: colors.text },
  selected: { bg: colors.blueSoft, border: "#93DFFF", bottom: colors.sky, text: colors.skyDark },
  correct: { bg: colors.successSoft, border: "#86EFAC", bottom: colors.primary, text: colors.primaryDark },
  wrong: { bg: "#FFE8E8", border: "#FFB4B4", bottom: colors.error, text: colors.errorDark },
};

export function AnswerOption({ label, text, state = "default", disabled, onPress }: { label: string; text: string; state?: AnswerState; disabled?: boolean; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const theme = stateStyle[state];

  useEffect(() => {
    if (state === "correct") {
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.04, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      ]).start();
    }
    if (state === "wrong") {
      Animated.sequence([
        Animated.timing(shake, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
  }, [state, scale, shake]);

  return (
    <Animated.View style={[{ transform: [{ scale }, { translateX: shake }] }, shadows.soft]}>
      <Pressable
        disabled={disabled}
        onPress={() => {
          soundService.playUiChoice();
          onPress();
        }}
        style={[styles.option, { backgroundColor: theme.bg, borderColor: theme.border, borderBottomColor: theme.bottom }]}
      >
        <View style={styles.labelCircle}><Text style={styles.label}>{label}</Text></View>
        <Text style={[styles.text, { color: theme.text }]}>{text}</Text>
        {state === "correct" ? <AppIcon name="check" color={colors.primaryDark} /> : null}
        {state === "wrong" ? <AppIcon name="wrong" color={colors.errorDark} /> : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  option: {
    minHeight: 64,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderBottomWidth: 5,
    padding: 14,
    marginVertical: 7,
    flexDirection: "row",
    alignItems: "center",
  },
  labelCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.75)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  label: { ...typography.button, color: colors.text },
  text: { ...typography.body, flex: 1 },
});
