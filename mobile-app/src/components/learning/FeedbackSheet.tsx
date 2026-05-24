import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../ui/AppButton";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/radius";
import { typography } from "../../theme/typography";
import { AppIcon } from "../../theme/icons";
import { soundService } from "../../services/soundService";

export function FeedbackSheet({ visible, correct, title, message, explanation, buttonTitle, onContinue }: { visible: boolean; correct: boolean; title: string; message: string; explanation?: string; buttonTitle: string; onContinue: () => void }) {
  const translateY = useRef(new Animated.Value(180)).current;

  useEffect(() => {
    if (visible) {
      correct ? soundService.playCorrect() : soundService.playWrong();
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 8 }).start();
    } else {
      translateY.setValue(180);
    }
  }, [visible, correct, translateY]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.sheet, correct ? styles.correct : styles.wrong, { transform: [{ translateY }] }]}>
      <View style={styles.titleRow}>
        <View style={[styles.iconCircle, { backgroundColor: correct ? colors.primary : colors.error }]}>
          <AppIcon name={correct ? "check" : "wrong"} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: correct ? colors.primaryDark : colors.errorDark }]}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
      {explanation ? <Text style={styles.explanation}>{explanation}</Text> : null}
      <AppButton title={buttonTitle} onPress={onContinue} variant={correct ? "primary" : "danger"} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 18,
    paddingBottom: 28,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    borderTopWidth: 2,
  },
  correct: { backgroundColor: "#EAFEED", borderColor: "#9BEF8C" },
  wrong: { backgroundColor: "#FFF0F0", borderColor: "#FFB8B8" },
  titleRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", marginRight: 12 },
  title: { ...typography.subtitle },
  message: { ...typography.body, color: colors.text },
  explanation: { ...typography.body, color: colors.muted, marginBottom: 12, backgroundColor: "rgba(255,255,255,0.6)", borderRadius: radius.lg, padding: 12 },
});
