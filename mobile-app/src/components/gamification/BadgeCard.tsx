import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors";
import { AppIcon } from "../../theme/icons";
import { radius } from "../../theme/radius";
import { shadows } from "../../theme/shadows";
import { typography } from "../../theme/typography";
import { RemoteImage } from "../ui/RemoteImage";

export function BadgeCard({ badge, onPress }: { badge: any; onPress: () => void }) {
  const earned = !!badge.isEarned;
  return (
    <Pressable onPress={onPress} style={[styles.card, shadows.soft, !earned && styles.locked]}>
      <View style={styles.iconBox}>
        {badge.iconUrl ? <RemoteImage uri={badge.iconUrl} style={[styles.image, !earned && { opacity: 0.35 }]} fallback="🏅" /> : <Text style={{ fontSize: 34 }}>{earned ? "🏅" : "○"}</Text>}
        {!earned ? <View style={styles.lock}><AppIcon name="lock" size={16} /></View> : null}
      </View>
      <Text style={[styles.name, !earned && styles.muted]} numberOfLines={2}>{badge.name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: "31%", minHeight: 126, backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 2, borderBottomWidth: 5, borderColor: colors.border, borderBottomColor: "#D1D5DB", alignItems: "center", justifyContent: "center", padding: 10, marginBottom: 12 },
  locked: { backgroundColor: colors.disabledSoft },
  iconBox: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.yellowSoft, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  image: { width: 46, height: 46, resizeMode: "contain" },
  lock: { position: "absolute", right: -2, bottom: -2, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
  name: { ...typography.caption, color: colors.text, textAlign: "center" },
  muted: { color: colors.muted },
});
