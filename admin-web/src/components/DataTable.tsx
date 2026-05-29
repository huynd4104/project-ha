import { TableControls } from "./TableControls";
import { useTableControls } from "../utils/tableControls";

export function DataTable({ rows, columns, onEdit, onDelete }: { rows: any[]; columns: string[]; onEdit?: (row: any) => void; onDelete?: (row: any) => void }) {
  const sortOptions = columns.map((col) => ({
    value: col,
    label: columnLabels[col] ?? col,
    getValue: (row: any) => row[col]
  }));
  const table = useTableControls(rows, sortOptions, columns[0]);

  return (
    <>
      <TableControls {...table} />
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((col) => <th key={col}>{columnLabels[col] ?? col}</th>)}
              {(onEdit || onDelete) && <th>Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {table.pagedItems.map((row) => (
              <tr key={row.id}>
                {columns.map((col) => <td key={col}>{formatCell(row[col])}</td>)}
                {(onEdit || onDelete) && (
                  <td className="actions">
                    {row.code && <button onClick={() => navigator.clipboard?.writeText(row.code)}>Sao chép</button>}
                    {onEdit && <button onClick={() => onEdit(row)}>Sửa</button>}
                    {onDelete && <button className="danger" onClick={() => onDelete(row)}>Xóa</button>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

const valueLabels: Record<string, string> = {
  // Roles
  PARENT: "Phụ huynh",
  ADMIN: "Quản trị",

  // Progress/Status
  COMPLETED: "Đã hoàn thành",
  IN_PROGRESS: "Đang học",
  NOT_STARTED: "Chưa bắt đầu",
  STARTED: "Đã bắt đầu",
  DRAFT: "Bản nháp",
  PUBLISHED: "Đã xuất bản",
  ARCHIVED: "Đã lưu trữ",
  RECORDED: "Đã ghi nhận",

  // Subjects / Type
  MATH: "Toán",
  FLASHCARD: "Flashcard",

  // Support Level
  LOW: "Cần hỗ trợ ít",
  MEDIUM: "Cần hỗ trợ vừa",
  HIGH: "Cần hỗ trợ nhiều",

  // Co-Learning Mode
  CHILD_WITH_GUIDANCE: "Bé học với hướng dẫn",
  PARENT_CHILD_TOGETHER: "Phụ huynh và bé cùng học",
  SPECIALIST_SUPPORT: "Có chuyên gia hỗ trợ thêm",

  // Development Category / Primary Difficulty
  SPEECH_DELAY: "Chậm nói / khó khăn lời nói",
  ATTENTION_DIFFICULTY: "Khó tập trung",
  COGNITIVE_DELAY: "Chậm phát triển nhận thức",
  SOCIAL_COMMUNICATION: "Giao tiếp xã hội",
  EMOTION_RECOGNITION: "Nhận biết cảm xúc",
  DAILY_LIFE_SKILL: "Kỹ năng sinh hoạt",
  OTHER: "Khác / chưa xác định",

  // Learning Goal
  LISTENING: "Lắng nghe",
  SPEAKING: "Nói",
  OBJECT_RECOGNITION: "Nhận biết đồ vật",
  DAILY_COMMUNICATION: "Giao tiếp hằng ngày",
  MATCHING: "Ghép đôi",
  COUNTING: "Đếm số",
  FOLLOW_INSTRUCTION: "Làm theo hướng dẫn",
  PARENT_CHILD_ACTIVITY: "Hoạt động cùng phụ huynh",
};

function formatSingleValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (typeof value === "object") return "";
  const strVal = String(value);
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toLocaleString("vi-VN");
    }
  }
  return valueLabels[strVal] ?? strVal;
}

function formatCell(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((v) => formatSingleValue(v)).join(", ");
  }
  return formatSingleValue(value);
}

const columnLabels: Record<string, string> = {
  age: "Tuổi",
  accessType: "Quyền truy cập",
  backText: "Mặt sau",
  code: "Mã",
  completedAt: "Hoàn thành lúc",
  coLearningMode: "Cách học",
  correctAnswers: "Câu đúng",
  correctOption: "Đáp án đúng",
  dailyDurationMinutes: "Phút/ngày",
  description: "Mô tả",
  difficultyCategories: "Nhóm khó khăn",
  email: "Email",
  frontText: "Mặt trước",
  fullName: "Họ tên",
  gender: "Giới tính",
  imageUrl: "URL hình ảnh",
  isActive: "Đang hoạt động",
  label: "Nhãn",
  learningGoals: "Mục tiêu",
  level: "Cấp độ",
  lessonId: "ID bài học",
  maxUses: "Lượt dùng tối đa",
  name: "Tên",
  note: "Ghi chú",
  npcId: "ID nhân vật",
  primaryDifficulty: "Khó khăn chính",
  programId: "ID chương trình",
  publishStatus: "Trạng thái xuất bản",
  questionText: "Câu hỏi",
  role: "Vai trò",
  score: "Điểm",
  sequence: "Thứ tự",
  skillTags: "Kỹ năng",
  status: "Trạng thái",
  supportLevel: "Mức hỗ trợ",
  targetAgeMin: "Tuổi từ",
  targetAgeMax: "Tuổi đến",
  title: "Tiêu đề",
  totalQuestions: "Tổng câu hỏi",
  type: "Loại",
  usedCount: "Đã dùng"
};
