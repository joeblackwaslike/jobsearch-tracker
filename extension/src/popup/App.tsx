import { useEffect, useState } from "react";
import { getStorage } from "../shared/storage";
import { AuthScreen } from "./screens/AuthScreen";
import { MainScreen } from "./screens/MainScreen";
import { SettingsScreen } from "./screens/SettingsScreen";

type Screen = "loading" | "auth" | "main" | "settings";

export function App() {
  const [screen, setScreen] = useState<Screen>("loading");

  useEffect(() => {
    getStorage("access_token").then((token) => {
      setScreen(token ? "main" : "auth");
    });
  }, []);

  if (screen === "loading") return null;
  if (screen === "auth") return <AuthScreen />;
  if (screen === "settings") return <SettingsScreen onBack={() => setScreen("main")} />;
  return <MainScreen onSettings={() => setScreen("settings")} />;
}
