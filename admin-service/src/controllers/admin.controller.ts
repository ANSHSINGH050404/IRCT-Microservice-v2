import type { Request, Response } from "express";
import { prisma } from "../utils/prisma";

export async function getAdmins(_req: Request, res: Response) {
  const admins = await prisma.admin.findMany();
  res.json(admins);
}

export async function getAdmin(req: Request, res: Response) {
  const id = req.params.id as string;
  const admin = await prisma.admin.findUnique({ where: { id } });
  if (!admin) {
    res.status(404).json({ message: "Admin not found" });
    return;
  }
  res.json(admin);
}
