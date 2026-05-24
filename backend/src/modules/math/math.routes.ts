import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireAdmin } from "../../middlewares/role.middleware";
import { prisma } from "../../prisma/prisma.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError, ok } from "../../utils/response";
import { awardActivity } from "../progress/progress.service";

export const mathRoutes = Router();
export const mathSubmitRoutes = Router();

const questionSchema = z.object({
  lessonId: z.string().min(1),
  questionText: z.string().min(1),
  imageUrl: z.string().optional().nullable(),
  optionA: z.string().min(1),
  optionB: z.string().min(1),
  optionC: z.string().min(1),
  optionD: z.string().min(1),
  correctOption: z.enum(["A", "B", "C", "D"]),
  explanation: z.string().optional().nullable(),
  orderIndex: z.number().int().optional()
});

async function assertChild(userId: string, role: string, childId?: string | null) {
  if (!childId) return;
  const child = await prisma.childProfile.findUnique({ where: { id: childId } });
  if (!child || (role !== "ADMIN" && child.userId !== userId)) throw new AppError(403, "Hồ sơ trẻ không hợp lệ");
}

mathRoutes.use(requireAuth, requireAdmin);
mathRoutes.get("/", asyncHandler(async (_req, res) => ok(res, await prisma.mathQuestion.findMany({ include: { lesson: true }, orderBy: { orderIndex: "asc" } }))));
mathRoutes.post("/", asyncHandler(async (req, res) => ok(res, await prisma.mathQuestion.create({ data: questionSchema.parse(req.body) }), "Đã tạo câu hỏi")));
mathRoutes.put("/:id", asyncHandler(async (req, res) => ok(res, await prisma.mathQuestion.update({ where: { id: req.params.id }, data: questionSchema.partial().parse(req.body) }), "Đã cập nhật câu hỏi")));
mathRoutes.delete("/:id", asyncHandler(async (req, res) => {
  await prisma.mathQuestion.delete({ where: { id: req.params.id } });
  return ok(res, true, "Đã xóa câu hỏi");
}));

mathSubmitRoutes.post("/:id/submit-math", requireAuth, asyncHandler(async (req, res) => {
  const body = z.object({
    childId: z.string().optional().nullable(),
    answers: z.array(z.object({ questionId: z.string(), selectedOption: z.enum(["A", "B", "C", "D"]) }))
  }).parse(req.body);
  await assertChild(req.user!.id, req.user!.role, body.childId);

  const questions = await prisma.mathQuestion.findMany({ where: { lessonId: req.params.id } });
  const answerMap = new Map(body.answers.map((a) => [a.questionId, a.selectedOption]));
  const results = questions.map((q) => ({
    questionId: q.id,
    selectedOption: answerMap.get(q.id) || null,
    correctOption: q.correctOption,
    isCorrect: answerMap.get(q.id) === q.correctOption,
    explanation: q.explanation
  }));
  const correctAnswers = results.filter((r) => r.isCorrect).length;
  const score = questions.length ? Math.round((correctAnswers / questions.length) * 100) : 0;

  const existing = await prisma.userProgress.findFirst({ where: { userId: req.user!.id, childId: body.childId || null, lessonId: req.params.id } });
  const data = { status: "COMPLETED" as const, score, totalQuestions: questions.length, correctAnswers, completedAt: new Date() };
  const progress = existing
    ? await prisma.userProgress.update({ where: { id: existing.id }, data })
    : await prisma.userProgress.create({ data: { ...data, userId: req.user!.id, childId: body.childId || null, lessonId: req.params.id } });

  await awardActivity(req.user!.id, body.childId, 10 + correctAnswers * 2, "Hoàn thành bài toán");
  return ok(res, { score, totalQuestions: questions.length, correctAnswers, results, progress }, "Đã nộp bài toán");
}));
