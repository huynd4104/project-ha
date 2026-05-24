import { useState } from "react";
import { ScrollView, Text, View, StyleSheet, Pressable } from "react-native";
import { authApi } from "../api/authApi";
import { AppInput } from "../components/AppInput";
import { PasswordInput } from "../components/PasswordInput";
import { LoadingButton } from "../components/LoadingButton";
import { FormError } from "../components/FormError";
import { mapAuthError } from "../utils/errors";
import { common } from "./common";

export function LoginScreen({ navigation, onAuthed }: any) {
  const [email, setEmail] = useState("parent@demo.com");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async () => {
    setErrorMsg("");
    
    if (!email.trim()) {
      setErrorMsg("Vui lòng nhập email.");
      return;
    }
    if (!password) {
      setErrorMsg("Vui lòng nhập mật khẩu.");
      return;
    }

    // Simple email format verification
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg("Định dạng email không đúng.");
      return;
    }

    try {
      setLoading(true);
      await authApi.login(email.trim(), password);
      if (onAuthed) onAuthed();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={common.screen}
      contentContainerStyle={common.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={common.title}>Đăng nhập</Text>
        <Text style={common.subtitle}>
          Đăng nhập tài khoản phụ huynh để đồng hành học cùng bé.
        </Text>
      </View>

      <View style={styles.form}>
        <FormError message={errorMsg} />

        <Text style={common.label}>Địa chỉ Email</Text>
        <AppInput
          value={email}
          onChangeText={setEmail}
          placeholder="parent@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <View style={styles.passwordLabelRow}>
          <Text style={common.label}>Mật khẩu</Text>
          <Pressable onPress={() => navigation.navigate("ForgotPassword")}>
            <Text style={styles.forgotText}>Quên mật khẩu?</Text>
          </Pressable>
        </View>
        <PasswordInput
          value={password}
          onChangeText={setPassword}
          placeholder="Nhập mật khẩu"
          textContentType="password"
        />

        <View style={styles.buttonSpacing} />
        
        <LoadingButton
          title="Đăng nhập"
          onPress={handleLogin}
          loading={loading}
        />

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Chưa có tài khoản phụ huynh? </Text>
          <Pressable onPress={() => navigation.navigate("Register")}>
            <Text style={styles.registerLink}>Đăng ký ngay</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 20,
    marginBottom: 10,
  },
  form: {
    width: "100%",
  },
  passwordLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  forgotText: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "700",
  },
  buttonSpacing: {
    height: 12,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  footerText: {
    color: "#4B5563",
    fontSize: 14,
    fontWeight: "600",
  },
  registerLink: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "800",
  },
});
