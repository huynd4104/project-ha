import { useState, useEffect } from "react";
import { ScrollView, Text, View, StyleSheet, Alert, Switch } from "react-native";
import { updateProfile, sendEmailVerification } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";
import { AppInput } from "../components/AppInput";
import { LoadingButton } from "../components/LoadingButton";
import { FormError } from "../components/FormError";
import { FormSuccess } from "../components/FormSuccess";
import { mapAuthError } from "../utils/errors";
import { common } from "./common";
import { soundService } from "../services/soundService";
import { AppCard } from "../components/ui/AppCard";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

export function ProfileScreen({ navigation }: any) {
  const { user, userProfile, emailVerified, refreshUserProfile, logout } = useAuth();
  
  const [fullName, setFullName] = useState("");
  const [updatingName, setUpdatingName] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(soundService.getSoundEnabled());
  
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (userProfile?.fullName) {
      setFullName(userProfile.fullName);
    }
  }, [userProfile]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [cooldown]);

  const handleUpdateName = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMsg("Họ tên phải dài tối thiểu 2 ký tự.");
      return;
    }

    try {
      setUpdatingName(true);
      
      // Update Firebase Auth displayName
      if (user) {
        await updateProfile(user, { displayName: fullName.trim() });
      }

      // Update Firestore user document
      if (userProfile?.uid) {
        await setDoc(
          doc(db, "users", userProfile.uid),
          { fullName: fullName.trim(), updatedAt: serverTimestamp() },
          { merge: true }
        );
      }

      await refreshUserProfile();
      setSuccessMsg("Cập nhật họ tên thành công!");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(mapAuthError(err));
    } finally {
      setUpdatingName(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user) return;
    if (cooldown > 0) return;

    try {
      setSendingVerification(true);
      setErrorMsg("");
      setSuccessMsg("");
      
      await sendEmailVerification(user);
      setSuccessMsg("Email xác thực mới đã được gửi. Vui lòng kiểm tra hộp thư.");
      setCooldown(60);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(mapAuthError(err));
    } finally {
      setSendingVerification(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Đăng xuất",
      "Bố mẹ có muốn đăng xuất tài khoản?",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Đăng xuất", onPress: logout, style: "destructive" }
      ]
    );
  };

  return (
    <ScrollView
      style={common.screen}
      contentContainerStyle={common.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={common.title}>Tài khoản</Text>
      
      {/* Verification Banner */}
      {!emailVerified && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningTitle}>⚠️ Email chưa được xác thực</Text>
          <Text style={styles.warningText}>
            Vui lòng xác thực email để kích hoạt đầy đủ các tính năng của tài khoản.
          </Text>
          <LoadingButton
            title={cooldown > 0 ? `Gửi lại sau ${cooldown}s` : "Gửi lại email xác thực"}
            onPress={handleResendVerification}
            loading={sendingVerification}
            disabled={cooldown > 0}
            secondary
          />
        </View>
      )}

      <View style={common.panel}>
        <FormError message={errorMsg} />
        <FormSuccess message={successMsg} />

        <Text style={common.label}>Địa chỉ Email</Text>
        <AppInput
          value={userProfile?.email || user?.email || ""}
          editable={false}
          style={styles.disabledInput}
        />

        <Text style={[common.label, { marginTop: 12 }]}>Họ tên phụ huynh</Text>
        <AppInput
          value={fullName}
          onChangeText={setFullName}
          placeholder="Họ tên phụ huynh"
        />

        <View style={{ marginTop: 8 }}>
          <LoadingButton
            title="Lưu thông tin"
            onPress={handleUpdateName}
            loading={updatingName}
          />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Bảo mật & Cài đặt</Text>
      </View>

      <AppCard>
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingTitle}>Âm thanh phản hồi</Text>
            <Text style={styles.settingDesc}>Bật tiếng chạm, đúng/sai và phần thưởng.</Text>
          </View>
          <Switch
            value={soundEnabled}
            onValueChange={(value) => {
              setSoundEnabled(value);
              soundService.setSoundEnabled(value);
            }}
            trackColor={{ false: "#D1D5DB", true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </AppCard>

      <View style={styles.actionsPanel}>
        <LoadingButton
          title="Đổi mật khẩu"
          onPress={() => navigation.navigate("ChangePassword")}
          secondary
        />
        
        <View style={{ marginTop: 8 }}>
          <LoadingButton
            title="Đăng xuất"
            onPress={handleLogout}
            danger
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  disabledInput: {
    backgroundColor: "#E5E7EB",
    color: "#6B7280",
    borderColor: "#D1D5DB",
  },
  warningBanner: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FEF3C7",
    borderWidth: 2,
    borderBottomWidth: 5,
    borderBottomColor: "#FDE68A",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#B45309",
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    color: "#D97706",
    lineHeight: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  sectionHeader: {
    paddingHorizontal: 4,
    marginBottom: 8,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#374151",
  },
  actionsPanel: {
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingTitle: {
    ...typography.button,
    color: colors.text,
  },
  settingDesc: {
    ...typography.body,
    color: colors.muted,
    marginTop: 3,
  },
});
