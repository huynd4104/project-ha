import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { WelcomeScreen } from "../screens/WelcomeScreen";
import { ForgotPasswordScreen } from "../screens/ForgotPasswordScreen";

const Stack = createNativeStackNavigator();

export function AuthNavigator({ onAuthed }: { onAuthed: () => void }) {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: "#F8FAFC" }, headerTitleStyle: { fontWeight: "900" } }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" options={{ title: "Đăng nhập" }}>{(props) => <LoginScreen {...props} onAuthed={onAuthed} />}</Stack.Screen>
      <Stack.Screen name="Register" options={{ title: "Đăng ký" }}>{(props) => <RegisterScreen {...props} onAuthed={onAuthed} />}</Stack.Screen>
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: "Khôi phục mật khẩu" }} />
    </Stack.Navigator>
  );
}
