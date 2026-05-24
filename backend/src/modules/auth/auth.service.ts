import { z } from "zod";
import { prisma } from "../../prisma/prisma.service";
import { signToken } from "../../utils/jwt";
import { comparePassword, hashPassword } from "../../utils/password";
import { AppError } from "../../utils/response";

export const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

function publicUser(user: { id: string; email: string; fullName: string; role: string; isActive: boolean }) {
  return user;
}

export async function register(input: z.infer<typeof registerSchema>) {
  const data = registerSchema.parse(input);
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError(409, "Email đã tồn tại");

  const user = await prisma.user.create({
    data: {
      email: data.email,
      fullName: data.fullName,
      passwordHash: await hashPassword(data.password),
      role: "PARENT"
    },
    select: { id: true, email: true, fullName: true, role: true, isActive: true }
  });

  return { token: signToken({ userId: user.id, role: user.role }), user: publicUser(user) };
}

export async function login(input: z.infer<typeof loginSchema>) {
  const data = loginSchema.parse(input);
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user || !user.isActive) throw new AppError(401, "Email hoặc mật khẩu không đúng");

  const matched = await comparePassword(data.password, user.passwordHash);
  if (!matched) throw new AppError(401, "Email hoặc mật khẩu không đúng");

  const safe = { id: user.id, email: user.email, fullName: user.fullName, role: user.role, isActive: user.isActive };
  return { token: signToken({ userId: user.id, role: user.role }), user: publicUser(safe) };
}
