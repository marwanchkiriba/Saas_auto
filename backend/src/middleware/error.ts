import { NextFunction, Request, Response } from "express";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found" });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  const status = typeof err === "object" && err !== null && "status" in (err as Record<string, unknown>)
    ? Number((err as Record<string, unknown>).status)
    : 500;
  res.status(status || 500).json({ error: "Internal server error" });
}
