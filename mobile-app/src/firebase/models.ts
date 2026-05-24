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

export type UserUnlockedNpc = {
  id: string;
  userId: string;
  childId: string;
  npcId: string;
  qrCodeId?: string;
  unlockedAt: any;
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

export type MathQuestion = {
  id: string;
  lessonId: string;
  questionText: string;
  imageUrl?: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  explanation?: string;
  orderIndex: number;
  createdAt: any;
  updatedAt: any;
};

export type Dialogue = {
  id: string;
  lessonId: string;
  title: string;
  sceneText: string;
  audioUrl?: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  orderIndex: number;
  createdAt: any;
  updatedAt: any;
};

export type Flashcard = {
  id: string;
  lessonId: string;
  frontText: string;
  backText: string;
  imageUrl?: string;
  audioUrl?: string;
  orderIndex: number;
  createdAt: any;
  updatedAt: any;
};

export type Progress = {
  id: string;
  userId: string;
  childId: string;
  lessonId: string;
  activityType?: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  score?: number;
  totalQuestions?: number;
  correctAnswers?: number;
  completedAt?: any;
  createdAt: any;
  updatedAt: any;
};

export type XPLog = {
  id: string;
  userId: string;
  childId: string;
  amount: number;
  reason: string;
  createdAt: any;
};

export type Streak = {
  id: string;
  userId: string;
  childId: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  updatedAt: any;
};
