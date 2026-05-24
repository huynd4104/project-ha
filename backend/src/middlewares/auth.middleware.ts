import { NextFunction, Request, Response } from "express";
import { prisma } from "../prisma/prisma.service";
import { verifyToken } from "../utils/jwt";
import { AppError } from "../utils/response";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        fullName: string;
      role: string;
      };
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) throw new AppError(401, "Thiếu token");

    const payload = verifyToken(header.slice(7));
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, fullName: true, role: true, isActive: true }
    });

    if (!user || !user.isActive) throw new AppError(401, "Tài khoản không hợp lệ");
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
