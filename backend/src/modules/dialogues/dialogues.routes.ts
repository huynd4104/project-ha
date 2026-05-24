import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireAdmin } from "../../middlewares/role.middleware";
import { prisma } from "../../prisma/prisma.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError, ok } from "../../utils/response";
import { awardActivity } from "../progress/progress.service";

export const dialoguesRoutes = Router();
export const dialogueSubmitRoutes = Router();

const dialogueSchema = z.object({
  lessonId: z.string().min(1),
  title: z.string().min(1),
  sceneText: z.string().min(1),
  audioUrl: z.string().optional().nullable(),
  questionText: z.string().min(1),
  optionA: z.string().min(1),
  optionB: z.string().min(1),
  optionC: z.string().min(1),
  optionD: z.string().min(1),
  correctOption: z.enum(["A", "B", "C", "D"]),
  orderIndex: z.number().int().optional()
});

async function assertChild(userId: string, role: string, childId?: string | null) {
  if (!childId) return;
  const child = await prisma.childProfile.findUnique({ where: { id: childId } });
  if (!child || (role !== "ADMIN" && child.userId !== userId)) throw new AppError(403, "Hồ sơ trẻ không hợp lệ");
}

dialoguesRoutes.use(requireAuth, requireAdmin);
dialoguesRoutes.get("/", asyncHandler(async (_req, res) => ok(res, await prisma.dialogue.findMany({ include: { lesson: true }, orderBy: { orderIndex: "asc" } }))));
dialoguesRoutes.post("/", asyncHandler(async (req, res) => ok(res, await prisma.dialogue.create({ data: dialogueSchema.parse(req.body) }), "Đã tạo hội thoại")));
dialoguesRoutes.put("/:id", asyncHandler(async (req, res) => ok(res, await prisma.dialogue.update({ where: { id: req.params.id }, data: dialogueSchema.partial().parse(req.body) }), "Đã cập nhật hội thoại")));
dialoguesRoutes.delete("/:id", asyncHandler(async (req, res) => {
  await prisma.dialogue.delete({ where: { id: req.params.id } });
  return ok(res, true, "Đã xóa hội thoại");
}));

dialogueSubmitRoutes.post("/:id/submit-dialogue", requireAuth, asyncHandler(async (req, res) => {
  const body = z.object({
    childId: z.string().optional().nullable(),
    dialogueAnswers: z.array(z.object({ dialogueId: z.string(), selectedOption: z.enum(["A", "B", "C", "D"]) }))
  }).parse(req.body);
  await assertChild(req.user!.id, req.user!.role, body.childId);

  const dialogues = await prisma.dialogue.findMany({ where: { lessonId: req.params.id } });
  const answerMap = new Map(body.dialogueAnswers.map((a) => [a.dialogueId, a.selectedOption]));
  const results = dialogues.map((d) => ({
    dialogueId: d.id,
    selectedOption: answerMap.get(d.id) || null,
    correctOption: d.correctOption,
    isCorrect: answerMap.get(d.id) === d.correctOption
  }));
  const correctAnswers = results.filter((r) => r.isCorrect).length;
  const score = dialogues.length ? Math.round((correctAnswers / dialogues.length) * 100) : 0;
  const existing = await prisma.userProgress.findFirst({ where: { userId: req.user!.id, childId: body.childId || null, lessonId: req.params.id } });
  const data = { status: "COMPLETED" as const, score, totalQuestions: dialogues.length, correctAnswers, completedAt: new Date() };
  const progress = existing
    ? await prisma.userProgress.update({ where: { id: existing.id }, data })
    : await prisma.userProgress.create({ data: { ...data, userId: req.user!.id, childId: body.childId || null, lessonId: req.params.id } });

  await awardActivity(req.user!.id, body.childId, 10 + correctAnswers * 2, "Hoàn thành hội thoại");
  return ok(res, { score, totalQuestions: dialogues.length, correctAnswers, results, progress }, "Đã nộp bài hội thoại");
}));
