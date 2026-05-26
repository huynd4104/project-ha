import { httpClient } from "./httpClient";

export type AiConversationEvaluationType = "EXACT" | "KEYWORD" | "SEMANTIC" | "OPEN_ENDED";

export interface AiConversationTopic {
  id: string;
  title: string;
  description?: string | null;
  ageRangeMin?: number | null;
  ageRangeMax?: number | null;
  difficultyLevel: string;
  iconName?: string | null;
  mascotReaction?: string | null;
  estimatedDurationSeconds: number;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AiConversationQuestion {
  id: string;
  topicId: string;
  questionText: string;
  questionAudioText?: string | null;
  expectedAnswer?: string | null;
  acceptedKeywords: string[];
  alternativeAnswers: string[];
  evaluationType: AiConversationEvaluationType;
  hintText?: string | null;
  positiveFeedback?: string | null;
  retryFeedback?: string | null;
  maxAttempts: number;
  difficultyLevel: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type AiConversationTopicPayload = Omit<AiConversationTopic, "id" | "createdAt" | "updatedAt">;
export type AiConversationQuestionPayload = Omit<AiConversationQuestion, "id" | "topicId" | "createdAt" | "updatedAt">;

export const aiConversationApi = {
  async listTopics() {
    const res = await httpClient.get("/api/admin/ai-conversations/topics");
    return res.data as AiConversationTopic[];
  },
  async createTopic(data: AiConversationTopicPayload) {
    const res = await httpClient.post("/api/admin/ai-conversations/topics", data);
    return res.data as AiConversationTopic;
  },
  async updateTopic(id: string, data: AiConversationTopicPayload) {
    const res = await httpClient.put(`/api/admin/ai-conversations/topics/${id}`, data);
    return res.data as AiConversationTopic;
  },
  async setTopicActive(id: string, active: boolean) {
    const res = await httpClient.patch(`/api/admin/ai-conversations/topics/${id}/active`, { isActive: active });
    return res.data as AiConversationTopic;
  },
  async deleteTopic(id: string) {
    await httpClient.delete(`/api/admin/ai-conversations/topics/${id}`);
  },
  async listQuestions(topicId: string) {
    const res = await httpClient.get(`/api/admin/ai-conversations/topics/${topicId}/questions`);
    return res.data as AiConversationQuestion[];
  },
  async createQuestion(topicId: string, data: AiConversationQuestionPayload) {
    const res = await httpClient.post(`/api/admin/ai-conversations/topics/${topicId}/questions`, data);
    return res.data as AiConversationQuestion;
  },
  async updateQuestion(id: string, data: AiConversationQuestionPayload) {
    const res = await httpClient.put(`/api/admin/ai-conversations/questions/${id}`, data);
    return res.data as AiConversationQuestion;
  },
  async setQuestionActive(id: string, active: boolean) {
    const res = await httpClient.patch(`/api/admin/ai-conversations/questions/${id}/active`, { isActive: active });
    return res.data as AiConversationQuestion;
  },
  async deleteQuestion(id: string) {
    await httpClient.delete(`/api/admin/ai-conversations/questions/${id}`);
  }
};
