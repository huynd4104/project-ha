import { ScrollView, Text, View, StyleSheet } from "react-native";
import { AppButton } from "../components/AppButton";
import { DISCLAIMER } from "../utils/constants";
import { common } from "./common";

export function WelcomeScreen({ navigation }: any) {
  return (
    <ScrollView
      style={common.screen}
      contentContainerStyle={[common.scrollContent, styles.container]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.content}>
        <View style={styles.mascotContainer}>
          <Text style={styles.mascotEmoji}>🐱</Text>
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>Chào mừng bé và bố mẹ đến với thế giới học vui nhộn!</Text>
          </View>
        </View>

        <Text style={common.title}>Học Vui Cùng Mascot</Text>
        <Text style={[common.subtitle, { textAlign: "center" }]}>
          Đồng hành cùng trẻ qua các bài toán, hội thoại sinh động và bộ thẻ học flashcard trực quan.
        </Text>

        <View style={[common.panel, styles.disclaimerPanel]}>
          <Text style={styles.disclaimerText}>⚠️ {DISCLAIMER}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <AppButton title="Bắt đầu học" onPress={() => navigation.navigate("Login")} />
          <AppButton title="Tạo tài khoản phụ huynh" secondary onPress={() => navigation.navigate("Register")} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24
  },
  content: {
    width: "100%",
    alignItems: "center"
  },
  mascotContainer: {
    alignItems: "center",
    marginBottom: 24,
    width: "100%",
  },
  mascotEmoji: {
    fontSize: 80,
    marginBottom: 12,
  },
  bubble: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 12,
    position: "relative",
    maxWidth: "90%",
  },
  bubbleText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4B5563",
    textAlign: "center",
  },
  disclaimerPanel: {
    padding: 12,
    backgroundColor: "#FFFBEB",
    borderColor: "#FEF3C7",
    borderBottomColor: "#FDE68A",
    marginVertical: 12,
  },
  disclaimerText: {
    fontSize: 12,
    color: "#B45309",
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 18,
  },
  buttonContainer: {
    width: "100%",
    marginTop: 12,
  },
});
