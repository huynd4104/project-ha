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
  displayName?: string;
  name: string;
  age: number;
  gender: string;
  note: string;
  primaryDifficulty?: DevelopmentCategoryKey;
  secondaryDifficulties?: DevelopmentCategoryKey[];
  learningGoals?: LearningGoalKey[];
  supportLevel?: SupportLevel;
  dailyDurationMinutes?: number;
  coLearningMode?: CoLearningMode;
  interests?: string[];
  accessibilityPreferences?: Record<string, unknown>;
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
  lessonType?: string;
  orderIndex: number;
  programId?: string | null;
  pathId?: string | null;
  level?: LearningLevel;
  skillTags?: string[];
  difficultyCategories?: DevelopmentCategoryKey[];
  learningGoals?: LearningGoalKey[];
  estimatedMinutes?: number;
  npcId?: string | null;
  accessType?: AccessType;
  publishStatus?: PublishStatus;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
};

export type DevelopmentCategoryKey =
  | "SPEECH_DELAY"
  | "ATTENTION_DIFFICULTY"
  | "COGNITIVE_DELAY"
  | "SOCIAL_COMMUNICATION"
  | "EMOTION_RECOGNITION"
  | "DAILY_LIFE_SKILL"
  | "OTHER";

export type LearningGoalKey =
  | "LISTENING"
  | "SPEAKING"
  | "OBJECT_RECOGNITION"
  | "EMOTION_RECOGNITION"
  | "DAILY_COMMUNICATION"
  | "MATCHING"
  | "COUNTING"
  | "FOLLOW_INSTRUCTION"
  | "PARENT_CHILD_ACTIVITY";

export type SupportLevel = "LOW" | "MEDIUM" | "HIGH";
export type CoLearningMode =
  | "CHILD_WITH_GUIDANCE"
  | "PARENT_CHILD_TOGETHER"
  | "SPECIALIST_SUPPORT";
export type LearningLevel = "BEGINNER" | "BASIC" | "INTERMEDIATE";
export type AccessType = "FREE" | "PREMIUM";
export type PublishStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type UnlockRule =
  | "ALWAYS_OPEN"
  | "PREVIOUS_COMPLETED"
  | "MANUAL_UNLOCK"
  | "PREMIUM_ONLY";

export type DevelopmentCategory = {
  id: string;
  key: DevelopmentCategoryKey;
  label: string;
  parentDescription: string;
  isActive: boolean;
  orderIndex: number;
  createdAt: any;
  updatedAt: any;
};

export type LearningGoal = {
  id: string;
  key: LearningGoalKey;
  label: string;
  description?: string;
  parentDescription: string;
  skillTags?: string[];
  isActive: boolean;
  orderIndex: number;
  createdAt: any;
  updatedAt: any;
};

export type Skill = {
  id: string;
  key: string;
  label: string;
  domain: string;
  parentDescription: string;
  isActive: boolean;
  orderIndex: number;
  createdAt: any;
  updatedAt: any;
};

export type Program = {
  id: string;
  title: string;
  description: string;
  targetAgeMin: number;
  targetAgeMax: number;
  difficultyCategories: DevelopmentCategoryKey[];
  learningGoals: LearningGoalKey[];
  skillTags: string[];
  level: LearningLevel;
  accessType: AccessType;
  status: PublishStatus;
  createdAt: any;
  updatedAt: any;
};

export type LearningPath = {
  id: string;
  programId: string;
  title: string;
  description: string;
  targetProfileRules: Record<string, unknown>;
  level: LearningLevel;
  orderIndex: number;
  accessType: AccessType;
  status: PublishStatus;
  createdAt: any;
  updatedAt: any;
};

export type PathItem = {
  id: string;
  pathId: string;
  lessonId: string;
  sequence: number;
  unlockRule: UnlockRule;
  prerequisiteLessonIds: string[];
  requiredCompletion: boolean;
  createdAt: any;
  updatedAt: any;
};

export type ActivityType =
  | "LISTEN_AND_CHOOSE_IMAGE"
  | "LOOK_AND_CHOOSE_WORD"
  | "HEAR_AND_REPEAT"
  | "VOICE_ANSWER"
  | "MATCH_OBJECTS"
  | "EMOTION_RECOGNITION"
  | "DAILY_LIFE_SCENARIO"
  | "MULTIPLE_CHOICE"
  | "FLASHCARD_REVIEW"
  | "PARENT_MARK_RESULT";

export type ActivityOption = {
  id: string;
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
  isCorrect?: boolean;
};

export type ActivityFeedback = {
  correct?: string;
  almost?: string;
  wrong?: string;
  hint?: string;
};

export type Activity = {
  id: string;
  lessonId: string;
  activityType: ActivityType;
  orderIndex: number;
  prompt: string;
  instruction?: string;
  audioUrl?: string;
  imageUrl?: string;
  ttsPromptText?: string;
  mediaRefs?: Array<Record<string, string>>;
  options?: ActivityOption[];
  correctAnswers?: string[];
  acceptedAnswers?: string[];
  almostAnswers?: string[];
  feedback?: ActivityFeedback;
  retryLimit?: number;
  voicePremiumRequired?: boolean;
  skillTags?: string[];
  parentInstruction?: string;
  accessType?: AccessType;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
};

export type ActivityAttempt = {
  id: string;
  userId: string;
  childId: string;
  lessonId: string;
  activityId?: string | null;
  activityType: string;
  result: string;
  score: number;
  skillTags?: string[];
  createdAt: any;
};

export type LessonProgress = {
  id: string;
  userId: string;
  childId: string;
  lessonId: string;
  status: string;
  bestScore: number;
  attemptsCount: number;
  createdAt: any;
  updatedAt: any;
};

export type ActivationType = "NPC" | "LESSON" | "PATH" | "REWARD" | "PHYSICAL_TOY";
export type ActivationSource = "QR" | "NFC" | "MANUAL";

export type ActivationCode = {
  id: string;
  code: string;
  activationType: ActivationType;
  targetId: string;
  label: string;
  active: boolean;
  maxUses?: number | null;
  usedCount: number;
  perUserLimit?: number | null;
  expiresAt?: any;
  source: ActivationSource;
  createdAt: any;
  updatedAt: any;
};

export type DialogueTemplates = {
  welcome?: string;
  beforeActivity?: string;
  correct?: string;
  wrong?: string;
  lessonComplete?: string;
  encouragement?: string;
};

export type NPCAdvanced = NPC & {
  role?: string;
  personality?: string;
  skillTags?: string[];
  programIds?: string[];
  pathIds?: string[];
  dialogueTemplates?: DialogueTemplates;
  unlockBenefit?: string;
  accessType?: AccessType;
};

export type ActivationRedemption = {
  id: string;
  userId: string;
  childId: string;
  code: string;
  activationType: string;
  targetId: string;
  createdAt: any;
};

export type SubscriptionSummary = {
  id: string;
  userId: string;
  status: string;
  plan: string;
  entitlements: string[];
};

export type VoiceUsageLog = {
  id: string;
  userId: string;
  childId: string;
  activityId?: string | null;
  provider?: string;
  durationSec?: number;
  createdAt: any;
};
