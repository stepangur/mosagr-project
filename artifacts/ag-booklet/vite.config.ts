import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 3000;

const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig(async () => ({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
    {
      name: "non-blocking-css",
      transformIndexHtml(html) {
        // Convert blocking <link rel="stylesheet"> to preload + onload swap
        // so CSS doesn't hold up the first paint
        return html.replace(
          /<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+\.css)">/g,
          (_, href) =>
            `<link rel="preload" as="style" crossorigin href="${href}" onload="this.onload=null;this.rel='stylesheet'">` +
            `<noscript><link rel="stylesheet" crossorigin href="${href}"></noscript>`
        );
      },
    },
    {
      name: "cache-control-headers",
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url ?? "";

          // Determine the desired Cache-Control value
          let cacheValue: string;
          if (url.startsWith("/assets/")) {
            cacheValue = "public, max-age=31536000, immutable";
          } else if (
            url.startsWith("/images/") ||
            /\.(webp|jpg|jpeg|png|gif|svg|ico|woff2|woff)(\?.*)?$/.test(url)
          ) {
            cacheValue = "public, max-age=604800";
          } else {
            cacheValue = "no-cache, no-store, must-revalidate";
          }

          // Override writeHead so our header wins even when Vite inlines headers
          const origWriteHead = res.writeHead.bind(res) as typeof res.writeHead;
          // @ts-expect-error overriding for header injection
          res.writeHead = function (statusCode: number, ...rest: unknown[]) {
            // Vite may pass headers as last argument – patch them in place
            const last = rest[rest.length - 1];
            if (last && typeof last === "object" && !Array.isArray(last)) {
              (last as Record<string, string>)["Cache-Control"] = cacheValue;
            } else {
              res.setHeader("Cache-Control", cacheValue);
            }
            return (origWriteHead as Function)(statusCode, ...rest);
          };

          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
}));
