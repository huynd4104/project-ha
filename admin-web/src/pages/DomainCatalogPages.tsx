import { CrudPage } from "./CrudPage";

export function DevelopmentCategoriesPage() {
  return (
    <CrudPage
      title="Nhóm khó khăn phát triển"
      path="/development-categories"
      readonly
      fields={[]}
      columns={["key", "label", "parentDescription", "isActive", "orderIndex"]}
    />
  );
}

export function LearningGoalsPage() {
  return (
    <CrudPage
      title="Mục tiêu học tập"
      path="/learning-goals"
      readonly
      fields={[]}
      columns={["key", "label", "parentDescription", "isActive", "orderIndex"]}
    />
  );
}

export function SkillsPage() {
  return (
    <CrudPage
      title="Kỹ năng"
      path="/skills"
      readonly
      fields={[]}
      columns={["key", "label", "domain", "parentDescription", "isActive", "orderIndex"]}
    />
  );
}

export function ProgramsPage() {
  return (
    <CrudPage
      title="Chương trình"
      path="/programs"
      readonly
      fields={[]}
      columns={[
        "title",
        "targetAgeMin",
        "targetAgeMax",
        "difficultyCategories",
        "learningGoals",
        "skillTags",
        "level",
        "accessType",
        "status"
      ]}
    />
  );
}

export function LearningPathsPage() {
  return (
    <CrudPage
      title="Lộ trình học"
      path="/learning-paths"
      readonly
      fields={[]}
      columns={[
        "title",
        "programId",
        "level",
        "orderIndex",
        "accessType",
        "status"
      ]}
    />
  );
}
