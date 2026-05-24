import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireAdmin } from "../../middlewares/role.middleware";
import { prisma } from "../../prisma/prisma.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";
import { awardActivity } from "../progress/progress.service";

export const flashcardsRoutes = Router();
export const flashcardLearnRoutes = Router();

const flashcardSchema = z.object({
  lessonId: z.string().min(1),
  frontText: z.string().min(1),
  backText: z.string().min(1),
  imageUrl: z.string().optional().nullable(),
  audioUrl: z.string().optional().nullable(),
  orderIndex: z.number().int().optional()
});

flashcardsRoutes.use(requireAuth, requireAdmin);
flashcardsRoutes.get("/", asyncHandler(async (_req, res) => ok(res, await prisma.flashcard.findMany({ include: { lesson: true }, orderBy: { orderIndex: "asc" } }))));
flashcardsRoutes.post("/", asyncHandler(async (req, res) => ok(res, await prisma.flashcard.create({ data: flashcardSchema.parse(req.body) }), "Đã tạo thẻ học")));
flashcardsRoutes.put("/:id", asyncHandler(async (req, res) => ok(res, await prisma.flashcard.update({ where: { id: req.params.id }, data: flashcardSchema.partial().parse(req.body) }), "Đã cập nhật thẻ học")));
flashcardsRoutes.delete("/:id", asyncHandler(async (req, res) => {
  await prisma.flashcard.delete({ where: { id: req.params.id } });
  return ok(res, true, "Đã xóa thẻ học");
}));

flashcardLearnRoutes.post("/:id/mark-learned", requireAuth, asyncHandler(async (req, res) => {
  const body = z.object({ childId: z.string().optional().nullable() }).parse(req.body);
  await awardActivity(req.user!.id, body.childId, 2, "Học thẻ học");
  return ok(res, true, "Đã đánh dấu thẻ học là đã thuộc");
}));
