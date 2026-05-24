import { useEffect, useState } from "react";
import { Image, ImageStyle, StyleProp, StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors";
import { resolveImageUrl } from "../../services/mediaService";

export function RemoteImage({ uri, style, fallback = "🌟" }: { uri?: string | null; style?: StyleProp<ImageStyle>; fallback?: string }) {
  const [resolved, setResolved] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    setFailed(false);
    resolveImageUrl(uri).then((value) => {
      if (mounted) setResolved(value);
    });
    return () => {
      mounted = false;
    };
  }, [uri]);

  if (!resolved || failed) {
    return (
      <View style={[styles.fallback, style as any]}>
        <Text style={styles.fallbackText}>{fallback}</Text>
      </View>
    );
  }

  return <Image source={{ uri: resolved }} style={style} onError={() => setFailed(true)} />;
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.yellowSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackText: {
    fontSize: 34,
  },
});
