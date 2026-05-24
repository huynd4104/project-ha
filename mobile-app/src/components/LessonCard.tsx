import { Pressable, StyleSheet, Text, View } from "react-native";
import { Lesson } from "../types";
import { getLessonMeta } from "../utils/lessonTypes";

export type LessonStatus = "LOCKED" | "AVAILABLE" | "COMPLETED";

export function LessonCard({ lesson, status, onPress }: { lesson: Lesson; status: LessonStatus; onPress: () => void }) {
  const isLocked = status === "LOCKED";
  const isCompleted = status === "COMPLETED";
  const meta = getLessonMeta(lesson.type);

  return (
    <Pressable 
      style={[
        styles.card, 
        isLocked && styles.cardLocked,
        isCompleted && styles.cardCompleted
      ]} 
      onPress={isLocked ? undefined : onPress}
    >
      <View style={styles.header}>
        <View style={[
          styles.badge, 
          isLocked && styles.badgeLocked,
          isCompleted && styles.badgeCompleted,
          meta.color === "yellow" && !isLocked && !isCompleted && styles.badgeMath
        ]}>
          <Text style={[
            styles.badgeText,
            (isLocked || isCompleted) && styles.badgeTextMuted
          ]}>
              {meta.label}
          </Text>
        </View>
        <Text style={styles.statusText}>
          {isCompleted ? "✅ Đã xong" : isLocked ? "🔒 Khóa" : "⭐ Sẵn sàng"}
        </Text>
      </View>

      <Text style={[styles.title, isLocked && styles.textLocked]}>{lesson.title}</Text>
      <Text style={[styles.desc, isLocked && styles.textLocked]}>{lesson.description}</Text>
      
      {lesson.npc && !isLocked && (
        <Text style={styles.npc}>👾 Đồng hành: {lesson.npc.name}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { 
    backgroundColor: "white", 
    borderRadius: 20, 
    padding: 16, 
    marginBottom: 16, 
    borderWidth: 2, 
    borderColor: "#E5E7EB",
    borderBottomWidth: 5,
    borderBottomColor: "#D1D5DB"
  },
  cardLocked: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
    borderBottomColor: "#D1D5DB"
  },
  cardCompleted: {
    borderColor: "#86EFAC",
    borderBottomColor: "#22C55E",
    backgroundColor: "#F0FDF4"
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  badge: { 
    alignSelf: "flex-start", 
    backgroundColor: "#EFF6FF", 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 10 
  },
  badgeMath: {
    backgroundColor: "#FFF7ED"
  },
  badgeLocked: {
    backgroundColor: "#E5E7EB"
  },
  badgeCompleted: {
    backgroundColor: "#DCFCE7"
  },
  badgeText: { 
    color: "#2563EB", 
    fontWeight: "900",
    fontSize: 12
  },
  badgeTextMuted: {
    color: "#6B7280"
  },
  statusText: {
    fontWeight: "800",
    fontSize: 12,
    color: "#4B5563"
  },
  title: { 
    fontSize: 18, 
    fontWeight: "900", 
    color: "#1F2937" 
  },
  desc: { 
    color: "#4B5563", 
    marginTop: 6,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18
  },
  textLocked: {
    color: "#9CA3AF"
  },
  npc: { 
    color: "#059669", 
    marginTop: 10, 
    fontWeight: "800",
    fontSize: 13
  }
});
