import { mediaApi, MediaAsset } from "../api/mediaApi";

export type { MediaAsset };

export const mediaService = {
  async list(): Promise<MediaAsset[]> {
    return mediaApi.list();
  },

  async create(data: Omit<MediaAsset, "id" | "createdAt" | "updatedAt">): Promise<MediaAsset> {
    return mediaApi.create(data);
  },

  async update(id: string, data: Omit<MediaAsset, "id" | "createdAt" | "updatedAt">): Promise<MediaAsset> {
    return mediaApi.update(id, data);
  },

  async remove(id: string): Promise<boolean> {
    return mediaApi.remove(id);
  },

  async seedPresets(): Promise<void> {
    const existing = await this.list();
    if (existing.length > 0) return; // Do not overwrite if already seeded

    const presets: Omit<MediaAsset, "id">[] = [
      {
        name: "Mèo Mimi (NPC)",
        type: "IMAGE",
        category: "NPC",
        url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=300&auto=format&fit=crop",
        thumbnailUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=150&auto=format&fit=crop"
      },
      {
        name: "Gấu Bobo (NPC)",
        type: "IMAGE",
        category: "NPC",
        url: "https://images.unsplash.com/photo-1589656966895-2f33e7653819?q=80&w=300&auto=format&fit=crop",
        thumbnailUrl: "https://images.unsplash.com/photo-1589656966895-2f33e7653819?q=80&w=150&auto=format&fit=crop"
      },
      {
        name: "Thỏ Nana (NPC)",
        type: "IMAGE",
        category: "NPC",
        url: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?q=80&w=300&auto=format&fit=crop",
        thumbnailUrl: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?q=80&w=150&auto=format&fit=crop"
      },
      {
        name: "Quả Táo (Flashcard)",
        type: "IMAGE",
        category: "FLASHCARD",
        url: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?q=80&w=300&auto=format&fit=crop",
        thumbnailUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?q=80&w=150&auto=format&fit=crop"
      },
      {
        name: "Quả Chuối (Flashcard)",
        type: "IMAGE",
        category: "FLASHCARD",
        url: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?q=80&w=300&auto=format&fit=crop",
        thumbnailUrl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?q=80&w=150&auto=format&fit=crop"
      },
      {
        name: "Quả Cam (Flashcard)",
        type: "IMAGE",
        category: "FLASHCARD",
        url: "https://images.unsplash.com/photo-1547514701-42782101795e?q=80&w=300&auto=format&fit=crop",
        thumbnailUrl: "https://images.unsplash.com/photo-1547514701-42782101795e?q=80&w=150&auto=format&fit=crop"
      },
      {
        name: "Xe Buýt (Flashcard)",
        type: "IMAGE",
        category: "FLASHCARD",
        url: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=300&auto=format&fit=crop",
        thumbnailUrl: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=150&auto=format&fit=crop"
      },
      {
        name: "Xe Đạp (Flashcard)",
        type: "IMAGE",
        category: "FLASHCARD",
        url: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=300&auto=format&fit=crop",
        thumbnailUrl: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=150&auto=format&fit=crop"
      },
      {
        name: "Nhạc vui nhộn (AI Conversation Audio)",
        type: "AUDIO",
        category: "AI_CONVERSATION",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
      },
      {
        name: "Âm thanh tiếng chim hót (AI Conversation Audio)",
        type: "AUDIO",
        category: "AI_CONVERSATION",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
      }
    ];

    for (const preset of presets) {
      await this.create(preset);
    }
  }
};
