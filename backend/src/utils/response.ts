import { Response } from "express";

export function ok(res: Response, data: unknown, message = "Thành công") {
  return res.json({ message, data });
}

export class AppError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
