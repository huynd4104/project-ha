import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/radius";

export function ProgressBar({ value, color = colors.primary, height = 14 }: { value: number; color?: string; height?: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  const clamped = Math.max(0, Math.min(100, value));

  useEffect(() => {
    Animated.timing(progress, { toValue: clamped, duration: 420, useNativeDriver: false }).start();
  }, [clamped, progress]);

  const width = progress.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });
  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <Animated.View style={[styles.fill, { width, backgroundColor: color, borderRadius: height / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    backgroundColor: "#E8EEE6",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
  },
});
