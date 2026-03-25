import path from "path";
import fs from "fs";
import app from "./app";

// Determine uploads directory without relying on import.meta.url (breaks in CJS bundles).
// Check both possible cwd() locations: running from api-server dir or from project root.
const _uploadsCandidate = [
  path.join(process.cwd(), "uploads"),
  path.join(process.cwd(), "artifacts", "api-server", "uploads"),
].find((d) => fs.existsSync(d));

const _uploadsDir = _uploadsCandidate ?? path.join(process.cwd(), "uploads");
if (!fs.existsSync(_uploadsDir)) fs.mkdirSync(_uploadsDir, { recursive: true });
process.env.UPLOADS_DIR = _uploadsDir;

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
