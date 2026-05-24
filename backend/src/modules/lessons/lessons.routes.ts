import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireAdmin } from "../../middlewares/role.middleware";
import { prisma } from "../../prisma/prisma.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";

export const lessonsRoutes = Router();
const lessonSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(["MATH", "DIALOGUE", "FLASHCARD", "THINKING", "SPELLING", "RHYME"]),
  orderIndex: z.number().int().optional(),
  npcId: z.string().optional().nullable(),
  isActive: z.boolean().optional()
});

lessonsRoutes.get("/", requireAuth, asyncHandler(async (_req, res) => {
  const lessons = await prisma.lesson.findMany({
    where: { isActive: true },
    include: { npc: true, progress: true, _count: { select: { mathQuestions: true, dialogues: true, flashcards: true } } },
    orderBy: { orderIndex: "asc" }
  });
  return ok(res, lessons);
}));

lessonsRoutes.get("/:id", requireAuth, asyncHandler(async (req, res) => {
  const lesson = await prisma.lesson.findUnique({ where: { id: req.params.id }, include: { npc: true, mathQuestions: true, dialogues: true, flashcards: true } });
  return ok(res, lesson);
}));

lessonsRoutes.get("/:id/questions", requireAuth, asyncHandler(async (req, res) => ok(res, await prisma.mathQuestion.findMany({ where: { lessonId: req.params.id }, orderBy: { orderIndex: "asc" } }))));
lessonsRoutes.get("/:id/dialogues", requireAuth, asyncHandler(async (req, res) => ok(res, await prisma.dialogue.findMany({ where: { lessonId: req.params.id }, orderBy: { orderIndex: "asc" } }))));
lessonsRoutes.get("/:id/flashcards", requireAuth, asyncHandler(async (req, res) => ok(res, await prisma.flashcard.findMany({ where: { lessonId: req.params.id }, orderBy: { orderIndex: "asc" } }))));

lessonsRoutes.post("/", requireAuth, requireAdmin, asyncHandler(async (req, res) => ok(res, await prisma.lesson.create({ data: lessonSchema.parse(req.body) }), "Đã tạo bài học")));
lessonsRoutes.put("/:id", requireAuth, requireAdmin, asyncHandler(async (req, res) => ok(res, await prisma.lesson.update({ where: { id: req.params.id }, data: lessonSchema.partial().parse(req.body) }), "Đã cập nhật bài học")));
lessonsRoutes.delete("/:id", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  await prisma.lesson.delete({ where: { id: req.params.id } });
  return ok(res, true, "Đã xóa bài học");
}));
