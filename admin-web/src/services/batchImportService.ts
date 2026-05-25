import { httpClient } from "../api/httpClient";

const collectionToResource: Record<string, string> = {
  "lessons": "lessons",
  "npcs": "npcs",
  "mathQuestions": "math-questions",
  "mediaAssets": "media-assets",
  "developmentCategories": "development-categories",
  "learningGoals": "learning-goals",
  "skills": "skills",
  "activationCodes": "activation-codes",
  "qrCodes": "qr-codes",
  "dailyMissions": "daily-missions",
  "badges": "badges"
};

export async function batchImport(collectionName: string, rows: any[]) {
  const resource = collectionToResource[collectionName] || collectionName;
  await httpClient.post(`/api/admin/${resource}/batch`, rows);
}
