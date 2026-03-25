import { Router, type IRouter } from "express";
import express from "express";
import path from "path";
import fs from "fs";
import healthRouter from "./health";
import ordersRouter from "./orders";
import contactsRouter from "./contacts";
import adminRouter from "./admin";
import publicRouter from "./public";
import aiNewsRouter from "./aiNews";
import dadataRouter from "./dadata";

// Find uploads dir — works from both project root (prod) and artifacts/api-server/ (dev)
const _uploadsDir = (
  [
    path.join(process.cwd(), "uploads"),
    path.join(process.cwd(), "artifacts", "api-server", "uploads"),
  ].find((d) => fs.existsSync(d)) ?? path.join(process.cwd(), "uploads")
);

const router: IRouter = Router();

router.use(healthRouter);
router.use(ordersRouter);
router.use(contactsRouter);
router.use("/admin", adminRouter);
router.use("/admin/ai", aiNewsRouter);
router.use("/public", publicRouter);
router.use("/uploads", express.static(_uploadsDir));
router.use(dadataRouter);

export default router;
