import bcrypt from "bcrypt";
import { prisma } from "../utils/prisma";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/auth";
import { BadRequestError, UnauthorizedError } from "../utils/error";

export async function register(data: {
  email: string;
  password: string;
  name: string;
  role?: string;
}) {
  const existing = await prisma.admin.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new BadRequestError("Admin with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const admin = await prisma.admin.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: data.role ?? "admin",
    },
  });

  const { password: _, ...adminData } = admin;
  return adminData;
}

export async function login(email: string, password: string) {
  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) {
    throw new BadRequestError("Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, admin.password);
  if (!isPasswordValid) {
    throw new BadRequestError("Invalid email or password");
  }

  const accessToken = generateAccessToken(admin.id);
  const { token: refreshToken, jti } = generateRefreshToken(admin.id);

  const { password: _, ...adminData } = admin;

  return { accessToken, refreshToken, admin: adminData };
}

export async function refreshToken(oldRefreshToken: string) {
  const payload = verifyRefreshToken(oldRefreshToken);

  const admin = await prisma.admin.findUnique({ where: { id: payload.id } });
  if (!admin) {
    throw new UnauthorizedError("Admin not found");
  }

  const accessToken = generateAccessToken(admin.id);
  const { token: newRefreshToken } = generateRefreshToken(admin.id);

  return { accessToken, refreshToken: newRefreshToken };
}

export async function getProfile(adminId: string) {
  const admin = await prisma.admin.findUnique({ where: { id: adminId } });
  if (!admin) {
    throw new BadRequestError("Admin not found");
  }

  const { password: _, ...adminData } = admin;
  return adminData;
}
