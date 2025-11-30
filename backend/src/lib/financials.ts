import { Cost, Vehicle } from "../generated/prisma";

export function computeTotals(vehicle: Vehicle, costs: Cost[]) {
  const variableCosts = costs.reduce((acc, c) => acc + c.amount, 0);
  const totalCost = vehicle.purchasePrice + variableCosts;
  const margin = vehicle.salePrice != null ? vehicle.salePrice - totalCost : null;
  return { totalCost, margin, variableCosts };
}
