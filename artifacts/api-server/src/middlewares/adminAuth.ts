import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const TOKEN_SECRET =
  process.env.ADMIN_TOKEN_SECRET ||
  process.env.ADMIN_PASSWORD + "_tk_secret_2026";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export function generateToken(): string {
  const payload = { admin: true, ts: Date.now(), exp: Date.now() + TOKEN_TTL_MS };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(data)
    .digest("base64url")
    .slice(0, 24);
  return `${data}.${sig}`;
}

export function verifyToken(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [data, sig] = parts;
  const expected = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(data)
    .digest("base64url")
    .slice(0, 24);
  if (sig !== expected) return false;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString());
    if (!payload.exp || Date.now() > payload.exp) return false;
    return true;
  } catch {
    return false;
  }
}

export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const queryToken = typeof req.query?.token === "string" ? req.query.token : undefined;

  let token: string | undefined;
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  } else if (queryToken) {
    token = queryToken;
  }

  if (!token || !verifyToken(token)) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  next();
}
