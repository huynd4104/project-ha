import { useState } from "react";
import { View, TextInput, Pressable, StyleSheet, Text, TextInputProps } from "react-native";

export function PasswordInput(props: TextInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.container}>
      <TextInput
        placeholderTextColor="#9CA3AF"
        autoCapitalize="none"
        autoCorrect={false}
        {...props}
        secureTextEntry={!visible}
        style={[styles.input, props.style]}
      />
      <Pressable style={styles.eyeButton} onPress={() => setVisible(!visible)}>
        <Text style={styles.eyeText}>{visible ? "🙈" : "👁️"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    width: "100%",
    marginVertical: 6,
  },
  input: {
    backgroundColor: "#F3F4F6",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 14,
    paddingRight: 50,
    fontSize: 16,
    color: "#1F2937",
    width: "100%"
  },
  eyeButton: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10
  },
  eyeText: {
    fontSize: 20
  }
});
