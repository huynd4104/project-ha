import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";

const SOUND_KEY = "project_ha_sound_enabled";
type SoundName =
  | "tap"
  | "ui-soft"
  | "ui-primary"
  | "ui-nav"
  | "ui-choice"
  | "correct"
  | "wrong"
  | "reward"
  | "unlock"
  | "level-up";

const soundAssets: Record<SoundName, number> = {
  tap: require("../../assets/sounds/tap.wav"),
  "ui-soft": require("../../assets/sounds/ui-soft.wav"),
  "ui-primary": require("../../assets/sounds/ui-primary.wav"),
  "ui-nav": require("../../assets/sounds/ui-nav.wav"),
  "ui-choice": require("../../assets/sounds/ui-choice.wav"),
  correct: require("../../assets/sounds/correct.wav"),
  wrong: require("../../assets/sounds/wrong.wav"),
  reward: require("../../assets/sounds/reward.wav"),
  unlock: require("../../assets/sounds/unlock.wav"),
  "level-up": require("../../assets/sounds/level-up.wav"),
};

const loadedSounds: Partial<Record<SoundName, Audio.Sound>> = {};
const soundVolumes: Record<SoundName, number> = {
  tap: 0.55,
  "ui-soft": 0.55,
  "ui-primary": 0.72,
  "ui-nav": 0.62,
  "ui-choice": 0.6,
  correct: 0.8,
  wrong: 0.74,
  reward: 0.85,
  unlock: 0.82,
  "level-up": 0.9,
};
let enabled = true;
let initPromise: Promise<void> | null = null;
let lastUiSoundAt = 0;

async function loadEnabled() {
  try {
    const raw = await AsyncStorage.getItem(SOUND_KEY);
    if (raw !== null) enabled = raw === "true";
  } catch {
    enabled = true;
  }
}

async function ensureInitialized() {
  if (initPromise) {
    await initPromise;
    return;
  }

  initPromise = (async () => {
    await loadEnabled();
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    const entries = Object.entries(soundAssets) as [SoundName, number][];
    await Promise.all(
      entries.map(async ([name, asset]) => {
        try {
          const { sound } = await Audio.Sound.createAsync(asset, {
            shouldPlay: false,
            isLooping: false,
            volume: 1,
          });
          loadedSounds[name] = sound;
        } catch {
          // Keep app functional even if one audio file fails to load.
        }
      })
    );
  })();

  await initPromise;
}

async function playOptional(name: SoundName) {
  if (!enabled) return;

  // Prevent rapid-fire UI clicks from becoming harsh in quick tapping flows.
  if (name.startsWith("ui-") || name === "tap") {
    const now = Date.now();
    if (now - lastUiSoundAt < 70) return;
    lastUiSoundAt = now;
  }

  try {
    await ensureInitialized();
    const sound = loadedSounds[name];
    if (!sound) return;
    await sound.setVolumeAsync(soundVolumes[name]);
    await sound.replayAsync();
  } catch {
    // Sound feedback is optional; never block learning flows because audio failed.
  }
}

export const soundService = {
  init: () => ensureInitialized(),
  playTap: () => playOptional("tap"),
  playUiSoft: () => playOptional("ui-soft"),
  playUiPrimary: () => playOptional("ui-primary"),
  playUiNav: () => playOptional("ui-nav"),
  playUiChoice: () => playOptional("ui-choice"),
  playCorrect: () => playOptional("correct"),
  playWrong: () => playOptional("wrong"),
  playReward: () => playOptional("reward"),
  playUnlock: () => playOptional("unlock"),
  playLevelUp: () => playOptional("level-up"),
  async setSoundEnabled(value: boolean) {
    enabled = value;
    try {
      await AsyncStorage.setItem(SOUND_KEY, String(value));
    } catch {
      // Ignore persistence errors; the runtime toggle still works for this session.
    }
  },
  getSoundEnabled() {
    return enabled;
  },
  async unload() {
    const sounds = Object.values(loadedSounds);
    await Promise.all(
      sounds.map(async (sound) => {
        try {
          await sound?.unloadAsync();
        } catch {
          // Ignore cleanup issues when app is shutting down.
        }
      })
    );
  },
};
