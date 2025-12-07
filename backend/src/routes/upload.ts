import { Router } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { requireAuth } from "../middleware/auth";
import { env } from "../config/env";

const uploadsDir = path.join(process.cwd(), "uploads");
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({ storage });

export const uploadRouter = Router();

uploadRouter.use(requireAuth);

uploadRouter.post("/", upload.array("files", 10), (req, res) => {
  const files = (req.files as Express.Multer.File[]) || [];
  const baseUrl = `http://localhost:${env.PORT}`;
  const urls = files.map((f) => `${baseUrl}/uploads/${f.filename}`);
  res.json({ urls });
});
