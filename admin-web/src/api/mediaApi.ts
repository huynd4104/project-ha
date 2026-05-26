import { httpClient } from "./httpClient";

export interface MediaAsset {
  id: string;
  name: string;
  type: "IMAGE" | "AUDIO" | "VIDEO";
  category: "NPC" | "FLASHCARD" | "AI_CONVERSATION" | "BADGE" | "GENERAL";
  url: string;
  thumbnailUrl?: string;
  createdAt?: any;
  updatedAt?: any;
}

export const mediaApi = {
  async list(): Promise<MediaAsset[]> {
    const res = await httpClient.get("/api/admin/media-assets");
    return res.data as MediaAsset[];
  },
  async create(data: Omit<MediaAsset, "id" | "createdAt" | "updatedAt">): Promise<MediaAsset> {
    const res = await httpClient.post("/api/admin/media-assets", data);
    return res.data as MediaAsset;
  },
  async update(id: string, data: Omit<MediaAsset, "id" | "createdAt" | "updatedAt">): Promise<MediaAsset> {
    const res = await httpClient.put(`/api/admin/media-assets/${id}`, data);
    return res.data as MediaAsset;
  },
  async remove(id: string): Promise<boolean> {
    await httpClient.delete(`/api/admin/media-assets/${id}`);
    return true;
  }
};
