import { Router, type IRouter } from "express";
import multer from "multer";
import OpenAI from "openai";
import { spawnSync } from "child_process";
import { writeFileSync, unlinkSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { randomBytes } from "crypto";
import { adminAuth } from "../middlewares/adminAuth";

// Same uploads dir resolution as admin.ts
const uploadsDir = (
  [
    join(process.cwd(), "uploads"),
    join(process.cwd(), "artifacts", "api-server", "uploads"),
  ].find((d) => existsSync(d)) ?? join(process.cwd(), "uploads")
);
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

const router: IRouter = Router();

// Lazy-load pdf-parse using dynamic import() — works in both ESM (tsx dev)
// and bundled CJS (esbuild production), avoiding the createRequire/import.meta.url issue.
type PdfParseFunc = (buf: Buffer) => Promise<{ text: string }>;
let _cachedPdfParse: PdfParseFunc | null | undefined = undefined;

async function getPdfParse(): Promise<PdfParseFunc | null> {
  if (_cachedPdfParse !== undefined) return _cachedPdfParse;
  try {
    // esbuild converts dynamic import() of external CJS modules to require() in CJS bundle
    const specifier = "pdf-parse";
    const mod = await import(/* @vite-ignore */ specifier);
    _cachedPdfParse = (mod as { default?: PdfParseFunc }).default ?? (mod as unknown as PdfParseFunc);
    return _cachedPdfParse;
  } catch (e) {
    console.warn("[aiNews] pdf-parse not available, pdftotext-only mode:", (e as Error).message);
    _cachedPdfParse = null;
    return null;
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Допустимы только PDF-файлы"));
  },
});

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "dummy",
});

const SYSTEM_PROMPT = `Ты — редактор контента сайта МосАГРПроект (разработка архитектурно-градостроительного облика, АГР).
Тебе дан текст, извлечённый из PDF-документа. Твоя задача — сформировать статью для сайта в формате JSON.

Правила:
- title: краткий, ёмкий заголовок (до 90 символов), отражающий суть материала
- excerpt: 1–2 предложения для карточки-анонса (до 220 символов)
- content: полный текст статьи в формате Markdown. Используй ##, ###, **жирный**, - списки, > цитаты. Хорошо структурируй разделы. Не обрезай содержание.
- tag: СТРОГО одно из трёх значений: "Законодательство", "Практика", "Руководство"
  * Законодательство — нормативные акты, изменения в законах, требования регуляторов
  * Практика — реальные кейсы, примеры проектов, опыт согласований
  * Руководство — инструкции, советы, пошаговые гайды, алгоритмы действий
- readTime: оцени время чтения, формат "N мин" (например "7 мин")

Верни ТОЛЬКО валидный JSON без каких-либо дополнительных слов:
{
  "title": "...",
  "excerpt": "...",
  "content": "...",
  "tag": "...",
  "readTime": "..."
}`;

/**
 * Extract text from a PDF buffer.
 * Strategy:
 *  1. Try pdftotext (poppler) — most reliable for real PDFs
 *  2. Fall back to pdf-parse (pdfjs) if pdftotext fails
 */
async function extractPdfText(buffer: Buffer): Promise<string> {
  // Strategy 1: pdftotext (poppler) — most reliable for real PDFs
  // Uses temp input + temp output files (Poppler 25.x dropped stdout "-" support)
  const uid = randomBytes(8).toString("hex");
  const tmpIn = join(tmpdir(), `agr-pdf-in-${uid}.pdf`);
  const tmpOut = join(tmpdir(), `agr-pdf-out-${uid}.txt`);
  try {
    writeFileSync(tmpIn, buffer);
    const result = spawnSync(
      "pdftotext",
      ["-enc", "UTF-8", "-nopgbrk", tmpIn, tmpOut],
      { timeout: 30_000 }
    );

    if (result.status === 0) {
      try {
        const text = readFileSync(tmpOut, "utf8").trim();
        if (text.length >= 50) {
          console.log(`[AI parse-pdf] pdftotext OK: ${text.length} chars`);
          return text;
        }
      } catch { /* output file missing — no text layer */ }
    } else {
      const errMsg = result.stderr?.toString("utf8") ?? "unknown";
      console.warn("[AI parse-pdf] pdftotext failed:", errMsg.slice(0, 200));
    }
  } finally {
    try { unlinkSync(tmpIn); } catch { /* ignore */ }
    try { unlinkSync(tmpOut); } catch { /* ignore */ }
  }

  // Strategy 2: pdf-parse fallback (lazy-loaded to avoid CJS/ESM bundling issues)
  const pdfParseFn = await getPdfParse();
  if (pdfParseFn) {
    try {
      console.log("[AI parse-pdf] Falling back to pdf-parse...");
      const parsed = await pdfParseFn(buffer);
      const text = parsed.text?.trim() ?? "";
      if (text.length >= 50) {
        console.log(`[AI parse-pdf] pdf-parse OK: ${text.length} chars`);
        return text;
      }
    } catch (e) {
      console.warn("[AI parse-pdf] pdf-parse fallback error:", (e as Error).message);
    }
  }

  throw new Error("NO_TEXT");
}

// POST /api/admin/ai/parse-pdf
router.post(
  "/parse-pdf",
  adminAuth,
  upload.single("pdf"),
  async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ ok: false, error: "PDF-файл не загружен" });
        return;
      }

      // 1. Extract text from PDF
      let pdfText: string;
      try {
        pdfText = await extractPdfText(req.file.buffer);
      } catch (err: any) {
        if (err?.message === "NO_TEXT") {
          res.status(422).json({
            ok: false,
            error: "PDF не содержит читаемого текста. Возможно, это сканированный документ без слоя OCR.",
          });
        } else {
          console.error("[AI parse-pdf] extraction error:", err?.message);
          res.status(422).json({
            ok: false,
            error: "Не удалось прочитать PDF. Проверьте, что файл не защищён паролем и не повреждён.",
          });
        }
        return;
      }

      // 2. Truncate to avoid hitting token limits
      const truncated =
        pdfText.length > 48_000
          ? pdfText.slice(0, 48_000) + "\n\n[...текст обрезан...]"
          : pdfText;

      // 3. Ask GPT to extract article fields
      const completion = await openai.chat.completions.create({
        model: "gpt-5.2",
        max_completion_tokens: 8192,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Вот текст из PDF-документа:\n\n---\n${truncated}\n---\n\nСформируй статью для сайта в формате JSON.`,
          },
        ],
      });

      const rawContent = completion.choices[0]?.message?.content ?? "";

      // Strip markdown code fences if GPT wrapped in them
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("[AI parse-pdf] No JSON in GPT response:", rawContent.slice(0, 300));
        res.status(500).json({ ok: false, error: "ИИ вернул некорректный ответ. Попробуйте ещё раз." });
        return;
      }

      let article: {
        title: string;
        excerpt: string;
        content: string;
        tag: string;
        readTime: string;
      };

      try {
        article = JSON.parse(jsonMatch[0]);
      } catch {
        res.status(500).json({ ok: false, error: "Не удалось разобрать ответ ИИ. Попробуйте ещё раз." });
        return;
      }

      // Normalize tag
      const VALID_TAGS = ["Законодательство", "Практика", "Руководство"];
      if (!VALID_TAGS.includes(article.tag)) article.tag = "Практика";

      res.json({ ok: true, article });
    } catch (err: any) {
      console.error("[AI parse-pdf] Unhandled error:", err?.message ?? err);
      res.status(500).json({ ok: false, error: "Ошибка сервера при обработке PDF. Попробуйте ещё раз." });
    }
  }
);

// POST /api/admin/ai/generate-cover
// Body: { title, excerpt, tag }
// Returns: { ok: true, imageUrl: "/api/uploads/<file>" }
router.post("/generate-cover", adminAuth, async (req, res) => {
  try {
    const { title = "", excerpt = "", tag = "" } = req.body as {
      title?: string;
      excerpt?: string;
      tag?: string;
    };

    if (!title.trim()) {
      res.status(400).json({ ok: false, error: "Укажите заголовок статьи для генерации обложки" });
      return;
    }

    const tagHints: Record<string, string> = {
      "Законодательство": "official legal documents, government architecture regulations, Moscow city hall, formal governmental style",
      "Практика": "modern Moscow architecture, glass and concrete buildings, urban skyline, architectural blueprint review",
      "Руководство": "architectural planning table, blueprints spread out, professional workspace, urban design guide",
    };
    const tagHint = tagHints[tag] ?? "Moscow urban architecture, modern city buildings, professional design";

    const prompt = `Professional editorial cover image for a Russian architecture regulation article. 
Topic: "${title}". ${excerpt ? `Context: ${excerpt.slice(0, 150)}.` : ""}
Style: ${tagHint}.
Composition: wide horizontal banner (16:9), photorealistic or architectural illustration style, 
muted professional color palette (navy blue, grey, white accents), no text or typography overlay, 
high quality, suitable for a professional urban planning website.`;

    console.log("[AI generate-cover] Generating image for:", title.slice(0, 60));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = (await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
      n: 1,
    } as any)) as { data: Array<{ b64_json?: string }> };

    const b64 = response.data[0]?.b64_json;
    if (!b64) {
      console.error("[AI generate-cover] No b64_json in response");
      res.status(500).json({ ok: false, error: "ИИ не вернул изображение. Попробуйте ещё раз." });
      return;
    }

    const pngBuffer = Buffer.from(b64, "base64");

    // Convert PNG → WebP using ImageMagick
    const uid2 = randomBytes(6).toString("hex");
    const tmpPng = join(tmpdir(), `agr-cover-${uid2}.png`);
    const tmpWebp = join(tmpdir(), `agr-cover-${uid2}.webp`);
    try {
      writeFileSync(tmpPng, pngBuffer);
      const conv = spawnSync("magick", [tmpPng, "-quality", "85", tmpWebp], { timeout: 30_000 });
      if (conv.status !== 0) {
        console.warn("[AI generate-cover] ImageMagick failed, saving as PNG:", conv.stderr?.toString().slice(0, 200));
        // Fallback: save as PNG
        const pngFilename = `cover-ai-${Date.now()}-${uid2}.png`;
        writeFileSync(join(uploadsDir, pngFilename), pngBuffer);
        res.json({ ok: true, imageUrl: `/api/uploads/${pngFilename}` });
        return;
      }
      const webpBuffer = readFileSync(tmpWebp);
      const filename = `cover-ai-${Date.now()}-${uid2}.webp`;
      writeFileSync(join(uploadsDir, filename), webpBuffer);
      const imageUrl = `/api/uploads/${filename}`;
      console.log("[AI generate-cover] Saved WebP:", imageUrl, `(${webpBuffer.length} bytes)`);
      res.json({ ok: true, imageUrl });
    } finally {
      try { unlinkSync(tmpPng); } catch { /* ignore */ }
      try { unlinkSync(tmpWebp); } catch { /* ignore */ }
    }
  } catch (err: any) {
    console.error("[AI generate-cover] Error:", err?.message ?? err);
    res.status(500).json({ ok: false, error: "Ошибка генерации изображения. Попробуйте ещё раз." });
  }
});

export default router;
