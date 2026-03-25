import { db } from "@workspace/db";
import { siteSettingsTable } from "@workspace/db/schema";
import { inArray } from "drizzle-orm";

const SERVICE_LABELS: Record<string, string> = {
  booklet_ag: "Буклет АГР",
  consultation: "Консультация",
  full_package: "Полный пакет",
};

interface OrderData {
  name: string;
  phone: string;
  email: string;
  address: string;
  serviceType: string;
  notes?: string | null;
}

async function getTelegramSettings(): Promise<{ enabled: boolean; botToken: string; chatId: string } | null> {
  const rows = await db
    .select()
    .from(siteSettingsTable)
    .where(inArray(siteSettingsTable.key, ["notify.telegram.enabled", "notify.telegram.bot_token", "notify.telegram.chat_id"]));

  const map = Object.fromEntries(rows.map(r => [r.key, r.value ?? ""]));

  const enabled = map["notify.telegram.enabled"] === "1";
  const botToken = map["notify.telegram.bot_token"] ?? "";
  const chatId = map["notify.telegram.chat_id"] ?? "";

  if (!enabled || !botToken || !chatId) return null;
  return { enabled, botToken, chatId };
}

export async function sendOrderNotification(order: OrderData): Promise<void> {
  try {
    const tg = await getTelegramSettings();
    if (!tg) return;

    const serviceLabel = SERVICE_LABELS[order.serviceType] ?? order.serviceType;

    const lines = [
      "🔔 <b>Новая заявка на сайте МосАГРПроект</b>",
      "",
      `👤 <b>Имя:</b> ${esc(order.name)}`,
      `📞 <b>Телефон:</b> ${esc(order.phone)}`,
      `📧 <b>Email:</b> ${esc(order.email)}`,
      `📍 <b>Адрес объекта:</b> ${esc(order.address)}`,
      `🔧 <b>Услуга:</b> ${esc(serviceLabel)}`,
    ];

    if (order.notes?.trim()) {
      lines.push(`📝 <b>Примечание:</b> ${esc(order.notes)}`);
    }

    const text = lines.join("\n");

    const url = `https://api.telegram.org/bot${tg.botToken}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: tg.chatId, text, parse_mode: "HTML" }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[Telegram] Failed to send notification:", err);
    }
  } catch (err) {
    console.error("[Telegram] Error sending notification:", err);
  }
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
