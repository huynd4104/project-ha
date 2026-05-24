import { Alert, View } from "react-native";
import { Lesson } from "../../types";
import { LessonConnector } from "./LessonConnector";
import { LessonNode, LessonNodeStatus } from "./LessonNode";

export type LessonMapItem = { lesson: Lesson; status: LessonNodeStatus };

export function LearningMap({ items, onOpenLesson }: { items: LessonMapItem[]; onOpenLesson: (lesson: Lesson) => void }) {
  return (
    <View>
      {items.map((item, index) => {
        const side = index % 2 === 0 ? "left" : "right";
        const next = items[index + 1];
        return (
          <View key={item.lesson.id}>
            <LessonNode
              lesson={item.lesson}
              status={item.status}
              index={index}
              side={side}
              onPress={() => {
                if (item.status === "locked") {
                  Alert.alert("Chưa mở khóa", "Hoàn thành bài trước để mở bài này.");
                  return;
                }
                onOpenLesson(item.lesson);
              }}
            />
            {next ? <LessonConnector active={item.status === "completed" || next.status !== "locked"} align={side} /> : null}
          </View>
        );
      })}
    </View>
  );
}
