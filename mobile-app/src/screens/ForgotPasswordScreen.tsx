import { useState } from "react";
import { ScrollView, Text, View, StyleSheet } from "react-native";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { AppInput } from "../components/AppInput";
import { LoadingButton } from "../components/LoadingButton";
import { FormError } from "../components/FormError";
import { FormSuccess } from "../components/FormSuccess";
import { mapAuthError } from "../utils/errors";
import { common } from "./common";

export function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setErrorMsg("Vui lòng nhập địa chỉ email.");
      setSuccessMsg("");
      return;
    }
    
    // Simple email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg("Định dạng email chưa đúng.");
      setSuccessMsg("");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      setSuccessMsg("");
      
      await sendPasswordResetEmail(auth, email.trim());
      setSuccessMsg("Yêu cầu đặt lại mật khẩu đã được gửi. Bố mẹ vui lòng kiểm tra hộp thư (bao gồm cả thư rác).");
      setEmail("");
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
        <Text style={common.title}>Quên mật khẩu?</Text>
        <Text style={common.subtitle}>
          Nhập email đăng ký của bố mẹ. Chúng tôi sẽ gửi link thiết lập lại mật khẩu mới.
        </Text>
      </View>

      <View style={styles.form}>
        <FormError message={errorMsg} />
        <FormSuccess message={successMsg} />
        
        <Text style={common.label}>Email tài khoản</Text>
        <AppInput
          value={email}
          onChangeText={setEmail}
          placeholder="email@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <View style={styles.buttonSpacing} />
        <LoadingButton
          title="Gửi link khôi phục"
          onPress={handleResetPassword}
          loading={loading}
        />
        
        <LoadingButton
          title="Quay lại Đăng nhập"
          onPress={() => navigation.navigate("Login")}
          secondary
          loading={loading}
        />
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
  buttonSpacing: {
    height: 12,
  },
});
