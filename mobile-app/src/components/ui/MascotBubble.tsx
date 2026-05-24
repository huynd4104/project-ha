import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/radius";
import { typography } from "../../theme/typography";
import { RemoteImage } from "./RemoteImage";

export function MascotBubble({ imageUrl, name, message, size = 78 }: { imageUrl?: string; name?: string; message: string; size?: number }) {
  return (
    <View style={styles.row}>
      <RemoteImage uri={imageUrl} style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]} fallback="🌟" />
      <View style={styles.bubble}>
        {name ? <Text style={styles.name}>{name}</Text> : null}
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  image: { backgroundColor: colors.successSoft, borderWidth: 3, borderColor: "#B7EFA5" },
  bubble: { flex: 1, marginLeft: 12, backgroundColor: colors.card, borderRadius: radius.xl, padding: 14, borderWidth: 2, borderColor: colors.border },
  name: { ...typography.caption, color: colors.sky, marginBottom: 3 },
  message: { ...typography.body, color: colors.text },
});
