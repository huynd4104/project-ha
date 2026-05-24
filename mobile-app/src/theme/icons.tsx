import { Text, TextStyle } from "react-native";

export type AppIconName =
  | "home" | "path" | "qr" | "collection" | "progress" | "parent"
  | "math" | "dialogue" | "flashcard" | "streak" | "xp" | "badge"
  | "lock" | "check" | "wrong" | "sound" | "settings" | "back"
  | "close" | "reward" | "heart" | "play" | "star";

const glyphs: Record<AppIconName, string> = {
  home: "🏡",
  path: "🧭",
  qr: "📷",
  collection: "🧸",
  progress: "📈",
  parent: "🫶",
  math: "🧮",
  dialogue: "💬",
  flashcard: "🃏",
  streak: "🔥",
  xp: "✨",
  badge: "🏅",
  lock: "🔒",
  check: "✅",
  wrong: "❌",
  sound: "🎵",
  settings: "⚙",
  back: "←",
  close: "✕",
  reward: "🎁",
  heart: "💖",
  play: "▶",
  star: "🌟",
};

export function AppIcon({ name, size = 22, color = "#25323A", style }: { name: AppIconName; size?: number; color?: string; style?: TextStyle }) {
  return <Text style={[{ fontSize: size, color, fontWeight: "900", lineHeight: size + 4 }, style]}>{glyphs[name]}</Text>;
}
