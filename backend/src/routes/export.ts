import { Router } from "express";
import PDFDocument from "pdfkit";
import { prisma } from "../db/client";
import { AuthRequest, requireAuth } from "../middleware/auth";
import { computeTotals } from "../lib/financials";

const router = Router();

router.use(requireAuth);

router.get("/:id/pdf", async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  const vehicle = await prisma.vehicle.findFirst({
    where: { id, merchantId: req.user!.id },
    include: { costs: true, photos: true },
  });
  if (!vehicle) return res.status(404).json({ error: "Not found" });

  const totals = computeTotals(vehicle, vehicle.costs);

  const doc = new PDFDocument();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="vehicle-${vehicle.id}.pdf"`);
  doc.pipe(res);

  doc.fontSize(18).text("Fiche véhicule", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Marque/Modèle: ${vehicle.make} ${vehicle.model}`);
  doc.text(`Année: ${vehicle.year}`);
  doc.text(`Statut: ${vehicle.status}`);
  doc.text(`Kilométrage: ${vehicle.mileage} km`);
  doc.moveDown();

  doc.text(`Prix d'achat: ${formatMoney(vehicle.purchasePrice)}`);
  if (vehicle.salePrice != null) doc.text(`Prix de vente: ${formatMoney(vehicle.salePrice)}`);
  doc.text(`Coûts variables: ${formatMoney(totals.variableCosts)}`);
  doc.text(`Coût total: ${formatMoney(totals.totalCost)}`);
  doc.text(`Marge: ${totals.margin != null ? formatMoney(totals.margin) : "N/A"}`);
  doc.moveDown();

  doc.fontSize(14).text("Coûts", { underline: true });
  doc.moveDown(0.5);
  if (vehicle.costs.length === 0) {
    doc.text("Aucun coût enregistré.");
  } else {
    vehicle.costs.forEach((c) => {
      doc.text(`- ${c.label} (${c.category}) : ${formatMoney(c.amount)} le ${new Date(c.incurredAt).toLocaleDateString("fr-FR")}`);
    });
  }

  doc.moveDown();
  doc.fontSize(12).text("Photos principales :");
  vehicle.photos.slice(0, 3).forEach((p, idx) => {
    doc.text(`${idx + 1}. ${p.url}`);
  });

  doc.end();
});

function formatMoney(cents: number) {
  return `${(cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`;
}

export { router as exportRouter };
