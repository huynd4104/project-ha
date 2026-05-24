import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware";
import * as controller from "./auth.controller";

export const authRoutes = Router();

authRoutes.post("/register", controller.register);
authRoutes.post("/login", controller.login);
authRoutes.get("/me", requireAuth, controller.me);
