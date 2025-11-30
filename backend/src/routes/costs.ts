import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/client";
import { AuthRequest, requireAuth } from "../middleware/auth";
import { Prisma } from "../generated/prisma";

const router = Router({ mergeParams: true });

const costSchema = z.object({
  label: z.string().min(1),
  amount: z.coerce.number().int().nonnegative(),
  category: z.string().min(1),
  incurredAt: z.coerce.date(),
});

router.use(requireAuth);

async function assertVehicleOwnership(userId: string, vehicleId: string) {
  return prisma.vehicle.findFirst({ where: { id: vehicleId, merchantId: userId } });
}

router.get("/", async (req: AuthRequest, res) => {
  const vehicleId = req.params.vehicleId as string;
  const vehicle = await assertVehicleOwnership(req.user!.id, vehicleId);
  if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });

  const costs = await prisma.cost.findMany({
    where: { vehicleId },
    orderBy: { incurredAt: "desc" },
  });
  res.json({ costs });
});

router.post("/", async (req: AuthRequest, res) => {
  const vehicleId = req.params.vehicleId as string;
  const vehicle = await assertVehicleOwnership(req.user!.id, vehicleId);
  if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });

  const parsed = costSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const cost = await prisma.cost.create({
    data: { vehicleId, ...parsed.data },
  });
  res.status(201).json({ cost });
});

router.put("/:id", async (req: AuthRequest, res) => {
  const vehicleId = req.params.vehicleId as string;
  const vehicle = await assertVehicleOwnership(req.user!.id, vehicleId);
  if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });

  const parsed = costSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const existing = await prisma.cost.findFirst({
    where: { id: req.params.id as string, vehicleId },
  });
  if (!existing) return res.status(404).json({ error: "Cost not found" });

  const data: Prisma.CostUpdateInput = {};
  if (parsed.data.label !== undefined) data.label = parsed.data.label;
  if (parsed.data.amount !== undefined) data.amount = parsed.data.amount;
  if (parsed.data.category !== undefined) data.category = parsed.data.category;
  if (parsed.data.incurredAt !== undefined) data.incurredAt = parsed.data.incurredAt;

  const cost = await prisma.cost.update({
    where: { id: existing.id },
    data,
  });
  res.json({ cost });
});

router.delete("/:id", async (req: AuthRequest, res) => {
  const vehicleId = req.params.vehicleId as string;
  const vehicle = await assertVehicleOwnership(req.user!.id, vehicleId);
  if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });

  const existing = await prisma.cost.findFirst({
    where: { id: req.params.id as string, vehicleId },
  });
  if (!existing) return res.status(404).json({ error: "Cost not found" });

  await prisma.cost.delete({ where: { id: existing.id } });
  res.status(204).send();
});

export { router as costsRouter };
