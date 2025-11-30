import { Router } from "express";
import { authRouter } from "./auth";
import { vehiclesRouter } from "./vehicles";
import { costsRouter } from "./costs";
import { dashboardRouter } from "./dashboard";
import { meRouter } from "./me";
import { photosRouter } from "./photos";
import { exportRouter } from "./export";

export const router = Router();

router.get("/status", (_req, res) => {
  res.json({ message: "SaaS auto API up" });
});

router.use("/auth", authRouter);
router.use("/vehicles", vehiclesRouter);
router.use("/vehicles/:vehicleId/costs", costsRouter);
router.use("/vehicles/:vehicleId/photos", photosRouter);
router.use("/dashboard", dashboardRouter);
router.use("/me", meRouter);
router.use("/export", exportRouter);
