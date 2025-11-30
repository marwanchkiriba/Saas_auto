import { Router } from "express";
import { prisma } from "../db/client";
import { AuthRequest, requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const period = req.query.period as "day" | "week" | "month" | undefined;

  let dateFilter: Date | undefined;
  if (period === "day") {
    dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - 1);
  } else if (period === "week") {
    dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - 7);
  } else if (period === "month") {
    dateFilter = new Date();
    dateFilter.setMonth(dateFilter.getMonth() - 1);
  }

  const statusCounts = await prisma.vehicle.groupBy({
    by: ["status"],
    where: {
      merchantId: userId,
      ...(dateFilter ? { createdAt: { gte: dateFilter } } : {}),
    },
    _count: { _all: true },
  });
  const totalVehicles = statusCounts.reduce((acc, curr) => acc + curr._count._all, 0);

  // Valeur parc : uniquement véhicules non vendus (optionnellement filtrés par période)
  const activeWhere = {
    merchantId: userId,
    status: { not: "sold" as const },
    ...(dateFilter ? { createdAt: { gte: dateFilter } } : {}),
  };
  const prices = await prisma.vehicle.aggregate({
    where: activeWhere,
    _sum: { purchasePrice: true, salePrice: true },
  });

  const costsByVehicle = await prisma.cost.groupBy({
    by: ["vehicleId"],
    where: {
      vehicle: {
        merchantId: userId,
        ...(dateFilter ? { createdAt: { gte: dateFilter } } : {}),
      },
    },
    _sum: { amount: true },
  });
  const costMap = new Map(costsByVehicle.map((c) => [c.vehicleId, c._sum.amount ?? 0]));

  const vehicles = await prisma.vehicle.findMany({
    where: {
      merchantId: userId,
      ...(dateFilter ? { createdAt: { gte: dateFilter } } : {}),
    },
    select: { id: true, purchasePrice: true, salePrice: true },
  });

  let totalCost = 0;
  let totalPotentialMargin = 0;

  for (const v of vehicles) {
    const variableCosts = costMap.get(v.id) ?? 0;
    const costTotal = v.purchasePrice + variableCosts;
    totalCost += costTotal;
    if (v.salePrice != null) {
      totalPotentialMargin += v.salePrice - costTotal;
    }
  }

  res.json({
    totalVehicles,
    statusBreakdown: statusCounts.map((s) => ({ status: s.status, count: s._count._all })),
    totals: {
      purchase: prices._sum.purchasePrice ?? 0,
      sale: prices._sum.salePrice ?? 0,
      cost: totalCost,
      potentialMargin: totalPotentialMargin,
    },
  });
});

export { router as dashboardRouter };
