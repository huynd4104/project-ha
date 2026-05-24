import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middlewares/auth.middleware";
import { prisma } from "../../prisma/prisma.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError, ok } from "../../utils/response";

export const childrenRoutes = Router();
childrenRoutes.use(requireAuth);

const childSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().min(2).max(6),
  gender: z.string().optional().nullable(),
  note: z.string().optional().nullable()
});

async function assertChildAccess(userId: string, role: string, childId: string) {
  const child = await prisma.childProfile.findUnique({ where: { id: childId } });
  if (!child) throw new AppError(404, "Không tìm thấy hồ sơ trẻ");
  if (role !== "ADMIN" && child.userId !== userId) throw new AppError(403, "Không có quyền truy cập");
  return child;
}

childrenRoutes.get("/", asyncHandler(async (req, res) => {
  const where = req.user?.role === "ADMIN" ? {} : { userId: req.user!.id };
  const children = await prisma.childProfile.findMany({ where, include: { user: { select: { id: true, email: true, fullName: true } } } });
  return ok(res, children);
}));

childrenRoutes.post("/", asyncHandler(async (req, res) => {
  const data = childSchema.parse(req.body);
  const child = await prisma.childProfile.create({ data: { ...data, userId: req.user!.id } });
  return ok(res, child, "Đã tạo hồ sơ trẻ");
}));

childrenRoutes.get("/:id", asyncHandler(async (req, res) => {
  const child = await assertChildAccess(req.user!.id, req.user!.role, req.params.id);
  return ok(res, child);
}));

childrenRoutes.put("/:id", asyncHandler(async (req, res) => {
  await assertChildAccess(req.user!.id, req.user!.role, req.params.id);
  const child = await prisma.childProfile.update({ where: { id: req.params.id }, data: childSchema.partial().parse(req.body) });
  return ok(res, child, "Đã cập nhật hồ sơ trẻ");
}));

childrenRoutes.delete("/:id", asyncHandler(async (req, res) => {
  await assertChildAccess(req.user!.id, req.user!.role, req.params.id);
  await prisma.childProfile.delete({ where: { id: req.params.id } });
  return ok(res, true, "Đã xóa hồ sơ trẻ");
}));
