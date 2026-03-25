import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import path from "path";
import fs from "fs";
import router from "./routes";
import { botRenderMiddleware } from "./middlewares/botRender";

const app: Express = express();

const allowedOrigins = [
  "https://razrabotka-agr.ru",
  "https://www.razrabotka-agr.ru",
  /\.razrabotka-agr\.ru$/,
  /\.replit\.dev$/,
  /\.replit\.app$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const ok = allowedOrigins.some(p =>
      typeof p === "string" ? p === origin : p.test(origin)
    );
    cb(ok ? null : new Error("Not allowed by CORS"), ok);
  },
  credentials: true,
}));

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.disable("x-powered-by");

// Gzip compression for all responses
app.use(compression({ level: 6, threshold: 1024 }));

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

app.use("/api", router);

if (process.env.NODE_ENV === "production") {
  const frontendDist = path.join(process.cwd(), "..", "ag-booklet", "dist", "public");
  if (fs.existsSync(frontendDist)) {
    app.use(botRenderMiddleware);

    // Hashed Vite assets — immutable, cache 1 year
    app.use("/assets", express.static(path.join(frontendDist, "assets"), {
      maxAge: "1y",
      immutable: true,
      etag: false,
    }));

    // Images & other static files — cache 7 days
    app.use(express.static(frontendDist, {
      maxAge: "7d",
      etag: true,
      index: false,
    }));

    // SPA fallback — no cache on index.html
    app.use((_req, res) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.sendFile(path.join(frontendDist, "index.html"));
    });
  }
}

export default app;
