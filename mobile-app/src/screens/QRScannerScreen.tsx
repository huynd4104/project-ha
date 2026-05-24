import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import { Animated, Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { qrApi } from "../api/qrApi";
import { AppInput } from "../components/AppInput";
import { AppButton } from "../components/ui/AppButton";
import { AppCard } from "../components/ui/AppCard";
import { MascotBubble } from "../components/ui/MascotBubble";
import { colors } from "../theme/colors";
import { AppIcon } from "../theme/icons";
import { typography } from "../theme/typography";
import { soundService } from "../services/soundService";
import { RemoteImage } from "../components/ui/RemoteImage";
import { common } from "./common";

export function QRScannerScreen({ route, navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState("");
  const [locked, setLocked] = useState(false);
  const [unlockedNpc, setUnlockedNpc] = useState<any | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const childId = route.params?.childId;
  const pop = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (unlockedNpc) {
      soundService.playUnlock();
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, bounciness: 12 }).start();
    } else {
      pop.setValue(0.8);
    }
  }, [unlockedNpc, pop]);

  async function unlock(code: string) {
    if (!code.trim()) return;
    try {
      setLocked(true);
      setErrorMsg("");
      const res = await qrApi.unlock(code.trim(), childId);
      setSuccessMsg(res.data.message || "Bạn đã mở khóa một bạn đồng hành mới!");
      setUnlockedNpc(res.data.data.npc);
    } catch (e: any) {
      setErrorMsg(e.message || "Mã QR không tồn tại hoặc đã hết hiệu lực.");
    } finally {
      setTimeout(() => setLocked(false), 1000);
    }
  }

  return (
    <ScrollView style={common.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Mở khóa bạn đồng hành</Text>
      <Text style={styles.subtitle}>Quét mã QR trên thẻ để mở khóa Mascot mới cho bé.</Text>

      <AppCard variant="blue">
        <MascotBubble message="Đưa mã QR vào khung. Nếu camera không dùng được, nhập mã thủ công bên dưới." />
      </AppCard>

      <View style={styles.scannerWrapper}>
        {!permission?.granted ? (
          <View style={styles.permissionBox}>
            <AppIcon name="qr" size={44} color={colors.sky} />
            <Text style={styles.permissionText}>Ứng dụng cần quyền camera để quét mã QR.</Text>
            <AppButton title="Cấp quyền camera" onPress={requestPermission} />
          </View>
        ) : (
          <CameraView
            style={styles.camera}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={locked || unlockedNpc ? undefined : ({ data }) => unlock(data)}
          >
            <View style={styles.scanFrame}><View style={styles.scanLine} /></View>
          </CameraView>
        )}
      </View>

      <AppCard>
        <Text style={styles.cardTitle}>Nhập mã thủ công</Text>
        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
        <AppInput value={manualCode} onChangeText={setManualCode} placeholder="Nhập mã Mascot trên thẻ" autoCapitalize="characters" />
        <AppButton title="Mở khóa bằng mã" loading={locked} onPress={() => unlock(manualCode)} iconLeft={<AppIcon name="lock" color="#FFFFFF" />} />
      </AppCard>

      <Modal visible={!!unlockedNpc} transparent animationType="fade" onRequestClose={() => setUnlockedNpc(null)}>
        <View style={styles.overlay}>
          <Animated.View style={[styles.modal, { transform: [{ scale: pop }] }]}>
            <Text style={styles.confetti}>✦ ✦ ✦</Text>
            <RemoteImage uri={unlockedNpc?.imageUrl} style={styles.npcImage} fallback="🌟" />
            <Text style={styles.modalTitle}>{successMsg || `Bạn đã mở khóa ${unlockedNpc?.name}!`}</Text>
            <Text style={styles.npcName}>{unlockedNpc?.name || "Mascot mới"}</Text>
            <Text style={styles.npcDialogue}>{unlockedNpc?.defaultDialogue || "Chào bé, mình cùng học nhé!"}</Text>
            <AppButton title="Xem bộ sưu tập" onPress={() => { setUnlockedNpc(null); navigation.navigate("NPCCollection"); }} />
            <AppButton title="Học bài với bạn ấy" variant="yellow" onPress={() => { setUnlockedNpc(null); navigation.navigate("LearningPath"); }} />
          </Animated.View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 36 },
  title: { ...typography.title, color: colors.text },
  subtitle: { ...typography.body, color: colors.muted, marginBottom: 16 },
  scannerWrapper: { height: 280, borderRadius: 32, overflow: "hidden", borderWidth: 3, borderColor: colors.card, marginBottom: 18, backgroundColor: "#101820" },
  camera: { flex: 1, justifyContent: "center", alignItems: "center" },
  scanFrame: { width: 190, height: 190, borderWidth: 4, borderColor: colors.primary, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.08)", justifyContent: "center" },
  scanLine: { height: 4, backgroundColor: colors.yellow, marginHorizontal: 16, borderRadius: 4 },
  permissionBox: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  permissionText: { ...typography.body, color: colors.text, textAlign: "center", marginVertical: 14 },
  cardTitle: { ...typography.button, color: colors.text, marginBottom: 8 },
  errorText: { ...typography.caption, color: colors.error, marginBottom: 8 },
  overlay: { flex: 1, backgroundColor: "rgba(37,50,58,0.62)", alignItems: "center", justifyContent: "center", padding: 22 },
  modal: { width: "100%", maxWidth: 360, backgroundColor: colors.card, borderRadius: 34, padding: 24, alignItems: "center", borderWidth: 3, borderColor: colors.primary },
  confetti: { ...typography.subtitle, color: colors.yellowDark, marginBottom: 8 },
  modalEmoji: { fontSize: 90 },
  npcImage: { width: 150, height: 150, borderRadius: 75, backgroundColor: colors.successSoft, borderWidth: 4, borderColor: colors.primary, marginBottom: 14 },
  modalTitle: { ...typography.subtitle, color: colors.text, textAlign: "center" },
  npcName: { ...typography.title, color: colors.primaryDark, textAlign: "center", marginTop: 4 },
  npcDialogue: { ...typography.body, color: colors.muted, textAlign: "center", marginVertical: 14 },
});
