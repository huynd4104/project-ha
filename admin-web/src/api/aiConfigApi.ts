import { api } from "./client";

export type AdminGeminiConfigResponse = {
  provider: string;
  evaluationEnabled: boolean;
  semanticModel: string;
  timeoutMs: number;
  apiKeyConfigured: boolean;
  maskedApiKey?: string;
  lastTestedAt?: string;
  lastTestStatus?: string;
  lastTestMessage?: string;
};

export type AdminGeminiConfigRequest = {
  evaluationEnabled: boolean;
  semanticModel: string;
  timeoutMs: number;
  apiKey?: string;
  clearApiKey: boolean;
};

export type AdminAiConfigTestRequest = {
  apiKey?: string;
  semanticModel?: string;
  timeoutMs?: number;
};

export type AdminAiConfigTestResponse = {
  success: boolean;
  message: string;
  model: string;
};

export const aiConfigApi = {
  getGeminiConfig: () => api.get<AdminGeminiConfigResponse>("/api/admin/ai-config/gemini"),

  updateGeminiConfig: (data: AdminGeminiConfigRequest) =>
    api.put<AdminGeminiConfigResponse>("/api/admin/ai-config/gemini", data as any),

  testGeminiConfig: (data?: AdminAiConfigTestRequest) =>
    api.post<AdminAiConfigTestResponse>("/api/admin/ai-config/gemini/test", data as any),
};
