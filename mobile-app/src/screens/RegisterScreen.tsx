import { useState } from "react";
import { ScrollView, Text, View, StyleSheet, Pressable } from "react-native";
import { updateProfile, sendEmailVerification } from "firebase/auth";
import { authApi } from "../api/authApi";
import { auth } from "../firebase/firebase";
import { AppInput } from "../components/AppInput";
import { PasswordInput } from "../components/PasswordInput";
import { LoadingButton } from "../components/LoadingButton";
import { FormError } from "../components/FormError";
import { PasswordStrengthMeter } from "../components/PasswordStrengthMeter";
import { isExpectedAuthError, mapAuthError } from "../utils/errors";
import { common } from "./common";

export function RegisterScreen({ navigation, onAuthed }: any) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRegister = async () => {
    setErrorMsg("");

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMsg("Họ tên phụ huynh yêu cầu tối thiểu 2 ký tự.");
      return;
    }

    if (!email.trim()) {
      setErrorMsg("Vui lòng nhập email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg("Định dạng email chưa chính xác.");
      return;
    }

    if (password.length < 8) {
      setErrorMsg("Mật khẩu phải dài tối thiểu 8 ký tự.");
      return;
    }

    // Validate password contains letters and numbers
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
      setErrorMsg("Mật khẩu phải chứa cả chữ cái và chữ số.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Nhập lại mật khẩu chưa khớp.");
      return;
    }

    if (!agreed) {
      setErrorMsg("Bố mẹ cần đồng ý với điều khoản sử dụng để tiếp tục.");
      return;
    }

    try {
      setLoading(true);
      
      // 1. Create account
      await authApi.register(fullName.trim(), email.trim(), password);
      
      // 2. Set Firebase Auth displayName
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: fullName.trim() });
        // 3. Send email verification
        await sendEmailVerification(auth.currentUser);
      }

      if (onAuthed) onAuthed();
    } catch (err: any) {
      if (isExpectedAuthError(err)) {
        console.warn("Registration failed:", mapAuthError(err));
      } else {
        console.error(err);
      }
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
        <Text style={common.title}>Tạo tài khoản</Text>
        <Text style={common.subtitle}>
          Đăng ký tài khoản để bắt đầu hành trình đồng hành cùng trẻ tại nhà.
        </Text>
      </View>

      <View style={styles.form}>
        <FormError message={errorMsg} />

        <Text style={common.label}>Họ tên phụ huynh</Text>
        <AppInput
          value={fullName}
          onChangeText={setFullName}
          placeholder="Ví dụ: Nguyễn Văn A"
        />

        <Text style={[common.label, { marginTop: 12 }]}>Địa chỉ Email</Text>
        <AppInput
          value={email}
          onChangeText={setEmail}
          placeholder="email@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={[common.label, { marginTop: 12 }]}>Mật khẩu</Text>
        <PasswordInput
          value={password}
          onChangeText={setPassword}
          placeholder="Tối thiểu 8 ký tự, gồm cả chữ và số"
          textContentType="oneTimeCode"
        />
        <PasswordStrengthMeter password={password} />

        <Text style={[common.label, { marginTop: 12 }]}>Nhập lại mật khẩu</Text>
        <PasswordInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Nhập lại mật khẩu để xác nhận"
          textContentType="oneTimeCode"
        />

        <Pressable
          style={styles.checkboxRow}
          onPress={() => setAgreed(!agreed)}
        >
          <Text style={styles.checkboxEmoji}>{agreed ? "✅" : "⬜"}</Text>
          <Text style={styles.checkboxText}>
            Tôi hiểu ứng dụng chỉ hỗ trợ phụ huynh đồng hành cùng trẻ tại nhà, không chẩn đoán, không điều trị và không thay thế chuyên gia y tế/tâm lý.
          </Text>
        </Pressable>

        <View style={styles.buttonSpacing} />

        <LoadingButton
          title="Đăng ký tài khoản"
          onPress={handleRegister}
          loading={loading}
        />

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Đã có tài khoản phụ huynh? </Text>
          <Pressable onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginLink}>Đăng nhập</Text>
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
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 16,
    paddingRight: 10,
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  checkboxEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
  checkboxText: {
    flex: 1,
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
    fontWeight: "600",
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
  loginLink: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "800",
  },
});
