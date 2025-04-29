import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { prisma } from "../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case "GET":
      const userId = req.query.userId as string | undefined;
      if (userId) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { tasks: true },
        });
        if (!user) {
          return res.status(404).end();
        }
        return res.status(200).json(user);
      } else {
        const users = await prisma.user.findMany({ include: { tasks: true } });
        return res.status(200).json(users);
      }
    case "POST":
      const { name, email, password, contractedHours } = req.body as {
        name: string;
        email: string;
        password: string;
        contractedHours: number;
      };
      const total = await prisma.user.count();
      const hashed = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashed,
          contractedHours,
          role: total === 0 ? "ADMIN" : "CLIENT",
        },
      });
      return res.status(201).json(user);
    case "PUT":
      const { id, update } = req.body as {
        id: string;
        update: {
          name?: string;
          email?: string;
          password?: string;
          contractedHours?: number;
          role?: string;
        };
      };
      if (!id) return res.status(400).end();
      if (update.password) {
        update.password = await bcrypt.hash(update.password, 10);
      }
      const updatedUser = await prisma.user.update({ where: { id }, data: update as any });
      return res.status(200).json(updatedUser);
    case "DELETE":
      const delId = req.query.userId as string;
      if (!delId) return res.status(400).end();
      // delete tasks first due to FK constraints
      await prisma.task.deleteMany({ where: { userId: delId } });
      await prisma.user.delete({ where: { id: delId } });
      return res.status(204).end();
    default:
      res.status(405).end();
  }
}
