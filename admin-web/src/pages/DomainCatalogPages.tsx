import { CrudPage } from "./CrudPage";

export function DevelopmentCategoriesPage() {
  return (
    <CrudPage
      title="Nhóm khó khăn phát triển"
      path="/development-categories"
      readonly
      library
      fields={[]}
      columns={["key", "label", "parentDescription", "isActive"]}
    />
  );
}

export function LearningGoalsPage() {
  return (
    <CrudPage
      title="Mục tiêu học tập"
      path="/learning-goals"
      readonly
      library
      fields={[]}
      columns={["key", "label", "parentDescription", "isActive"]}
    />
  );
}

export function SkillsPage() {
  return (
    <CrudPage
      title="Kỹ năng"
      path="/skills"
      readonly
      library
      fields={[]}
      columns={["key", "label", "domain", "parentDescription", "isActive"]}
    />
  );
}

export function ProgramsPage() {
  return (
    <CrudPage
      title="Thư viện chương trình"
      description="Kho chương trình có thể dùng làm tham chiếu khi thiết kế chương trình học mới."
      path="/programs"
      readonly
      library
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
      title="Thư viện lộ trình"
      description="Kho lộ trình có thể dùng làm tham chiếu khi sắp xếp bài học vào kiến trúc mới."
      path="/learning-paths"
      readonly
      library
      fields={[]}
      columns={[
        "title",
        "programId",
        "level",
        "accessType",
        "status"
      ]}
    />
  );
}
