import cors from "cors";
import express from "express";
import morgan from "morgan";
import { router } from "./routes";
import { errorHandler, notFound } from "./middleware/error";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(morgan("dev"));
  app.use("/uploads", express.static("uploads"));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api", router);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
