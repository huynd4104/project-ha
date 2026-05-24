import { useState } from "react";
import { ScrollView, Text, View, StyleSheet } from "react-native";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { PasswordInput } from "../components/PasswordInput";
import { LoadingButton } from "../components/LoadingButton";
import { FormError } from "../components/FormError";
import { FormSuccess } from "../components/FormSuccess";
import { PasswordStrengthMeter, getPasswordStrength } from "../components/PasswordStrengthMeter";
import { mapAuthError } from "../utils/errors";
import { common } from "./common";

export function ChangePasswordScreen({ navigation }: any) {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleChangePassword = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!user || !user.email) {
      setErrorMsg("Tài khoản chưa được xác định.");
      return;
    }

    if (!currentPassword) {
      setErrorMsg("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg("Mật khẩu mới phải dài tối thiểu 8 ký tự.");
      return;
    }

    // Validate that the password contains both letters and numbers
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasLetter || !hasNumber) {
      setErrorMsg("Mật khẩu mới phải chứa cả chữ cái và số.");
      return;
    }

    if (newPassword === currentPassword) {
      setErrorMsg("Mật khẩu mới phải khác mật khẩu hiện tại.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Nhập lại mật khẩu mới chưa khớp.");
      return;
    }

    try {
      setLoading(true);
      
      // 1. Reauthenticate first
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // 2. Update password
      await updatePassword(user, newPassword);
      
      setSuccessMsg("Đổi mật khẩu thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Go back after showing success message shortly
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      if (err?.code === "auth/wrong-password" || err?.code === "auth/invalid-credential") {
        setErrorMsg("Mật khẩu hiện tại không chính xác.");
      } else {
        setErrorMsg(mapAuthError(err));
      }
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
      <Text style={common.title}>Đổi mật khẩu</Text>
      <Text style={common.subtitle}>
        Hãy thiết lập mật khẩu mạnh chứa chữ cái và chữ số để bảo mật tài khoản phụ huynh.
      </Text>

      <View style={styles.form}>
        <FormError message={errorMsg} />
        <FormSuccess message={successMsg} />

        <Text style={common.label}>Mật khẩu hiện tại</Text>
        <PasswordInput
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Nhập mật khẩu hiện tại"
          textContentType="oneTimeCode"
        />

        <Text style={[common.label, { marginTop: 12 }]}>Mật khẩu mới</Text>
        <PasswordInput
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
          textContentType="oneTimeCode"
        />
        <PasswordStrengthMeter password={newPassword} />

        <Text style={[common.label, { marginTop: 12 }]}>Nhập lại mật khẩu mới</Text>
        <PasswordInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Nhập lại mật khẩu mới"
          textContentType="oneTimeCode"
        />

        <View style={styles.buttonSpacing} />

        <LoadingButton
          title="Đổi mật khẩu"
          onPress={handleChangePassword}
          loading={loading}
        />
        
        <LoadingButton
          title="Hủy"
          onPress={() => navigation.goBack()}
          secondary
          loading={loading}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  form: {
    width: "100%",
  },
  buttonSpacing: {
    height: 12,
  },
});
