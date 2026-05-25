import { api, AnyRecord } from "./client";

export const resources = [
  { key: "users", label: "Users" },
  { key: "children", label: "Children" },
  { key: "programs", label: "Programs" },
  { key: "learning-paths", label: "Learning Paths" },
  { key: "path-items", label: "Path Items" },
  { key: "lessons", label: "Lessons" },
  { key: "activities", label: "Activities" },
  { key: "media-files", label: "Media Files" },
  { key: "npcs", label: "NPCs" },
  { key: "daily-missions", label: "Daily Missions" },
  { key: "audit-logs", label: "Audit Logs" },
] as const;

export const adminApi = {
  list: (resource: string) => api.get<AnyRecord[]>(`/api/admin/${resource}`),
  create: (resource: string, payload: AnyRecord) => api.post<AnyRecord>(`/api/admin/${resource}`, payload),
  update: (resource: string, id: string, payload: AnyRecord) => api.put<AnyRecord>(`/api/admin/${resource}/${id}`, payload),
  remove: (resource: string, id: string) => api.delete<{ ok: boolean }>(`/api/admin/${resource}/${id}`),
};
