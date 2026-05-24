import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Animated, Easing, ScrollView, StyleSheet, Text, View } from "react-native";
import { NPC } from "../types";
import { common } from "./common";
import { RemoteImage } from "../components/ui/RemoteImage";
import { AppCard } from "../components/ui/AppCard";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { ProgressBar } from "../components/ui/ProgressBar";
import { AppButton } from "../components/ui/AppButton";
import { mascotCompanionService, MascotCompanionProfile } from "../services/mascotCompanionService";
import { soundService } from "../services/soundService";

export function NPCDetailScreen({ route }: any) {
  const npc: NPC = route.params.npc;
  const [profile, setProfile] = useState<MascotCompanionProfile>({ bondXp: 0, favorite: false });
  const [toastMsg, setToastMsg] = useState("");
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, { toValue: 1, duration: 1100, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(sparkleAnim, { toValue: 0, duration: 1100, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [sparkleAnim]);

  const loadProfile = useCallback(() => {
    mascotCompanionService.getProfile(npc.id).then(setProfile).catch(() => null);
  }, [npc.id]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const bondLevel = mascotCompanionService.getBondLevel(profile.bondXp);
  const stickers = mascotCompanionService.getUnlockedStickers(profile.bondXp);
  const allStickers = mascotCompanionService.getStickerCatalog();
  const progressPct = bondLevel.nextAt ? (profile.bondXp / bondLevel.nextAt) * 100 : 100;
  const sparkleOpacity = sparkleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });
  const sparkleScale = sparkleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.12] });
  const stickerBgPalette = ["#FFF7D6", "#FFE3F0", "#E8F5FF", "#E8FBEA", "#F4ECFF", "#FFEAD8"];

  const handlePet = async () => {
    const next = await mascotCompanionService.petMascot(npc.id);
    setProfile(next);
    setToastMsg(`+4 thân thiết với ${npc.name}`);
    soundService.playUiSoft();
  };

  const handleDailyGift = async () => {
    const result = await mascotCompanionService.claimDailyGift(npc.id);
    setProfile(result.profile);
    if (result.claimed) {
      setToastMsg("Tặng quà thành công! +18 thân thiết");
      soundService.playReward();
    } else {
      Alert.alert("Quà hôm nay đã dùng", "Ngày mai quay lại tặng quà tiếp nhé.");
    }
  };

  const handleFavorite = async () => {
    const next = await mascotCompanionService.toggleFavorite(npc.id);
    setProfile(next);
    setToastMsg(next.favorite ? `${npc.name} là bạn đồng hành chính` : "Đã bỏ ghim mascot chính");
    soundService.playUiPrimary();
  };

  return (
    <ScrollView style={common.screen} contentContainerStyle={common.scrollContent}>
      <View style={styles.imageWrap}>
        <RemoteImage uri={npc.imageUrl} style={styles.image} fallback="🌟" />
        <Animated.Text
          style={[
            styles.sparkle,
            styles.sparkleTop,
            { opacity: sparkleOpacity, transform: [{ scale: sparkleScale }] },
          ]}
        >
          ✨
        </Animated.Text>
        <Animated.Text
          style={[
            styles.sparkle,
            styles.sparkleLeft,
            { opacity: sparkleOpacity, transform: [{ scale: sparkleScale }] },
          ]}
        >
          🌟
        </Animated.Text>
        <Animated.Text
          style={[
            styles.sparkle,
            styles.sparkleRight,
            { opacity: sparkleOpacity, transform: [{ scale: sparkleScale }] },
          ]}
        >
          ✨
        </Animated.Text>
      </View>
      <Text style={styles.title}>{npc.name}</Text>
      <Text style={styles.subtitle}>{npc.description}</Text>

      {toastMsg ? <Text style={styles.toast}>{toastMsg}</Text> : null}

      <AppCard variant="purple">
        <View style={styles.levelRow}>
          <Text style={styles.levelTitle}>Mức thân thiết: {bondLevel.name}</Text>
          <Text style={styles.levelXp}>{profile.bondXp} XP</Text>
        </View>
        <ProgressBar value={progressPct} color={colors.purple} />
        <Text style={styles.levelHint}>
          {bondLevel.nextAt ? `Cần ${Math.max(0, bondLevel.nextAt - profile.bondXp)} XP để lên mức tiếp theo.` : "Đã đạt mức bạn thân tối đa."}
        </Text>

        <AppButton title="Vuốt ve mascot (+4)" variant="secondary" onPress={handlePet} />
        <AppButton title="Tặng quà hôm nay (+18)" variant="yellow" onPress={handleDailyGift} />
        <AppButton
          title={profile.favorite ? "Đang là mascot chính" : "Đặt làm mascot chính"}
          variant={profile.favorite ? "primary" : "secondary"}
          onPress={handleFavorite}
        />
      </AppCard>

      <AppCard variant="green">
        <Text style={styles.dialogue}>{npc.defaultDialogue}</Text>
      </AppCard>

      <AppCard variant="pink">
        <Text style={styles.stickerTitle}>Sticker của {npc.name}</Text>
        <Text style={styles.stickerHint}>Chăm mascot mỗi ngày để mở thêm sticker dễ thương.</Text>
        <View style={styles.stickerGrid}>
          {allStickers.map((sticker, index) => {
            const unlocked = !!stickers[index];
            return (
              <View
                key={`${sticker}-${index}`}
                style={[
                  styles.stickerChip,
                  unlocked ? { backgroundColor: stickerBgPalette[index % stickerBgPalette.length] } : styles.stickerLocked,
                ]}
              >
                {unlocked ? <Text style={styles.stickerDeco}>🍬</Text> : null}
                <Text style={styles.stickerEmoji}>{unlocked ? sticker : "🔒"}</Text>
              </View>
            );
          })}
        </View>
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  imageWrap: { position: "relative", marginBottom: 16 },
  image: { height: 260, width: "100%", borderRadius: 28, marginBottom: 16, backgroundColor: colors.successSoft },
  sparkle: {
    position: "absolute",
    fontSize: 24,
    textShadowColor: "rgba(255,255,255,0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  sparkleTop: { top: 12, right: 16 },
  sparkleLeft: { top: 96, left: 12, fontSize: 20 },
  sparkleRight: { bottom: 26, right: 18, fontSize: 20 },
  title: { ...typography.title, color: colors.text },
  subtitle: { ...typography.body, color: colors.muted, marginBottom: 16 },
  toast: { ...typography.caption, color: colors.purple, marginBottom: 12, fontWeight: "800" },
  levelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  levelTitle: { ...typography.button, color: colors.text },
  levelXp: { ...typography.caption, color: colors.purple, fontWeight: "900" },
  levelHint: { ...typography.caption, color: colors.muted, marginTop: 8, marginBottom: 10 },
  dialogue: { ...typography.subtitle, color: colors.text, textAlign: "center" },
  stickerTitle: { ...typography.subtitle, color: colors.text },
  stickerHint: { ...typography.caption, color: colors.muted, marginBottom: 10 },
  stickerGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stickerChip: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#FFD0E0",
    position: "relative",
  },
  stickerLocked: {
    backgroundColor: colors.disabledSoft,
    borderColor: colors.border,
  },
  stickerDeco: { position: "absolute", top: 4, right: 5, fontSize: 12, opacity: 0.75 },
  stickerEmoji: { fontSize: 26 },
});
