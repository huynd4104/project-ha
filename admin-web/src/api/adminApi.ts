import { httpClient } from "./httpClient";
import { adminContentApi } from "./adminContentApi";

const pathToCollection: Record<string, string> = {
  "/users": "users",
  "/children": "children",
  "/npcs": "npcs",
  "/qr-codes": "qr-codes",
  "/development-categories": "development-categories",
  "/learning-goals": "learning-goals",
  "/skills": "skills",
  "/programs": "programs",
  "/learning-paths": "learning-paths",
  "/path-items": "path-items",
  "/activities": "activities",
  "/activation-codes": "activation-codes",
  "/lessons": "lessons",
  "/math-questions": "math-questions",
  "/dialogues": "dialogues",
  "/flashcards": "flashcards",
  "/spelling-activities": "spelling-activities",
  "/rhyme-challenges": "rhyme-challenges",
  "/admin/progress": "progress",
  "/progress": "progress",
  "/badges": "badges",
  "/daily-missions": "daily-missions",
  "/transactions": "transactions"
};

export const adminApi = {
  async dashboard() {
    const res = await httpClient.get("/api/admin/dashboard");
    return { data: { data: res.data } };
  },
  async list(path: string, params?: Record<string, string>) {
    const resource = resolveCollection(path);
    const data = await adminContentApi.list(resource, params);
    if (resource === "lessons") {
      data.sort((a: any, b: any) => `${a.title ?? ""}`.localeCompare(`${b.title ?? ""}`));
    } else {
      data.sort((a: any, b: any) => toMillis(b.createdAt) - toMillis(a.createdAt));
    }
    return { data: { data } };
  },
  async create(path: string, data: any) {
    const resource = resolveCollection(path);
    const res = await adminContentApi.create(resource, data);
    return { data: { data: res } };
  },
  async update(path: string, id: string, data: any) {
    const resource = resolveCollection(path);
    const res = await adminContentApi.update(resource, id, data);
    return { data: { data: res } };
  },
  async remove(path: string, id: string) {
    const resource = resolveCollection(path);
    await adminContentApi.remove(resource, id);
    return { data: { data: true } };
  }
};

function resolveCollection(path: string) {
  return pathToCollection[path] ?? path.replace(/^\//, "");
}

function toMillis(value: any) {
  if (!value) return 0;
  if (typeof value === "number") return value;
  return Date.parse(value) || 0;
}
