import { TextInput, TextInputProps, StyleSheet } from "react-native";

export function AppInput(props: TextInputProps) {
  return <TextInput placeholderTextColor="#9CA3AF" {...props} style={[styles.input, props.style]} />;
}

const styles = StyleSheet.create({
  input: { 
    backgroundColor: "#F3F4F6", 
    borderWidth: 2, 
    borderColor: "#E5E7EB", 
    borderRadius: 16, 
    padding: 14, 
    marginVertical: 6, 
    fontSize: 16,
    color: "#1F2937"
  }
});
