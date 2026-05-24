import { StyleSheet, View } from "react-native";
import { colors } from "../../theme/colors";

export function LessonConnector({ active, align = "left" }: { active?: boolean; align?: "left" | "right" }) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.line, align === "right" && styles.right, { backgroundColor: active ? colors.primary : "#D9E1D6" }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 42, width: "100%", position: "relative" },
  line: { position: "absolute", top: 0, bottom: 0, width: 8, borderRadius: 8, left: "28%", transform: [{ rotate: "18deg" }] },
  right: { left: undefined, right: "28%", transform: [{ rotate: "-18deg" }] },
});
