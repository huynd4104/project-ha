import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireAdmin } from "../../middlewares/role.middleware";
import { prisma } from "../../prisma/prisma.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";

export const adminRoutes = Router();
adminRoutes.use(requireAuth, requireAdmin);

adminRoutes.get("/dashboard", asyncHandler(async (_req, res) => {
  const [totalUsers, totalChildren, totalNPCs, totalQRCodes, totalLessons, totalCompletedLessons, recentUsers, popularLessons, popularNPCs] = await Promise.all([
    prisma.user.count(),
    prisma.childProfile.count(),
    prisma.nPC.count(),
    prisma.qRCode.count(),
    prisma.lesson.count(),
    prisma.userProgress.count({ where: { status: "COMPLETED" } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, email: true, fullName: true, role: true, createdAt: true } }),
    prisma.userProgress.groupBy({ by: ["lessonId"], _count: { lessonId: true }, orderBy: { _count: { lessonId: "desc" } }, take: 5 }),
    prisma.userUnlockedNpc.groupBy({ by: ["npcId"], _count: { npcId: true }, orderBy: { _count: { npcId: "desc" } }, take: 5 })
  ]);

  return ok(res, {
    totalUsers,
    totalChildren,
    totalNPCs,
    totalQRCodes,
    totalLessons,
    totalCompletedLessons,
    recentUsers,
    popularLessons,
    popularNPCs
  });
}));
