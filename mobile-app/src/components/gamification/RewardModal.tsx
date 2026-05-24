import { Modal, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../ui/AppButton";
import { AppCard } from "../ui/AppCard";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

export function RewardModal({ visible, title, message, onClose }: { visible: boolean; title: string; message: string; onClose: () => void }) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <AppCard variant="yellow" style={styles.card}>
          <Text style={styles.icon}>🎁</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <AppButton title="Tiếp tục" onPress={onClose} />
        </AppCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(37,50,58,0.55)", padding: 24, alignItems: "center", justifyContent: "center" },
  card: { width: "100%", maxWidth: 360, alignItems: "center" },
  icon: { fontSize: 58, marginBottom: 8 },
  title: { ...typography.title, color: colors.text, textAlign: "center" },
  message: { ...typography.body, color: colors.muted, textAlign: "center", marginVertical: 12 },
});
