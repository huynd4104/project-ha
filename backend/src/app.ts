import cors from "cors";
import express from "express";
import { adminRoutes } from "./modules/admin/admin.routes";
import { authRoutes } from "./modules/auth/auth.routes";
import { childrenRoutes } from "./modules/children/children.routes";
import { dialogueSubmitRoutes, dialoguesRoutes } from "./modules/dialogues/dialogues.routes";
import { flashcardLearnRoutes, flashcardsRoutes } from "./modules/flashcards/flashcards.routes";
import { lessonsRoutes } from "./modules/lessons/lessons.routes";
import { mathRoutes, mathSubmitRoutes } from "./modules/math/math.routes";
import { npcsRoutes } from "./modules/npcs/npcs.routes";
import { adminProgressRoutes, progressRoutes } from "./modules/progress/progress.routes";
import { qrCodeAdminRoutes, qrRoutes } from "./modules/qr/qr.routes";
import { usersRoutes } from "./modules/users/users.routes";
import { env } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";

export const app = express();

app.use(cors({ origin: env.corsOrigin === "*" ? true : env.corsOrigin, credentials: true }));
app.use(express.json());

app.get("/", (_req, res) => res.json({ status: "running", message: "API backend Project HA đang hoạt động", healthCheck: "/health" }));
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/children", childrenRoutes);
app.use("/api/npcs", npcsRoutes);
app.use("/api/qr", qrRoutes);
app.use("/api/qr-codes", qrCodeAdminRoutes);
app.use("/api/lessons", lessonsRoutes);
app.use("/api/lessons", mathSubmitRoutes);
app.use("/api/lessons", dialogueSubmitRoutes);
app.use("/api/math-questions", mathRoutes);
app.use("/api/dialogues", dialoguesRoutes);
app.use("/api/flashcards", flashcardsRoutes);
app.use("/api/flashcards", flashcardLearnRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/admin/progress", adminProgressRoutes);
app.use("/api/admin", adminRoutes);

app.use(errorMiddleware);
