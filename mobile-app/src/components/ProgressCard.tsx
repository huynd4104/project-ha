import { StyleSheet, Text, View } from "react-native";

export function ProgressCard({ label, value, emoji }: { label: string; value: string | number; emoji?: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{emoji ? `${emoji} ` : ""}{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { 
    flex: 1, 
    minWidth: 90, 
    backgroundColor: "white", 
    borderRadius: 16, 
    padding: 12, 
    borderWidth: 2, 
    borderColor: "#E5E7EB", 
    borderBottomWidth: 4,
    borderBottomColor: "#E5E7EB",
    margin: 4,
    alignItems: "center"
  },
  label: { 
    color: "#6B7280",
    fontWeight: "700",
    fontSize: 12,
    textTransform: "uppercase",
    marginTop: 2
  },
  value: { 
    color: "#1F2937", 
    fontSize: 22, 
    fontWeight: "900"
  }
});
