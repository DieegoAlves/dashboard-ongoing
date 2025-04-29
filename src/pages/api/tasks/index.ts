import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { Task as PrismaTask } from "@prisma/client";
type TaskWithStatus = PrismaTask & { status?: TaskStatus };

type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
const CANCELLED: TaskStatus = "CANCELLED";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case "GET":
      const { userId, month, year, quarter } = req.query;
      if (typeof userId !== "string") return res.status(400).end();

      // Filtro opcional por mês/ano ou trimestre/ano
      let dateFilter = {} as any;
      if (typeof quarter === "string") {
        const q = Number(quarter);
        const y = typeof year === "string" ? Number(year) : new Date().getFullYear();
        if (!isNaN(q) && q >= 1 && q <= 4 && !isNaN(y)) {
          const start = new Date(y, (q - 1) * 3, 1, 0, 0, 0, 0);
          const end = new Date(y, q * 3, 1, 0, 0, 0, 0); // primeiro dia do próximo trimestre
          dateFilter = { date: { gte: start, lt: end } };
        }
      } else if (typeof month === "string") {
        const m = Number(month);
        const y = typeof year === "string" ? Number(year) : new Date().getFullYear();
        if (!isNaN(m) && m >= 1 && m <= 12 && !isNaN(y)) {
          const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
          const end = new Date(y, m, 1, 0, 0, 0, 0); // first day of next month
          dateFilter = { date: { gte: start, lt: end } };
        }
      }

      const tasks = await prisma.task.findMany({
        where: { userId, ...dateFilter },
        orderBy: { date: "desc" },
      });
      return res.status(200).json(tasks);
    case "POST":
      const { uid, clickupLink, description, hoursSpent, date, status } = req.body as {
        uid: string;
        clickupLink?: string;
        description: string;
        hoursSpent: number;
        date?: string;
        status?: TaskStatus;
      };
      const task = await prisma.task.create({
        data: {
          userId: uid,
          clickupLink,
          description,
          hoursSpent,
          date: date ? new Date(date) : new Date(),
          // cast to any to satisfy Prisma enum type
          status: (status || "COMPLETED") as any,
        },
      });

      // Update user's accumulatedHours
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const spentThisMonth = await prisma.task.aggregate({
        _sum: { hoursSpent: true },
        where: {
          userId: uid,
          date: { gte: monthStart },
          status: { not: CANCELLED as any },
        },
      });
      const user = await prisma.user.findUnique({ where: { id: uid } });
      if (user) {
        const used = spentThisMonth._sum?.hoursSpent ?? 0;
        const diff = user.contractedHours - used;
        // If diff positive => leftover, negative => overage
        const accumulated = user.accumulatedHours + diff;
        await prisma.user.update({ where: { id: uid }, data: { accumulatedHours: accumulated } });
      }

      return res.status(201).json(task);
    case "PUT":
      const { id, newStatus, newHours } = req.body as {
        id: string;
        newStatus?: TaskStatus;
        newHours?: number; // optional hours update
      };
      
      if (!id) {
        return res.status(400).json({ error: "ID é obrigatório" });
      }
      
      try {
        // Obter a tarefa atual antes da atualização
        const currentTask: TaskWithStatus | null = await prisma.task.findUnique({ where: { id } });
        
        if (!currentTask) {
          return res.status(404).json({ error: "Tarefa não encontrada" });
        }
        
        // Montar objeto de atualização
        const updateData: any = {};
        if (typeof newStatus !== 'undefined') updateData.status = newStatus as any;
        if (typeof newHours === 'number') updateData.hoursSpent = newHours;

        const updatedTask: TaskWithStatus = await prisma.task.update({
          where: { id },
          data: updateData,
        });
        
        // Recalcular acumulado do usuário para o mês da tarefa
        const monthStart = new Date(updatedTask.date);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const spentThisMonth = await prisma.task.aggregate({
          _sum: { hoursSpent: true },
          where: {
            userId: updatedTask.userId,
            date: { gte: monthStart },
            status: { not: CANCELLED as any },
          },
        });

        const user = await prisma.user.findUnique({ where: { id: updatedTask.userId } });
        if (user) {
          const used = spentThisMonth._sum?.hoursSpent ?? 0;
          const diff = user.contractedHours - used;
          await prisma.user.update({ where: { id: user.id }, data: { accumulatedHours: user.accumulatedHours + diff } });
        }

        // Se alteração envolveu mudança de status de/para cancelado, já tratado pela recalc acima
        // portanto removemos lógica delta anterior

        return res.status(200).json(updatedTask);
      } catch (error) {
        console.error("Erro ao atualizar tarefa:", error);
        return res.status(500).json({ error: "Erro ao atualizar tarefa" });
      }
    case "DELETE":
      const delId = req.query.id as string;
      if (!delId) return res.status(400).json({ error: "ID é obrigatório" });

      try {
        const taskToDelete: TaskWithStatus | null = await prisma.task.findUnique({ where: { id: delId } });
        if (!taskToDelete) return res.status(404).json({ error: "Tarefa não encontrada" });

        await prisma.task.delete({ where: { id: delId } });

        // Recalcular acumulado do usuário para o mês atual
        const uid = taskToDelete.userId;
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const spentThisMonth = await prisma.task.aggregate({
          _sum: { hoursSpent: true },
          where: {
            userId: uid,
            date: { gte: monthStart },
            status: { not: CANCELLED as any },
          },
        });
        const user = await prisma.user.findUnique({ where: { id: uid } });
        if (user) {
          const used = spentThisMonth._sum?.hoursSpent ?? 0;
          const diff = user.contractedHours - used;
          const accumulated = user.accumulatedHours + diff;
          await prisma.user.update({ where: { id: uid }, data: { accumulatedHours: accumulated } });
        }

        // Se tarefa excluída não estava cancelada, devolver horas
        if (taskToDelete.status !== (CANCELLED as any)) {
          await prisma.user.update({ where: { id: uid }, data: { accumulatedHours: { increment: taskToDelete.hoursSpent } } });
        }

        return res.status(204).end();
      } catch (err) {
        console.error("Erro ao deletar tarefa", err);
        return res.status(500).json({ error: "Erro ao deletar tarefa" });
      }
    default:
      res.status(405).end();
  }
}
