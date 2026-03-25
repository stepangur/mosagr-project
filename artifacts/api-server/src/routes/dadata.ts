import { Router, type IRouter } from "express";

const router: IRouter = Router();

// Proxy to DaData "suggest party" API — lookup company by INN or name
router.post("/dadata/suggest", async (req, res) => {
  const apiKey = process.env.DADATA_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "DaData не настроен" });
    return;
  }

  const { query, count = 5 } = req.body as { query?: string; count?: number };
  if (!query?.trim()) {
    res.status(400).json({ error: "query обязателен" });
    return;
  }

  try {
    const response = await fetch(
      "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Token ${apiKey}`,
        },
        body: JSON.stringify({ query: query.trim(), count }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("DaData error:", response.status, text);
      res.status(502).json({ error: "Ошибка сервиса DaData" });
      return;
    }

    const data = await response.json() as { suggestions: unknown[] };
    res.json(data);
  } catch (err) {
    console.error("DaData fetch error:", err);
    res.status(502).json({ error: "Не удалось подключиться к DaData" });
  }
});

export default router;
