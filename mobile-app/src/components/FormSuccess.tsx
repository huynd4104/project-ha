import { StyleSheet, Text, View } from "react-native";

export function FormSuccess({ message }: { message: string }) {
  if (!message) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🎉 {message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#D1FAE5",
    borderColor: "#6EE7B7",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    width: "100%",
  },
  text: {
    color: "#047857",
    fontWeight: "600",
    fontSize: 14,
  },
});
