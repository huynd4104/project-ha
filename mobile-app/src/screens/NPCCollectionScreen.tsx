import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { npcApi } from "../api/npcApi";
import { EmptyState } from "../components/ui/EmptyState";
import { LoadingState } from "../components/ui/LoadingState";
import { BadgePill } from "../components/ui/BadgePill";
import { AppCard } from "../components/ui/AppCard";
import { colors } from "../theme/colors";
import { AppIcon } from "../theme/icons";
import { radius } from "../theme/radius";
import { shadows } from "../theme/shadows";
import { typography } from "../theme/typography";
import { common } from "./common";
import { RemoteImage } from "../components/ui/RemoteImage";
import { mascotCompanionService, MascotCompanionProfile } from "../services/mascotCompanionService";
import { soundService } from "../services/soundService";

type FilterMode = "ALL" | "UNLOCKED" | "FAVORITE";

export function NPCCollectionScreen({ navigation }: any) {
  const [allNpcs, setAllNpcs] = useState<any[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [profiles, setProfiles] = useState<Record<string, MascotCompanionProfile>>({});
  const [filter, setFilter] = useState<FilterMode>("ALL");
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    Promise.all([npcApi.all(), npcApi.collection(), mascotCompanionService.getProfiles()])
      .then(([allRes, colRes, storedProfiles]) => {
        setAllNpcs(allRes.data.data || []);
        setUnlockedIds(new Set<string>((colRes.data.data || []).map((item: any) => item.npcId)));
        setProfiles(storedProfiles || {});
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []));

  const favoriteNpcId = Object.entries(profiles).find(([, profile]) => profile.favorite)?.[0] || null;
  const sorted = [...allNpcs].sort((a, b) => {
    const aFav = a.id === favoriteNpcId ? 1 : 0;
    const bFav = b.id === favoriteNpcId ? 1 : 0;
    if (aFav !== bFav) return bFav - aFav;
    return Number(unlockedIds.has(b.id)) - Number(unlockedIds.has(a.id)) || a.name.localeCompare(b.name);
  });

  const filtered = sorted.filter((npc) => {
    if (filter === "UNLOCKED") return unlockedIds.has(npc.id);
    if (filter === "FAVORITE") return npc.id === favoriteNpcId;
    return true;
  });

  const unlockedCount = allNpcs.filter((npc) => unlockedIds.has(npc.id)).length;
  const totalStickers = allNpcs.reduce((sum, npc) => {
    const profile = profiles[npc.id];
    if (!profile) return sum;
    return sum + mascotCompanionService.getUnlockedStickers(profile.bondXp).length;
  }, 0);

  if (loading) return <View style={common.screen}><LoadingState message="Đang tải bộ sưu tập..." /></View>;

  return (
    <ScrollView style={common.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Bộ sưu tập Mascot</Text>
      <Text style={styles.subtitle}>Nuôi độ thân thiết, mở sticker và chọn bạn đồng hành chính.</Text>

      <AppCard variant="purple">
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{unlockedCount}/{allNpcs.length}</Text>
            <Text style={styles.statLabel}>Đã mở khóa</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalStickers}</Text>
            <Text style={styles.statLabel}>Sticker đã mở</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{favoriteNpcId ? "Có" : "Chưa"}</Text>
            <Text style={styles.statLabel}>Mascot chính</Text>
          </View>
        </View>
        <View style={styles.filterRow}>
          {[
            { key: "ALL", label: "Tất cả" },
            { key: "UNLOCKED", label: "Đã mở" },
            { key: "FAVORITE", label: "Yêu thích" },
          ].map((item) => {
            const active = filter === item.key;
            return (
              <Pressable
                key={item.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => {
                  setFilter(item.key as FilterMode);
                  soundService.playUiSoft();
                }}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </AppCard>

      {filtered.length === 0 ? <EmptyState icon="🌟" title="Chưa có mascot phù hợp" message="Hãy đổi bộ lọc hoặc mở khóa thêm mascot." /> : (
        <View style={styles.grid}>
          {filtered.map((npc) => {
            const unlocked = unlockedIds.has(npc.id);
            const profile = profiles[npc.id] || { bondXp: 0, favorite: false };
            const stickers = mascotCompanionService.getUnlockedStickers(profile.bondXp);
            const stickerPreview = stickers.slice(0, 2);
            return (
              <Pressable
                key={npc.id}
                style={[styles.card, shadows.soft, !unlocked && styles.lockedCard]}
                onPress={() => {
                  if (!unlocked) {
                    Alert.alert("Chưa mở khóa", `Quét QR để mở khóa bạn ${npc.name}.`);
                    return;
                  }
                  soundService.playUiNav();
                  navigation.navigate("NPCDetail", { npc });
                }}
              >
                <View style={[styles.imageWrap, !unlocked && styles.lockedImage]}>
                  {unlocked ? <Text style={styles.cardCandy}>🍭</Text> : null}
                  <RemoteImage uri={npc.imageUrl} style={styles.image} fallback="🌟" />
                  {profile.favorite && unlocked ? <View style={styles.favoriteBadge}><Text style={styles.favoriteEmoji}>💖</Text></View> : null}
                  {!unlocked ? <View style={styles.lockBadge}><AppIcon name="lock" size={16} /></View> : null}
                </View>
                <Text style={[styles.name, !unlocked && styles.muted]} numberOfLines={1}>{npc.name}</Text>
                {unlocked ? (
                  <View style={styles.metaBlock}>
                    <View style={styles.metaRow}>
                      <Text style={styles.metaText}>❤️ {profile.bondXp} XP</Text>
                      <Text style={styles.metaText}>{stickers[0] || "✨"} {stickers.length}</Text>
                    </View>
                    <View style={styles.stickerMiniRow}>
                      {(stickerPreview.length ? stickerPreview : ["✨"]).map((sticker, index) => (
                        <View key={`${npc.id}-${sticker}-${index}`} style={styles.stickerMiniChip}>
                          <Text style={styles.stickerMiniText}>{sticker}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}
                <BadgePill status={unlocked ? "completed" : "locked"} label={unlocked ? "Đã mở" : "Chưa mở"} />
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 36 },
  title: { ...typography.title, color: colors.text },
  subtitle: { ...typography.body, color: colors.muted, marginBottom: 16 },
  statRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { ...typography.subtitle, color: colors.purple, fontWeight: "900" },
  statLabel: { ...typography.caption, color: colors.muted, marginTop: 2 },
  filterRow: { flexDirection: "row", gap: 8 },
  filterChip: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: 8,
    backgroundColor: colors.card,
    alignItems: "center",
  },
  filterChipActive: {
    borderColor: colors.purple,
    backgroundColor: "#EFE8FF",
  },
  filterText: { ...typography.caption, color: colors.muted, fontWeight: "700" },
  filterTextActive: { color: colors.purple, fontWeight: "900" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  card: { width: "48%", backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 2, borderBottomWidth: 6, borderColor: colors.border, borderBottomColor: colors.primary, padding: 12, alignItems: "center", marginBottom: 14 },
  lockedCard: { backgroundColor: colors.disabledSoft, borderBottomColor: "#CBD5E1" },
  imageWrap: { width: "100%", aspectRatio: 1, borderRadius: 26, backgroundColor: colors.successSoft, alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 10 },
  cardCandy: { position: "absolute", top: 8, left: 8, zIndex: 1, fontSize: 16 },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  placeholder: { fontSize: 50 },
  lockedImage: { opacity: 0.62 },
  favoriteBadge: { position: "absolute", top: 8, left: 8, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
  favoriteEmoji: { fontSize: 15 },
  lockBadge: { position: "absolute", top: 8, right: 8, width: 34, height: 34, borderRadius: 17, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
  name: { ...typography.button, color: colors.text, marginBottom: 8 },
  metaBlock: { width: "100%", marginBottom: 8 },
  metaRow: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  metaText: { ...typography.caption, color: colors.muted },
  stickerMiniRow: { flexDirection: "row", gap: 6 },
  stickerMiniChip: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#FFD6E8",
    backgroundColor: "#FFF2F8",
    alignItems: "center",
    justifyContent: "center",
  },
  stickerMiniText: { fontSize: 13 },
  muted: { color: colors.muted },
});
