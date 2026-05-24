import { CrudPage } from "./CrudPage";
export function ChildrenPage() {
  return (
    <CrudPage
      title="Hồ sơ trẻ"
      path="/children"
      readonly
      fields={[]}
      columns={[
        "name",
        "age",
        "gender",
        "primaryDifficulty",
        "learningGoals",
        "supportLevel",
        "dailyDurationMinutes",
        "coLearningMode",
        "note"
      ]}
    />
  );
}
