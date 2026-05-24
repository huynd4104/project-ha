import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ChildProfileScreen } from "../screens/ChildProfileScreen";
import { DialogueLessonScreen } from "../screens/DialogueLessonScreen";
import { FlashcardScreen } from "../screens/FlashcardScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { LearningPathScreen } from "../screens/LearningPathScreen";
import { LessonDetailScreen } from "../screens/LessonDetailScreen";
import { MathLessonScreen } from "../screens/MathLessonScreen";
import { ThinkingLessonScreen } from "../screens/ThinkingLessonScreen";
import { SpellingLessonScreen } from "../screens/SpellingLessonScreen";
import { RhymeLessonScreen } from "../screens/RhymeLessonScreen";
import { NPCCollectionScreen } from "../screens/NPCCollectionScreen";
import { NPCDetailScreen } from "../screens/NPCDetailScreen";
import { ParentDashboardScreen } from "../screens/ParentDashboardScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { ProgressScreen } from "../screens/ProgressScreen";
import { QRScannerScreen } from "../screens/QRScannerScreen";
import { RewardsScreen } from "../screens/RewardsScreen";
import { ResultScreen } from "../screens/ResultScreen";

const Stack = createNativeStackNavigator();

export function MainNavigator({ onLogout }: { onLogout: () => void }) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Trang chủ" }} />
      <Stack.Screen name="ChildProfile" component={ChildProfileScreen} options={{ title: "Hồ sơ con" }} />
      <Stack.Screen name="LearningPath" component={LearningPathScreen} options={{ title: "Lộ trình học" }} />
      <Stack.Screen name="QRScanner" component={QRScannerScreen} options={{ title: "Mở khóa Mascot" }} />
      <Stack.Screen name="NPCCollection" component={NPCCollectionScreen} options={{ title: "Bộ sưu tập Mascot" }} />
      <Stack.Screen name="NPCDetail" component={NPCDetailScreen} options={{ title: "Chi tiết Mascot" }} />
      <Stack.Screen name="LessonDetail" component={LessonDetailScreen} options={{ title: "Bài học" }} />
      <Stack.Screen name="MathLesson" component={MathLessonScreen} options={{ title: "Bài toán" }} />
      <Stack.Screen name="ThinkingLesson" component={ThinkingLessonScreen} options={{ title: "Tư duy" }} />
      <Stack.Screen name="SpellingLesson" component={SpellingLessonScreen} options={{ title: "Đánh vần" }} />
      <Stack.Screen name="RhymeLesson" component={RhymeLessonScreen} options={{ title: "Ghép vần" }} />
      <Stack.Screen name="DialogueLesson" component={DialogueLessonScreen} options={{ title: "Hội thoại 3 phút" }} />
      <Stack.Screen name="Flashcard" component={FlashcardScreen} options={{ title: "Thẻ học" }} />
      <Stack.Screen name="Progress" component={ProgressScreen} options={{ title: "Tiến độ" }} />
      <Stack.Screen name="Rewards" component={RewardsScreen} options={{ title: "Phần thưởng & Nhiệm vụ" }} />
      <Stack.Screen name="Result" component={ResultScreen} options={{ title: "Kết quả" }} />
      <Stack.Screen name="ParentDashboard" component={ParentDashboardScreen} options={{ title: "Phụ huynh" }} />
      <Stack.Screen name="Profile" options={{ title: "Tài khoản" }}>{(props) => <ProfileScreen {...props} onLogout={onLogout} />}</Stack.Screen>
    </Stack.Navigator>
  );
}
