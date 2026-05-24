import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../components/ui/AppButton";
import { AppCard } from "../components/ui/AppCard";
import { BadgePill } from "../components/ui/BadgePill";
import { MascotBubble } from "../components/ui/MascotBubble";
import { Lesson } from "../types";
import { colors } from "../theme/colors";
import { AppIcon } from "../theme/icons";
import { typography } from "../theme/typography";
import { learningInsightsService } from "../services/learningInsightsService";
import { common } from "./common";
import { getLessonMeta } from "../utils/lessonTypes";

export function LessonDetailScreen({ route, navigation }: any) {
  const lesson: Lesson = route.params.lesson;
  const completed = !!lesson.progress?.some((p: any) => p.status === "COMPLETED");
  const meta = getLessonMeta(lesson.type);
  const variant = meta.color;
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    learningInsightsService.isFavorite(lesson.id).then(setFavorite);
  }, [lesson.id]);

  const startLesson = async () => {
    await learningInsightsService.recordLessonOpen(lesson);
    if (lesson.type === "FLASHCARD") {
      navigation.navigate("Flashcard", { lesson });
      return;
    }
    if (lesson.type === "DIALOGUE") return navigation.navigate("DialogueLesson", { lesson });
    if (lesson.type === "THINKING") return navigation.navigate("ThinkingLesson", { lesson });
    if (lesson.type === "SPELLING") return navigation.navigate("SpellingLesson", { lesson });
    if (lesson.type === "RHYME") return navigation.navigate("RhymeLesson", { lesson });
    navigation.navigate("MathLesson", { lesson });
  };

  return (
    <ScrollView style={common.screen} contentContainerStyle={styles.content}>
      <AppCard variant={variant as any} style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.typeIcon}><AppIcon name={meta.icon} size={30} color={meta.color === "yellow" ? colors.orange : meta.color === "blue" ? colors.skyDark : colors.primaryDark} /></View>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <BadgePill status={completed ? "completed" : "active"} label={meta.shortLabel} />
              {favorite ? <BadgePill status="new" label="Yêu thích" /> : null}
            </View>
            <Text style={styles.title}>{lesson.title}</Text>
          </View>
        </View>
        <Text style={styles.desc}>{lesson.description}</Text>
      </AppCard>

      {lesson.npc ? (
        <AppCard>
          <MascotBubble imageUrl={lesson.npc.imageUrl} name={lesson.npc.name} message={lesson.npc.defaultDialogue || "Mình sẽ đồng hành trong bài học này."} />
        </AppCard>
      ) : (
        <AppCard variant="green">
          <MascotBubble message="Một bạn đồng hành sẽ xuất hiện khi bài học được gắn Mascot." />
        </AppCard>
      )}

      <AppCard>
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}><AppIcon name="progress" color={colors.sky} /><Text style={styles.metaText}>3-5 phút</Text></View>
          <View style={styles.metaItem}><AppIcon name="star" color={colors.yellowDark} /><Text style={styles.metaText}>{meta.label}</Text></View>
          <View style={styles.metaItem}><AppIcon name="xp" color={colors.purple} /><Text style={styles.metaText}>+20 XP</Text></View>
        </View>
        {completed ? <Text style={styles.completedText}>Bé đã hoàn thành bài này. Có thể ôn lại bất cứ lúc nào.</Text> : null}
      </AppCard>

      <AppButton
        title={lesson.type === "FLASHCARD" ? "Bắt đầu ôn thẻ" : completed ? "Ôn lại bài" : "Bắt đầu"}
        onPress={startLesson}
        iconLeft={<AppIcon name="play" color="#FFFFFF" />}
      />
      <AppButton
        title={favorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
        variant={favorite ? "yellow" : "secondary"}
        onPress={async () => setFavorite(await learningInsightsService.toggleFavorite(lesson))}
        iconLeft={<AppIcon name="star" color={favorite ? colors.text : colors.yellowDark} />}
      />
      <AppButton title="Xem thẻ học" variant="secondary" onPress={() => navigation.navigate("Flashcard", { lesson })} iconLeft={<AppIcon name="flashcard" />} />
      {completed ? <AppButton title="Về lộ trình" variant="ghost" onPress={() => navigation.navigate("LearningPath")} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 36 },
  hero: { marginTop: 6 },
  heroTop: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  badgeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  typeIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.card, alignItems: "center", justifyContent: "center", marginRight: 14 },
  title: { ...typography.title, color: colors.text, marginTop: 8 },
  desc: { ...typography.body, color: colors.text },
  metaGrid: { flexDirection: "row", justifyContent: "space-between" },
  metaItem: { alignItems: "center", flex: 1 },
  metaText: { ...typography.caption, color: colors.text, marginTop: 6 },
  completedText: { ...typography.body, color: colors.primaryDark, marginTop: 16, textAlign: "center" },
});
