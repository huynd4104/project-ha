import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import { requireAdmin } from "../../middlewares/role.middleware";
import { prisma } from "../../prisma/prisma.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/response";
import { summary } from "./progress.service";

export const progressRoutes = Router();
export const adminProgressRoutes = Router();

progressRoutes.use(requireAuth);
progressRoutes.get("/my", asyncHandler(async (req, res) => {
  const progress = await prisma.userProgress.findMany({
    where: { userId: req.user!.id },
    include: { lesson: true, child: true },
    orderBy: { updatedAt: "desc" }
  });
  return ok(res, progress);
}));

progressRoutes.get("/child/:childId", asyncHandler(async (req, res) => {
  const progress = await prisma.userProgress.findMany({
    where: { userId: req.user!.role === "ADMIN" ? undefined : req.user!.id, childId: req.params.childId },
    include: { lesson: true, child: true },
    orderBy: { updatedAt: "desc" }
  });
  return ok(res, progress);
}));

progressRoutes.get("/summary", asyncHandler(async (req, res) => ok(res, await summary(req.user!.id, req.query.childId as string | undefined))));

adminProgressRoutes.get("/", requireAuth, requireAdmin, asyncHandler(async (_req, res) => {
  const progress = await prisma.userProgress.findMany({
    include: { user: { select: { id: true, email: true, fullName: true } }, child: true, lesson: true },
    orderBy: { updatedAt: "desc" }
  });
  return ok(res, progress);
}));
