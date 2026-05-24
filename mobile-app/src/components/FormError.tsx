import { StyleSheet, Text, View } from "react-native";

export function FormError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.text}>⚠️ {message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FCA5A5",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    width: "100%",
  },
  text: {
    color: "#B91C1C",
    fontWeight: "600",
    fontSize: 14,
  },
});
