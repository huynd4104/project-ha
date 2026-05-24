import { CrudPage } from "./CrudPage";
export function ProgressPage() {
  return <CrudPage title="Tiến độ" path="/admin/progress" readonly fields={[]} columns={["status", "score", "totalQuestions", "correctAnswers", "completedAt"]} />;
}
