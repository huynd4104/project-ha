import { CrudPage } from "./CrudPage";

export function DevelopmentCategoriesPage() {
  return (
    <CrudPage
      title="Nhóm khó khăn phát triển"
      path="/development-categories"
      readonly
      legacy
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
      legacy
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
      legacy
      fields={[]}
      columns={["key", "label", "domain", "parentDescription", "isActive", "orderIndex"]}
    />
  );
}

export function ProgramsPage() {
  return (
    <CrudPage
      title="Chương trình cũ"
      path="/programs"
      readonly
      legacy
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
      title="Lộ trình học cũ"
      path="/learning-paths"
      readonly
      legacy
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
