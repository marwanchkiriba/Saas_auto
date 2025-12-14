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
    select: { id: true, purchasePrice: true, salePrice: true, status: true, updatedAt: true },
  });

  let totalCost = 0;
  let totalPotentialMargin = 0;

  // Données des véhicules vendus
  let totalRevenue = 0; // Chiffre d'affaires réel
  let totalRealMargin = 0; // Marge réelle
  let totalSoldCosts = 0; // Coûts des véhicules vendus

  for (const v of vehicles) {
    const variableCosts = costMap.get(v.id) ?? 0;
    const costTotal = v.purchasePrice + variableCosts;
    totalCost += costTotal;

    if (v.status === "sold" && v.salePrice != null) {
      // Véhicule vendu - marge réelle
      totalRevenue += v.salePrice;
      totalSoldCosts += costTotal;
      totalRealMargin += v.salePrice - costTotal;
    } else if (v.salePrice != null) {
      // Véhicule non vendu avec prix de vente - marge potentielle
      totalPotentialMargin += v.salePrice - costTotal;
    }
  }

  // Grouper les ventes par mois pour le graphique
  const soldVehicles = await prisma.vehicle.findMany({
    where: {
      merchantId: userId,
      status: "sold",
      salePrice: { not: null },
    },
    select: {
      id: true,
      purchasePrice: true,
      salePrice: true,
      updatedAt: true
    },
    orderBy: { updatedAt: "asc" },
  });

  // Calculer les données mensuelles
  const monthlyData: Record<string, { revenue: number; costs: number; margin: number }> = {};

  for (const v of soldVehicles) {
    const monthKey = v.updatedAt.toISOString().slice(0, 7); // YYYY-MM
    const variableCosts = costMap.get(v.id) ?? 0;
    const costTotal = v.purchasePrice + variableCosts;
    const revenue = v.salePrice ?? 0;
    const margin = revenue - costTotal;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { revenue: 0, costs: 0, margin: 0 };
    }
    monthlyData[monthKey].revenue += revenue;
    monthlyData[monthKey].costs += costTotal;
    monthlyData[monthKey].margin += margin;
  }

  // Convertir en tableau trié
  const salesHistory = Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      revenue: data.revenue,
      costs: data.costs,
      margin: data.margin,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  res.json({
    totalVehicles,
    statusBreakdown: statusCounts.map((s) => ({ status: s.status, count: s._count._all })),
    totals: {
      purchase: prices._sum.purchasePrice ?? 0,
      sale: prices._sum.salePrice ?? 0,
      cost: totalCost,
      potentialMargin: totalPotentialMargin,
    },
    // Nouvelles données des ventes réelles
    sales: {
      totalRevenue,
      totalCosts: totalSoldCosts,
      totalMargin: totalRealMargin,
      history: salesHistory,
    },
  });
});

export { router as dashboardRouter };

