import { View, StyleSheet, Text } from "react-native";

export function getPasswordStrength(password: string): { label: "Chưa nhập" | "Yếu" | "Trung bình" | "Mạnh"; color: string; percent: number } {
  if (!password) return { label: "Chưa nhập", color: "#E5E7EB", percent: 0 };
  
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-zA-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (password.length < 6) {
    return { label: "Yếu", color: "#EF4444", percent: 25 };
  }
  
  if (score <= 2) {
    return { label: "Yếu", color: "#EF4444", percent: 25 };
  } else if (score === 3) {
    return { label: "Trung bình", color: "#F59E0B", percent: 60 };
  } else {
    return { label: "Mạnh", color: "#10B981", percent: 100 };
  }
}

export function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  
  if (strength.label === "Chưa nhập") return null;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Độ mạnh mật khẩu: </Text>
        <Text style={[styles.value, { color: strength.color }]}>{strength.label}</Text>
      </View>
      <View style={styles.barWrapper}>
        <View style={[styles.bar, { width: `${strength.percent}%`, backgroundColor: strength.color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    width: "100%",
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  value: {
    fontSize: 12,
    fontWeight: "800",
  },
  barWrapper: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
    width: "100%",
  },
  bar: {
    height: "100%",
    borderRadius: 3,
  },
});
