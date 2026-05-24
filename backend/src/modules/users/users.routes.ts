import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireAdmin } from "../../middlewares/role.middleware";
import { prisma } from "../../prisma/prisma.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError, ok } from "../../utils/response";

export const usersRoutes = Router();
usersRoutes.use(requireAuth, requireAdmin);

const userUpdateSchema = z.object({
  fullName: z.string().min(2).optional(),
  role: z.enum(["PARENT", "ADMIN"]).optional(),
  isActive: z.boolean().optional()
});

usersRoutes.get("/", asyncHandler(async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true }
  });
  return ok(res, users);
}));

usersRoutes.put("/:id", asyncHandler(async (req, res) => {
  const data = userUpdateSchema.parse(req.body);
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data,
    select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true }
  });
  return ok(res, user, "Đã cập nhật người dùng");
}));

usersRoutes.delete("/:id", asyncHandler(async (req, res) => {
  if (req.user?.id === req.params.id) throw new AppError(400, "Không thể xóa quản trị viên đang đăng nhập");
  await prisma.user.delete({ where: { id: req.params.id } });
  return ok(res, true, "Đã xóa người dùng");
}));
