import { prisma } from "../utils/prisma";

export async function findAllAdmins() {
  return prisma.admin.findMany();
}

export async function findAdminById(id: string) {
  return prisma.admin.findUnique({ where: { id } });
}
