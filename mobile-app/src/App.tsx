import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { AppState } from "react-native";
import { AuthProvider } from "./context/AuthContext";
import { RootNavigator } from "./navigation/RootNavigator";
import { learningInsightsService } from "./services/learningInsightsService";
import { soundService } from "./services/soundService";

export default function App() {
  useEffect(() => {
    soundService.init().catch(() => null);
    learningInsightsService.startUsageSession();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") learningInsightsService.startUsageSession();
      else learningInsightsService.stopUsageSession();
    });
    return () => {
      sub.remove();
      learningInsightsService.stopUsageSession();
      soundService.unload().catch(() => null);
    };
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </AuthProvider>
  );
}
