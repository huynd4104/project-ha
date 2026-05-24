import { prisma } from "../../prisma/prisma.service";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export async function awardActivity(userId: string, childId: string | null | undefined, amount: number, reason: string) {
  await prisma.xPLog.create({ data: { userId, childId: childId || null, amount, reason } });

  const today = startOfDay(new Date());
  const streak = await prisma.streak.findFirst({ where: { userId, childId: childId || null } });
  if (!streak) {
    await prisma.streak.create({ data: { userId, childId: childId || null, currentStreak: 1, longestStreak: 1, lastActiveDate: today } });
    return;
  }

  const last = streak.lastActiveDate ? startOfDay(streak.lastActiveDate) : null;
  const diffDays = last ? Math.round((today.getTime() - last.getTime()) / 86400000) : 1;
  const currentStreak = diffDays === 0 ? streak.currentStreak : diffDays === 1 ? streak.currentStreak + 1 : 1;
  await prisma.streak.update({
    where: { id: streak.id },
    data: { currentStreak, longestStreak: Math.max(streak.longestStreak, currentStreak), lastActiveDate: today }
  });
}

export async function summary(userId: string, childId?: string | null) {
  const whereChild = childId ? { childId } : {};
  const [xp, streak, completedLessons, unlockedNpcs, history] = await Promise.all([
    prisma.xPLog.aggregate({ where: { userId, ...whereChild }, _sum: { amount: true } }),
    prisma.streak.findFirst({ where: { userId, ...whereChild }, orderBy: { updatedAt: "desc" } }),
    prisma.userProgress.count({ where: { userId, ...whereChild, status: "COMPLETED" } }),
    prisma.userUnlockedNpc.count({ where: { userId, ...whereChild } }),
    prisma.userProgress.findMany({ where: { userId, ...whereChild }, include: { lesson: true, child: true }, orderBy: { updatedAt: "desc" } })
  ]);

  return {
    xp: xp._sum.amount || 0,
    streak: streak || { currentStreak: 0, longestStreak: 0 },
    completedLessons,
    unlockedNpcs,
    history
  };
}
