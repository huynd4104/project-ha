import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View, StyleSheet, Text, Pressable } from "react-native";
import { useAuth } from "../context/AuthContext";
import { AuthNavigator } from "./AuthNavigator";
import { MainNavigator } from "./MainNavigator";
import { VerifyEmailScreen } from "../screens/VerifyEmailScreen";
import { ChildProfileScreen } from "../screens/ChildProfileScreen";
import { ChangePasswordScreen } from "../screens/ChangePasswordScreen";

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { loading, isAuthenticated, emailVerified, hasChild, logout } = useAuth();
  
  const requireVerification = process.env.EXPO_PUBLIC_REQUIRE_EMAIL_VERIFICATION === "true";

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#58CC02" />
        <Text style={styles.loadingText}>Đang tải cấu hình...</Text>
      </View>
    );
  }

  // 1. Not Authenticated Flow
  if (!isAuthenticated) {
    return (
      <NavigationContainer>
        <AuthNavigator onAuthed={() => {}} />
      </NavigationContainer>
    );
  }

  // 2. Email Verification Flow (if required)
  if (requireVerification && !emailVerified) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: "#F8FAFC" }, headerTitleStyle: { fontWeight: "900" } }}>
          <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} options={{ title: "Xác thực tài khoản" }} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // 3. Child Profile Force Creation Guard
  if (!hasChild) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: "#F8FAFC" }, headerTitleStyle: { fontWeight: "900" } }}>
          <Stack.Screen 
            name="ChildProfileForce" 
            component={ChildProfileScreen} 
            options={{ 
              title: "Tạo hồ sơ cho bé",
              headerRight: () => (
                <Pressable onPress={logout} style={styles.logoutBtn}>
                  <Text style={styles.logoutText}>Đăng xuất</Text>
                </Pressable>
              )
            }} 
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // 4. Authenticated & Guarded Main Flow
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main">{(props) => <MainNavigator {...props} onLogout={logout} />}</Stack.Screen>
        <Stack.Screen 
          name="ChangePassword" 
          component={ChangePasswordScreen} 
          options={{ 
            headerShown: true, 
            title: "Đổi mật khẩu",
            headerStyle: { backgroundColor: "#F8FAFC" },
            headerTitleStyle: { fontWeight: "900" }
          }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC"
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#4B5563",
    fontWeight: "700"
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    borderWidth: 1.5,
    borderColor: "#E5E7EB"
  },
  logoutText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FF4B4B"
  }
});
