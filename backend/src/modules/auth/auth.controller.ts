import { Request, Response } from "express";
import { ok } from "../../utils/response";
import * as service from "./auth.service";

export async function register(req: Request, res: Response) {
  ok(res, await service.register(req.body), "Đăng ký thành công");
}

export async function login(req: Request, res: Response) {
  ok(res, await service.login(req.body), "Đăng nhập thành công");
}

export async function me(req: Request, res: Response) {
  ok(res, req.user);
}
