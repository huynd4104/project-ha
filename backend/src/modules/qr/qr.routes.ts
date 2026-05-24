import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireAdmin } from "../../middlewares/role.middleware";
import { prisma } from "../../prisma/prisma.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError, ok } from "../../utils/response";

export const qrRoutes = Router();
export const qrCodeAdminRoutes = Router();

const qrSchema = z.object({
  code: z.string().min(3),
  npcId: z.string().min(1),
  label: z.string().min(1),
  isActive: z.boolean().optional(),
  maxUses: z.number().int().positive().optional().nullable()
});

qrRoutes.post("/unlock", requireAuth, asyncHandler(async (req, res) => {
  const body = z.object({ code: z.string().min(1), childId: z.string().optional().nullable() }).parse(req.body);
  if (body.childId) {
    const child = await prisma.childProfile.findUnique({ where: { id: body.childId } });
    if (!child || (req.user!.role !== "ADMIN" && child.userId !== req.user!.id)) throw new AppError(403, "Hồ sơ trẻ không hợp lệ");
  }

  const qr = await prisma.qRCode.findUnique({ where: { code: body.code }, include: { npc: true } });
  if (!qr || !qr.isActive || !qr.npc.isActive) throw new AppError(404, "Mã QR không hợp lệ");
  if (qr.maxUses !== null && qr.usedCount >= qr.maxUses) throw new AppError(400, "Mã QR đã đạt số lượt dùng tối đa");

  const existing = await prisma.userUnlockedNpc.findUnique({ where: { userId_npcId: { userId: req.user!.id, npcId: qr.npcId } }, include: { npc: true } });
  await prisma.qRCode.update({ where: { id: qr.id }, data: { usedCount: { increment: 1 } } });

  if (existing) return ok(res, { npc: existing.npc, alreadyUnlocked: true }, "NPC đã có trong bộ sưu tập");

  const unlocked = await prisma.userUnlockedNpc.create({
    data: { userId: req.user!.id, childId: body.childId || null, npcId: qr.npcId, qrCodeId: qr.id },
    include: { npc: true }
  });
  return ok(res, { npc: unlocked.npc, alreadyUnlocked: false }, "Đã mở khóa NPC");
}));

qrCodeAdminRoutes.use(requireAuth, requireAdmin);
qrCodeAdminRoutes.get("/", asyncHandler(async (_req, res) => {
  const codes = await prisma.qRCode.findMany({ include: { npc: true }, orderBy: { createdAt: "desc" } });
  return ok(res, codes);
}));
qrCodeAdminRoutes.post("/", asyncHandler(async (req, res) => ok(res, await prisma.qRCode.create({ data: qrSchema.parse(req.body), include: { npc: true } }), "Đã tạo mã QR")));
qrCodeAdminRoutes.put("/:id", asyncHandler(async (req, res) => ok(res, await prisma.qRCode.update({ where: { id: req.params.id }, data: qrSchema.partial().parse(req.body), include: { npc: true } }), "Đã cập nhật mã QR")));
qrCodeAdminRoutes.delete("/:id", asyncHandler(async (req, res) => {
  await prisma.qRCode.delete({ where: { id: req.params.id } });
  return ok(res, true, "Đã xóa mã QR");
}));
