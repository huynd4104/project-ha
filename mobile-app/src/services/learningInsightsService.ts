import AsyncStorage from "@react-native-async-storage/async-storage";
import { Lesson } from "../types";

const FAVORITES_KEY = "project_ha_favorite_lessons";
const STATS_KEY = "project_ha_lesson_stats";
const USAGE_KEY = "project_ha_usage_stats";

type LessonSnapshot = Pick<Lesson, "id" | "title" | "type">;
type LessonStat = LessonSnapshot & {
  opens: number;
  completions: number;
  favoriteCount: number;
  lastOpenedAt?: string;
  lastCompletedAt?: string;
};
type UsageStats = {
  totalMs: number;
  byDate: Record<string, number>;
  lastStartedAt?: number;
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

function snapshot(lesson: Lesson): LessonSnapshot {
  return { id: lesson.id, title: lesson.title, type: lesson.type };
}

async function upsertStat(lesson: Lesson, updater: (stat: LessonStat) => LessonStat) {
  const stats = await readJson<Record<string, LessonStat>>(STATS_KEY, {});
  const current = stats[lesson.id] || { ...snapshot(lesson), opens: 0, completions: 0, favoriteCount: 0 };
  stats[lesson.id] = updater({ ...current, ...snapshot(lesson) });
  await writeJson(STATS_KEY, stats);
  return stats[lesson.id];
}

export const learningInsightsService = {
  async getFavoriteIds() {
    return readJson<string[]>(FAVORITES_KEY, []);
  },
  async isFavorite(lessonId: string) {
    return (await this.getFavoriteIds()).includes(lessonId);
  },
  async toggleFavorite(lesson: Lesson) {
    const favorites = await this.getFavoriteIds();
    const exists = favorites.includes(lesson.id);
    const next = exists ? favorites.filter((id) => id !== lesson.id) : [...favorites, lesson.id];
    await writeJson(FAVORITES_KEY, next);
    await upsertStat(lesson, (stat) => ({ ...stat, favoriteCount: exists ? Math.max(0, stat.favoriteCount - 1) : stat.favoriteCount + 1 }));
    return !exists;
  },
  async recordLessonOpen(lesson: Lesson) {
    return upsertStat(lesson, (stat) => ({ ...stat, opens: stat.opens + 1, lastOpenedAt: new Date().toISOString() }));
  },
  async recordLessonComplete(lesson: Lesson) {
    return upsertStat(lesson, (stat) => ({ ...stat, completions: stat.completions + 1, lastCompletedAt: new Date().toISOString() }));
  },
  async startUsageSession() {
    const usage = await readJson<UsageStats>(USAGE_KEY, { totalMs: 0, byDate: {} });
    usage.lastStartedAt = Date.now();
    await writeJson(USAGE_KEY, usage);
  },
  async stopUsageSession() {
    const usage = await readJson<UsageStats>(USAGE_KEY, { totalMs: 0, byDate: {} });
    if (!usage.lastStartedAt) return usage;
    const delta = Math.max(0, Date.now() - usage.lastStartedAt);
    const key = todayKey();
    usage.totalMs += delta;
    usage.byDate[key] = (usage.byDate[key] || 0) + delta;
    usage.lastStartedAt = undefined;
    await writeJson(USAGE_KEY, usage);
    return usage;
  },
  async getInsights() {
    await this.stopUsageSession();
    await this.startUsageSession();
    const [favoriteIds, stats, usage] = await Promise.all([
      this.getFavoriteIds(),
      readJson<Record<string, LessonStat>>(STATS_KEY, {}),
      readJson<UsageStats>(USAGE_KEY, { totalMs: 0, byDate: {} }),
    ]);
    const statList = Object.values(stats);
    return {
      favoriteIds,
      favoriteLessons: favoriteIds.map((id) => stats[id]).filter(Boolean),
      mostOpenedLesson: [...statList].sort((a, b) => b.opens - a.opens)[0] || null,
      mostCompletedLesson: [...statList].sort((a, b) => b.completions - a.completions)[0] || null,
      mostFavoriteLesson: [...statList].sort((a, b) => b.favoriteCount - a.favoriteCount)[0] || null,
      totalUsageMs: usage.totalMs,
      todayUsageMs: usage.byDate[todayKey()] || 0,
    };
  },
};

export function formatUsage(ms: number) {
  const minutes = Math.max(0, Math.round(ms / 60000));
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} giờ ${rest} phút` : `${hours} giờ`;
}
