export function DataTable({ rows, columns, onEdit, onDelete }: { rows: any[]; columns: string[]; onEdit?: (row: any) => void; onDelete?: (row: any) => void }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((col) => <th key={col}>{columnLabels[col] ?? col}</th>)}
            {(onEdit || onDelete) && <th>Thao tác</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
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
  );
}

function formatCell(value: unknown) {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (value === null || value === undefined) return "";
  if (value === "PARENT") return "Phụ huynh";
  if (value === "ADMIN") return "Quản trị";
  if (value === "COMPLETED") return "Đã hoàn thành";
  if (value === "IN_PROGRESS") return "Đang học";
  if (value === "MATH") return "Toán";
  if (value === "DIALOGUE") return "Hội thoại";
  if (typeof value === "object") return "";
  return String(value);
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
  npcId: "ID NPC",
  orderIndex: "Thứ tự",
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
