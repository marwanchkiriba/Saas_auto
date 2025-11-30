import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/client";
import { AuthRequest, requireAuth } from "../middleware/auth";

const router = Router({ mergeParams: true });

const photoSchema = z.object({
  url: z.string().url(),
  position: z.coerce.number().int().nonnegative().default(0),
});

router.use(requireAuth);

async function assertVehicleOwnership(userId: string, vehicleId: string) {
  return prisma.vehicle.findFirst({ where: { id: vehicleId, merchantId: userId } });
}

router.get("/", async (req: AuthRequest, res) => {
  const vehicleId = req.params.vehicleId as string;
  const vehicle = await assertVehicleOwnership(req.user!.id, vehicleId);
  if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });

  const photos = await prisma.photo.findMany({
    where: { vehicleId },
    orderBy: { position: "asc" },
  });
  res.json({ photos });
});

router.post("/", async (req: AuthRequest, res) => {
  const vehicleId = req.params.vehicleId as string;
  const vehicle = await assertVehicleOwnership(req.user!.id, vehicleId);
  if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });

  const parsed = photoSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const photo = await prisma.photo.create({
    data: { vehicleId, ...parsed.data },
  });
  res.status(201).json({ photo });
});

router.delete("/:id", async (req: AuthRequest, res) => {
  const vehicleId = req.params.vehicleId as string;
  const vehicle = await assertVehicleOwnership(req.user!.id, vehicleId);
  if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });

  const existing = await prisma.photo.findFirst({
    where: { id: req.params.id as string, vehicleId },
  });
  if (!existing) return res.status(404).json({ error: "Photo not found" });

  await prisma.photo.delete({ where: { id: existing.id } });
  res.status(204).send();
});

export { router as photosRouter };
