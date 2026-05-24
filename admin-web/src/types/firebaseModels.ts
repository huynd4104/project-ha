export type User = {
  uid: string;
  email: string;
  fullName: string;
  role: "PARENT" | "ADMIN";
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
};

export type ChildProfile = {
  id: string;
  userId: string;
  name: string;
  age: number;
  gender: string;
  note: string;
  createdAt: any;
  updatedAt: any;
};

export type NPC = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  animationUrl?: string;
  defaultDialogue: string;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
};

export type QRCode = {
  id: string;
  code: string;
  npcId: string;
  label: string;
  isActive: boolean;
  maxUses?: number | null;
  usedCount: number;
  createdAt: any;
  updatedAt: any;
};

export type Lesson = {
  id: string;
  title: string;
  description: string;
  type: "MATH" | "DIALOGUE" | "FLASHCARD" | "THINKING" | "SPELLING" | "RHYME";
  orderIndex: number;
  npcId?: string | null;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
};
