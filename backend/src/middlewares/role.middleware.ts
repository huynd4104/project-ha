import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/response";

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== "ADMIN") {
    next(new AppError(403, "Chỉ quản trị viên được phép truy cập"));
    return;
  }
  next();
}
