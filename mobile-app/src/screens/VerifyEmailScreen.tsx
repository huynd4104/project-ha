import { useEffect, useState } from "react";
import { ScrollView, Text, View, StyleSheet } from "react-native";
import { sendEmailVerification } from "firebase/auth";
import { useAuth } from "../context/AuthContext";
import { LoadingButton } from "../components/LoadingButton";
import { FormError } from "../components/FormError";
import { FormSuccess } from "../components/FormSuccess";
import { mapAuthError } from "../utils/errors";
import { common } from "./common";

export function VerifyEmailScreen() {
  const { user, refreshUserProfile, logout } = useAuth();
  const [loadingCheck, setLoadingCheck] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [cooldown]);

  const handleCheckVerified = async () => {
    try {
      setLoadingCheck(true);
      setErrorMsg("");
      setSuccessMsg("");
      
      // Reload and refetch profile
      await refreshUserProfile();
      
      // We check directly from the reloaded state
      if (user && !user.emailVerified) {
        setErrorMsg("Email chưa được xác thực. Vui lòng kiểm tra hộp thư của bố mẹ.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(mapAuthError(err));
    } finally {
      setLoadingCheck(false);
    }
  };

  const handleResendEmail = async () => {
    if (!user) return;
    if (cooldown > 0) return;

    try {
      setLoadingResend(true);
      setErrorMsg("");
      setSuccessMsg("");
      
      await sendEmailVerification(user);
      setSuccessMsg("Email xác thực mới đã được gửi. Vui lòng kiểm tra hộp thư.");
      setCooldown(60); // Start 60-second cooldown
    } catch (err: any) {
      console.error(err);
      setErrorMsg(mapAuthError(err));
    } finally {
      setLoadingResend(false);
    }
  };

  return (
    <ScrollView
      style={common.screen}
      contentContainerStyle={[common.scrollContent, styles.container]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.content}>
        <Text style={styles.emoji}>✉️</Text>
        <Text style={common.title}>Xác thực Email</Text>
        
        <Text style={[common.subtitle, { textAlign: "center" }]}>
          Chúng tôi đã gửi email xác thực đến địa chỉ:
        </Text>
        <Text style={styles.emailText}>{user?.email}</Text>
        <Text style={[common.subtitle, { textAlign: "center", marginTop: 8 }]}>
          Vui lòng bấm vào link trong email để tiếp tục. Nếu không tìm thấy, vui lòng kiểm tra mục Thư rác (Spam).
        </Text>

        <View style={styles.form}>
          <FormError message={errorMsg} />
          <FormSuccess message={successMsg} />

          <View style={styles.buttonSpacing} />

          <LoadingButton
            title="Tôi đã xác thực email"
            onPress={handleCheckVerified}
            loading={loadingCheck}
          />

          <LoadingButton
            title={cooldown > 0 ? `Gửi lại sau ${cooldown} giây` : "Gửi lại email xác thực"}
            onPress={handleResendEmail}
            secondary
            loading={loadingResend}
            disabled={cooldown > 0}
          />

          <LoadingButton
            title="Đăng xuất tài khoản"
            onPress={logout}
            danger
            secondary
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    width: "100%",
    alignItems: "center",
  },
  emoji: {
    fontSize: 70,
    marginBottom: 16,
  },
  emailText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2563EB",
    textAlign: "center",
    marginBottom: 8,
  },
  form: {
    width: "100%",
    marginTop: 16,
  },
  buttonSpacing: {
    height: 12,
  },
});
