import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Lesson } from "../../types";
import { colors } from "../../theme/colors";
import { AppIcon } from "../../theme/icons";
import { radius } from "../../theme/radius";
import { shadows } from "../../theme/shadows";
import { typography } from "../../theme/typography";
import { BadgePill } from "../ui/BadgePill";
import { soundService } from "../../services/soundService";
import { getLessonMeta } from "../../utils/lessonTypes";

export type LessonNodeStatus = "locked" | "available" | "current" | "completed";

const statusTheme = {
  locked: { bg: colors.disabledSoft, border: "#D7DEE8", bottom: "#C9D3DF", icon: colors.muted },
  available: { bg: colors.blueSoft, border: "#A7E4FF", bottom: colors.sky, icon: colors.skyDark },
  current: { bg: colors.yellowSoft, border: "#FFE790", bottom: colors.yellow, icon: colors.orange },
  completed: { bg: colors.successSoft, border: "#9BEF8C", bottom: colors.primary, icon: colors.primaryDark },
};

export function LessonNode({ lesson, status, index, side, onPress }: { lesson: Lesson; status: LessonNodeStatus; index: number; side: "left" | "right"; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const bounce = useRef(new Animated.Value(1)).current;
  const theme = statusTheme[status];
  const meta = getLessonMeta(lesson.type);

  useEffect(() => {
    if (status !== "current") return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: 1.06, duration: 650, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 1, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [status, bounce]);

  const iconName = status === "completed" ? "check" : status === "locked" ? "lock" : meta.icon;

  return (
    <View style={[styles.row, side === "right" && styles.rowRight]}>
      <Animated.View style={[{ transform: [{ scale: Animated.multiply(scale, bounce) }] }, shadows.lift]}>
        <Pressable
          onPressIn={() => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start()}
          onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
          onPress={() => {
            soundService.playUiNav();
            onPress();
          }}
          style={[styles.node, { backgroundColor: theme.bg, borderColor: theme.border, borderBottomColor: theme.bottom, opacity: status === "locked" ? 0.72 : 1 }]}
        >
          <View style={[styles.iconCircle, { backgroundColor: status === "locked" ? "#FFFFFFAA" : "#FFFFFF" }]}>
            <AppIcon name={iconName as any} color={theme.icon} size={28} />
          </View>
          <View style={styles.meta}>
            <Text style={styles.order}>Bài {index + 1}</Text>
            <Text style={styles.title} numberOfLines={2}>{lesson.title}</Text>
            <BadgePill status={status === "completed" ? "completed" : status === "locked" ? "locked" : status === "current" ? "active" : "new"} />
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { width: "100%", alignItems: "flex-start", paddingRight: 56 },
  rowRight: { alignItems: "flex-end", paddingRight: 0, paddingLeft: 56 },
  node: {
    width: 250,
    minHeight: 108,
    borderRadius: radius.xxl,
    borderWidth: 2,
    borderBottomWidth: 6,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: { width: 62, height: 62, borderRadius: 31, alignItems: "center", justifyContent: "center", marginRight: 12 },
  meta: { flex: 1, alignItems: "flex-start" },
  order: { ...typography.caption, color: colors.muted, marginBottom: 2 },
  title: { ...typography.button, color: colors.text, marginBottom: 8 },
});
