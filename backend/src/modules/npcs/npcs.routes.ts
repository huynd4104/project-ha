import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireAdmin } from "../../middlewares/role.middleware";
import { prisma } from "../../prisma/prisma.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";

export const npcsRoutes = Router();
const npcSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  imageUrl: z.string().min(1),
  animationUrl: z.string().optional().nullable(),
  defaultDialogue: z.string().min(1),
  isActive: z.boolean().optional()
});

npcsRoutes.get("/", requireAuth, asyncHandler(async (_req, res) => {
  const npcs = await prisma.nPC.findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" } });
  return ok(res, npcs);
}));

npcsRoutes.get("/my-collection", requireAuth, asyncHandler(async (req, res) => {
  const items = await prisma.userUnlockedNpc.findMany({
    where: { userId: req.user!.id },
    include: { npc: true, child: true },
    orderBy: { unlockedAt: "desc" }
  });
  return ok(res, items);
}));

npcsRoutes.post("/", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const npc = await prisma.nPC.create({ data: npcSchema.parse(req.body) });
  return ok(res, npc, "Đã tạo NPC");
}));

npcsRoutes.put("/:id", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const npc = await prisma.nPC.update({ where: { id: req.params.id }, data: npcSchema.partial().parse(req.body) });
  return ok(res, npc, "Đã cập nhật NPC");
}));

npcsRoutes.delete("/:id", requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  await prisma.nPC.delete({ where: { id: req.params.id } });
  return ok(res, true, "Đã xóa NPC");
}));
