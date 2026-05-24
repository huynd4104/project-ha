import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { NPC } from "../types";

export function NPCCard({ npc, locked = false, onPress }: { npc: NPC; locked?: boolean; onPress: () => void }) {
  return (
    <Pressable 
      style={[
        styles.card, 
        locked && styles.cardLocked
      ]} 
      onPress={onPress}
    >
      <View style={styles.imageContainer}>
        {npc.imageUrl ? (
          <Image 
            source={{ uri: npc.imageUrl }} 
            style={[styles.image, locked && styles.imageLocked]} 
          />
        ) : (
          <View style={[styles.placeholder, locked && styles.placeholderLocked]}>
            <Text style={{ fontSize: 36 }}>🤖</Text>
          </View>
        )}
        
        {locked && (
          <View style={styles.lockOverlay}>
            <Text style={styles.lockText}>🔒 Chưa mở khóa</Text>
          </View>
        )}
      </View>
      <Text style={[styles.title, locked && styles.textLocked]}>{npc.name}</Text>
      <Text style={[styles.desc, locked && styles.textLocked]} numberOfLines={2}>
        {npc.description}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { 
    backgroundColor: "white", 
    borderRadius: 20, 
    padding: 12, 
    marginBottom: 16, 
    borderWidth: 2, 
    borderColor: "#E5E7EB",
    borderBottomWidth: 5,
    borderBottomColor: "#D1D5DB"
  },
  cardLocked: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB"
  },
  imageContainer: {
    height: 140,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative"
  },
  image: { 
    width: "100%",
    height: "100%",
    backgroundColor: "#EFF6FF",
    resizeMode: "cover"
  },
  imageLocked: {
    opacity: 0.5
  },
  placeholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center"
  },
  placeholderLocked: {
    opacity: 0.4
  },
  lockOverlay: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  lockText: {
    color: "white",
    fontSize: 11,
    fontWeight: "900"
  },
  title: { 
    fontWeight: "900", 
    fontSize: 18, 
    marginTop: 10,
    color: "#1F2937"
  },
  desc: { 
    color: "#6B7280", 
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18
  },
  textLocked: {
    color: "#9CA3AF"
  }
});
