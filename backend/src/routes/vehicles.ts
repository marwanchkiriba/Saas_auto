import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/client";
import { AuthRequest, requireAuth } from "../middleware/auth";
import { Prisma } from "../generated/prisma";
import { computeTotals } from "../lib/financials";

const router = Router();

const statusEnum = ["stock", "preparation", "sold"] as const;

const vehicleBodySchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1),
  purchasePrice: z.coerce.number().int().nonnegative(),
  salePrice: z.coerce.number().int().nonnegative().optional(),
  mileage: z.coerce.number().int().nonnegative(),
  status: z.enum(statusEnum).default("stock"),
  mainPhotoUrl: z.string().url().optional(),
});

const querySchema = z.object({
  status: z.enum(statusEnum).optional(),
  make: z.string().optional(),
});

router.use(requireAuth);

router.get("/", async (req: AuthRequest, res) => {
  const parsedQuery = querySchema.safeParse(req.query);
  if (!parsedQuery.success) {
    return res.status(400).json({ error: parsedQuery.error.flatten() });
  }
  const filters = parsedQuery.data;

  const where: Prisma.VehicleWhereInput = {
    merchantId: req.user!.id,
  };
  if (filters.status) where.status = filters.status;
  if (filters.make) where.make = { contains: filters.make };

  const vehicles = await prisma.vehicle.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { costs: true },
  });
  const data = vehicles.map((v) => {
    const totals = computeTotals(v, v.costs);
    return { ...v, totalCost: totals.totalCost, margin: totals.margin };
  });
  res.json({ vehicles: data });
});

router.get("/:id", async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  const vehicle = await prisma.vehicle.findFirst({
    where: { id, merchantId: req.user!.id },
    include: { costs: true, photos: true },
  });
  if (!vehicle) return res.status(404).json({ error: "Not found" });
  const totals = computeTotals(vehicle, vehicle.costs);
  res.json({ vehicle: { ...vehicle, totalCost: totals.totalCost, margin: totals.margin } });
});

router.post("/", async (req: AuthRequest, res) => {
  const parsed = vehicleBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { salePrice, mainPhotoUrl, ...rest } = parsed.data;
  const vehicle = await prisma.vehicle.create({
    data: {
      merchantId: req.user!.id,
      ...rest,
      salePrice: salePrice ?? null,
      mainPhotoUrl: mainPhotoUrl ?? null,
    },
  });
  res.status(201).json({ vehicle });
});

router.put("/:id", async (req: AuthRequest, res) => {
  const parsed = vehicleBodySchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const id = req.params.id as string;
  const existing = await prisma.vehicle.findFirst({
    where: { id, merchantId: req.user!.id },
  });
  if (!existing) return res.status(404).json({ error: "Not found" });

  const { salePrice, mainPhotoUrl, ...rest } = parsed.data;

  const data: Prisma.VehicleUpdateInput = {};
  if (rest.make !== undefined) data.make = rest.make;
  if (rest.model !== undefined) data.model = rest.model;
  if (rest.year !== undefined) data.year = rest.year;
  if (rest.purchasePrice !== undefined) data.purchasePrice = rest.purchasePrice;
  if (rest.mileage !== undefined) data.mileage = rest.mileage;
  if (rest.status !== undefined) data.status = rest.status;
  if (salePrice !== undefined) data.salePrice = salePrice;
  if (mainPhotoUrl !== undefined) data.mainPhotoUrl = mainPhotoUrl;

  const vehicle = await prisma.vehicle.update({
    where: { id: existing.id },
    data,
  });
  res.json({ vehicle });
});

router.delete("/:id", async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  const existing = await prisma.vehicle.findFirst({
    where: { id, merchantId: req.user!.id },
  });
  if (!existing) return res.status(404).json({ error: "Not found" });

  await prisma.vehicle.delete({ where: { id: existing.id } });
  res.status(204).send();
});

export { router as vehiclesRouter };
