import nodemailer from "nodemailer";
import { db } from "@workspace/db";
import { siteSettingsTable } from "@workspace/db/schema";
import { inArray } from "drizzle-orm";

const SERVICE_LABELS: Record<string, string> = {
  booklet_ag: "Буклет АГР",
  consultation: "Консультация",
  full_package: "Полный пакет",
};

const EMAIL_KEYS = [
  "notify.email.enabled",
  "notify.email.smtp_host",
  "notify.email.smtp_port",
  "notify.email.smtp_user",
  "notify.email.smtp_pass",
  "notify.email.from",
  "notify.email.recipients",
  "notify.email.smtp_secure",
];

interface EmailSettings {
  enabled: boolean;
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  recipients: string[];
  secure: boolean;
}

export interface OrderData {
  name: string;
  phone: string;
  email: string;
  address: string;
  serviceType: string;
  notes?: string | null;
}

async function getEmailSettings(): Promise<EmailSettings | null> {
  const rows = await db
    .select()
    .from(siteSettingsTable)
    .where(inArray(siteSettingsTable.key, EMAIL_KEYS));

  const m = Object.fromEntries(rows.map(r => [r.key, r.value ?? ""]));

  const enabled = m["notify.email.enabled"] === "1";
  const host = m["notify.email.smtp_host"] ?? "";
  const user = m["notify.email.smtp_user"] ?? "";
  const pass = m["notify.email.smtp_pass"] ?? "";
  const from = m["notify.email.from"] ?? "";
  const recipientsRaw = m["notify.email.recipients"] ?? "";
  const port = parseInt(m["notify.email.smtp_port"] ?? "587", 10) || 587;
  const secure = m["notify.email.smtp_secure"] === "1";

  const recipients = recipientsRaw
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  if (!enabled || !host || !user || !pass || !from || recipients.length === 0) return null;
  return { enabled, host, port, user, pass, from, recipients, secure };
}

function buildHtmlBody(order: OrderData): string {
  const serviceLabel = SERVICE_LABELS[order.serviceType] ?? order.serviceType;
  const notesRow = order.notes?.trim()
    ? `<tr><td style="padding:8px 12px;color:#64748b;font-size:14px;white-space:nowrap">Примечание</td><td style="padding:8px 12px;font-size:14px">${esc(order.notes)}</td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">
        <tr>
          <td style="background:#1e293b;padding:24px 32px">
            <p style="margin:0;font-size:20px;font-weight:700;color:#fff">МосАГРПроект</p>
            <p style="margin:4px 0 0;font-size:13px;color:#94a3b8">Новая заявка с сайта razrabotka-agr.ru</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
              <tr style="background:#f8fafc">
                <td style="padding:8px 12px;color:#64748b;font-size:14px;white-space:nowrap">Имя</td>
                <td style="padding:8px 12px;font-size:14px;font-weight:600">${esc(order.name)}</td>
              </tr>
              <tr>
                <td style="padding:8px 12px;color:#64748b;font-size:14px;white-space:nowrap">Телефон</td>
                <td style="padding:8px 12px;font-size:14px"><a href="tel:${esc(order.phone)}" style="color:#1e293b;text-decoration:none">${esc(order.phone)}</a></td>
              </tr>
              <tr style="background:#f8fafc">
                <td style="padding:8px 12px;color:#64748b;font-size:14px;white-space:nowrap">Email</td>
                <td style="padding:8px 12px;font-size:14px"><a href="mailto:${esc(order.email)}" style="color:#1e293b;text-decoration:none">${esc(order.email)}</a></td>
              </tr>
              <tr>
                <td style="padding:8px 12px;color:#64748b;font-size:14px;white-space:nowrap">Адрес объекта</td>
                <td style="padding:8px 12px;font-size:14px">${esc(order.address)}</td>
              </tr>
              <tr style="background:#f8fafc">
                <td style="padding:8px 12px;color:#64748b;font-size:14px;white-space:nowrap">Услуга</td>
                <td style="padding:8px 12px;font-size:14px"><span style="background:#dbeafe;color:#1d4ed8;padding:2px 8px;border-radius:4px;font-size:13px">${esc(serviceLabel)}</span></td>
              </tr>
              ${notesRow}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 28px">
            <a href="https://razrabotka-agr.ru/admin/orders" style="display:inline-block;background:#1e293b;color:#fff;padding:10px 22px;border-radius:8px;font-size:14px;text-decoration:none;font-weight:600">Открыть в панели →</a>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0">
            <p style="margin:0;font-size:12px;color:#94a3b8">Это автоматическое письмо от сайта razrabotka-agr.ru. Не отвечайте на него.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildTextBody(order: OrderData): string {
  const serviceLabel = SERVICE_LABELS[order.serviceType] ?? order.serviceType;
  const lines = [
    "Новая заявка — МосАГРПроект",
    "================================",
    `Имя:         ${order.name}`,
    `Телефон:     ${order.phone}`,
    `Email:       ${order.email}`,
    `Адрес:       ${order.address}`,
    `Услуга:      ${serviceLabel}`,
  ];
  if (order.notes?.trim()) lines.push(`Примечание:  ${order.notes}`);
  lines.push("", "https://razrabotka-agr.ru/admin/orders");
  return lines.join("\n");
}

export interface ProposalItem {
  name: string;
  description?: string;
  price: string;
}

export interface ProposalData {
  clientName: string;
  clientEmail: string;
  companyName?: string;
  inn?: string;
  kpp?: string;
  services: ProposalItem[];
  totalPrice: string;
  discountAmount?: string;
  validDays: number;
  deadline: string;
  managerName: string;
  managerPhone?: string;
  notes?: string;
  orderId?: number;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function createTransport(cfg: {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}) {
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
    tls: { rejectUnauthorized: false },
  });
}

export async function sendEmailNotification(order: OrderData): Promise<void> {
  try {
    const cfg = await getEmailSettings();
    if (!cfg) return;

    const transport = createTransport(cfg);
    const serviceLabel = SERVICE_LABELS[order.serviceType] ?? order.serviceType;

    await transport.sendMail({
      from: cfg.from,
      to: cfg.recipients.join(", "),
      subject: `Новая заявка: ${order.name} — ${serviceLabel}`,
      text: buildTextBody(order),
      html: buildHtmlBody(order),
    });
  } catch (err) {
    console.error("[Email] Error sending notification:", err);
  }
}

function buildProposalHtml(d: ProposalData): string {
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + d.validDays);
  const validUntilStr = validUntil.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

  const serviceRows = d.services
    .map((s, i) => `
      <tr style="background:${i % 2 === 0 ? "#f8fafc" : "#fff"}">
        <td style="padding:12px 16px;font-size:14px;font-weight:600;color:#1e293b;vertical-align:top">${esc(s.name)}</td>
        <td style="padding:12px 16px;font-size:13px;color:#64748b;vertical-align:top">${s.description ? esc(s.description) : "—"}</td>
        <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#1e293b;white-space:nowrap;text-align:right;vertical-align:top">${esc(s.price)}</td>
      </tr>`)
    .join("");

  const notesBlock = d.notes?.trim()
    ? `<tr><td colspan="3" style="padding:12px 16px;font-size:13px;color:#64748b;border-top:1px solid #e2e8f0;background:#fffbeb">
        <strong>Примечания:</strong> ${esc(d.notes)}
      </td></tr>`
    : "";

  const discountBlock = d.discountAmount?.trim()
    ? `<tr style="background:#f0fdf4">
        <td colspan="2" style="padding:10px 16px;font-size:14px;font-weight:600;color:#16a34a;border-top:1px solid #e2e8f0">Скидка</td>
        <td style="padding:10px 16px;font-size:14px;font-weight:700;color:#16a34a;text-align:right;white-space:nowrap">−${esc(d.discountAmount)}</td>
      </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">

        <!-- Header -->
        <tr>
          <td style="background:#1e293b;padding:28px 36px">
            <p style="margin:0;font-size:22px;font-weight:700;color:#fff">МосАГРПроект</p>
            <p style="margin:4px 0 0;font-size:13px;color:#94a3b8">ООО «Минерал» — разработка АГР-документации</p>
          </td>
        </tr>

        <!-- Title -->
        <tr>
          <td style="padding:28px 36px 16px;border-bottom:2px solid #f1f5f9">
            <p style="margin:0 0 4px;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#94a3b8;font-weight:600">КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ</p>
            <p style="margin:0;font-size:22px;font-weight:700;color:#1e293b">Уважаемый(ая) ${esc(d.clientName)},</p>
            ${d.companyName?.trim() ? `<p style="margin:6px 0 0;font-size:15px;color:#475569;font-weight:600">${esc(d.companyName)}</p>` : ""}
            ${(d.inn || d.kpp) ? `<p style="margin:4px 0 0;font-size:13px;color:#94a3b8">${[d.inn ? "ИНН: " + esc(d.inn) : "", d.kpp ? "КПП: " + esc(d.kpp) : ""].filter(Boolean).join("  ·  ")}</p>` : ""}
            <p style="margin:12px 0 0;font-size:14px;color:#475569;line-height:1.6">
              Благодарим за интерес к нашим услугам. Предлагаем вашему вниманию коммерческое предложение
              по разработке архитектурно-градостроительного решения (АГР) в соответствии с требованиями
              Москомархитектуры.
            </p>
          </td>
        </tr>

        <!-- Services table -->
        <tr>
          <td style="padding:24px 36px 0">
            <p style="margin:0 0 12px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#64748b">Состав услуг</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 36px">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
              <thead>
                <tr style="background:#1e293b">
                  <th style="padding:10px 16px;text-align:left;font-size:12px;color:#cbd5e1;font-weight:600;text-transform:uppercase;letter-spacing:.5px">Услуга</th>
                  <th style="padding:10px 16px;text-align:left;font-size:12px;color:#cbd5e1;font-weight:600;text-transform:uppercase;letter-spacing:.5px">Описание</th>
                  <th style="padding:10px 16px;text-align:right;font-size:12px;color:#cbd5e1;font-weight:600;text-transform:uppercase;letter-spacing:.5px">Стоимость</th>
                </tr>
              </thead>
              <tbody>
                ${serviceRows}
                ${notesBlock}
                ${discountBlock}
              </tbody>
              <tfoot>
                <tr style="background:#1e293b">
                  <td colspan="2" style="padding:14px 16px;font-size:15px;font-weight:700;color:#fff">ИТОГО</td>
                  <td style="padding:14px 16px;font-size:17px;font-weight:700;color:#38bdf8;text-align:right;white-space:nowrap">${esc(d.totalPrice)}</td>
                </tr>
              </tfoot>
            </table>
          </td>
        </tr>

        <!-- Terms -->
        <tr>
          <td style="padding:24px 36px 0">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
              <tr>
                <td style="width:50%;padding:0 12px 0 0;vertical-align:top">
                  <div style="background:#f0fdf4;border-radius:8px;padding:16px">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#16a34a">Срок выполнения</p>
                    <p style="margin:0;font-size:15px;font-weight:600;color:#166534">${esc(d.deadline)}</p>
                  </div>
                </td>
                <td style="width:50%;padding:0 0 0 12px;vertical-align:top">
                  <div style="background:#fef9c3;border-radius:8px;padding:16px">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#ca8a04">КП действует до</p>
                    <p style="margin:0;font-size:15px;font-weight:600;color:#713f12">${validUntilStr}</p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Manager -->
        <tr>
          <td style="padding:24px 36px">
            <div style="background:#f8fafc;border-radius:8px;padding:16px;border-left:3px solid #1e293b">
              <p style="margin:0 0 2px;font-size:12px;color:#94a3b8">Ваш менеджер</p>
              <p style="margin:0;font-size:15px;font-weight:700;color:#1e293b">${esc(d.managerName)}</p>
              ${d.managerPhone ? `<p style="margin:4px 0 0;font-size:13px;color:#475569"><a href="tel:${esc(d.managerPhone)}" style="color:#475569;text-decoration:none">${esc(d.managerPhone)}</a></p>` : ""}
              <p style="margin:4px 0 0;font-size:13px;color:#475569"><a href="mailto:office@razrabotka-agr.ru" style="color:#475569;text-decoration:none">office@razrabotka-agr.ru</a></p>
            </div>
          </td>
        </tr>

        <!-- Requisites -->
        <tr>
          <td style="background:#f8fafc;padding:20px 36px 0;border-top:1px solid #e2e8f0">
            <p style="margin:0 0 10px;font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:.5px;text-transform:uppercase">Реквизиты</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:50%;vertical-align:top;padding-right:16px">
                  <p style="margin:0 0 3px;font-size:11px;color:#64748b"><span style="color:#94a3b8">Наименование:</span> ООО «Минерал»</p>
                  <p style="margin:0 0 3px;font-size:11px;color:#64748b"><span style="color:#94a3b8">Адрес:</span> 125130, г. Москва, Выборгская ул., д. 22 стр. 1, помещ. 1/1</p>
                  <p style="margin:0 0 3px;font-size:11px;color:#64748b"><span style="color:#94a3b8">ИНН:</span> 3234051013 &nbsp;·&nbsp; <span style="color:#94a3b8">КПП:</span> 774301001</p>
                  <p style="margin:0 0 3px;font-size:11px;color:#64748b"><span style="color:#94a3b8">ОГРН:</span> 1033265025287</p>
                  <p style="margin:0 0 3px;font-size:11px;color:#64748b"><span style="color:#94a3b8">Директор:</span> Гурцкая Степан Сергеевич</p>
                  <p style="margin:6px 0 0;font-size:11px;color:#64748b">razrabotka-agr.ru &nbsp;·&nbsp; office@razrabotka-agr.ru</p>
                </td>
                <td style="width:50%;vertical-align:top;padding-left:16px;border-left:1px solid #e2e8f0">
                  <p style="margin:0 0 5px;font-size:10px;font-weight:700;color:#94a3b8">Расчётные счета:</p>
                  <p style="margin:0 0 2px;font-size:11px;color:#64748b">р/с 40702810102790005920</p>
                  <p style="margin:0 0 2px;font-size:11px;color:#64748b">АО «Альфа-Банк», к/с 30101810200000000593</p>
                  <p style="margin:0 0 8px;font-size:11px;color:#64748b">БИК 044525593</p>
                  <p style="margin:0 0 2px;font-size:11px;color:#64748b">р/с 40702810040000120426</p>
                  <p style="margin:0 0 2px;font-size:11px;color:#64748b">ПАО Сбербанк, к/с 30101810400000000225</p>
                  <p style="margin:0;font-size:11px;color:#64748b">БИК 044525225</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:12px 36px 16px">
            <p style="margin:0;font-size:10px;color:#cbd5e1;text-align:center">
              Настоящий документ не является счётом. КП действительно в указанный срок.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendProposal(data: ProposalData): Promise<{ ok: boolean; error?: string }> {
  try {
    const cfg = await getEmailSettings();
    if (!cfg) {
      return { ok: false, error: "SMTP не настроен. Настройте email в разделе «Настройки сайта»." };
    }

    const { generateProposalPdf } = await import("./proposal-pdf");
    const pdfBuffer = await generateProposalPdf(data);

    const transport = createTransport(cfg);
    await transport.sendMail({
      from: cfg.from,
      to: data.clientEmail,
      replyTo: cfg.from,
      subject: `Коммерческое предложение — МосАГРПроект`,
      html: buildProposalHtml(data),
      attachments: [
        {
          filename: "КП_МосАГРПроект.pdf",
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}

export async function sendContract(data: {
  contractNumber: string;
  contractDate: string;
  clientName: string;
  clientEmail?: string;
  companyName?: string;
  inn?: string;
  kpp?: string;
  ogrn?: string;
  legalAddress?: string;
  director?: string;
  bankAccount?: string;
  bankName?: string;
  bik?: string;
  corrAccount?: string;
  objectAddress?: string;
  subject?: string;
  amount?: string;
  prepayment?: string;
  deadline?: string;
  notes?: string;
}, template?: string | null): Promise<{ ok: boolean; error?: string }> {
  try {
    const toEmail = data.clientEmail?.trim();
    if (!toEmail) {
      return { ok: false, error: "Не указан email получателя" };
    }

    const cfg = await getEmailSettings();
    if (!cfg) {
      return { ok: false, error: "SMTP не настроен. Настройте email в разделе «Настройки сайта»." };
    }

    const { generateContractPdf } = await import("./contract-pdf");
    const pdfBuffer = await generateContractPdf(data, template);

    const clientLabel = data.companyName ? `${data.companyName} (${data.clientName})` : data.clientName;
    const amountLine = data.amount ? `<p style="margin:6px 0;color:#374151;"><strong>Стоимость:</strong> ${data.amount}</p>` : "";
    const deadlineLine = data.deadline ? `<p style="margin:6px 0;color:#374151;"><strong>Срок выполнения:</strong> ${data.deadline}</p>` : "";
    const subjectLine = data.subject ? `<p style="margin:6px 0;color:#374151;"><strong>Предмет:</strong> ${data.subject}</p>` : "";

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <tr><td style="background:#1e293b;padding:28px 36px;">
        <p style="margin:0;color:#ffffff;font-size:22px;font-weight:bold;">МосАГРПроект</p>
        <p style="margin:6px 0 0;color:#94a3b8;font-size:13px;">ООО «Минерал» — разработка АГР-документации</p>
      </td></tr>
      <tr><td style="padding:32px 36px;">
        <p style="margin:0 0 16px;color:#1e293b;font-size:16px;font-weight:bold;">Уважаемый(-ая) ${data.clientName},</p>
        <p style="margin:0 0 24px;color:#475569;line-height:1.6;">Направляем вам договор на оказание услуг. Документ прикреплён к данному письму в формате PDF.</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:24px;">
          <p style="margin:0 0 12px;color:#64748b;font-size:12px;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;">Детали договора</p>
          <p style="margin:6px 0;color:#374151;"><strong>Номер договора:</strong> ${data.contractNumber}</p>
          <p style="margin:6px 0;color:#374151;"><strong>Дата:</strong> ${data.contractDate}</p>
          <p style="margin:6px 0;color:#374151;"><strong>Заказчик:</strong> ${clientLabel}</p>
          ${subjectLine}${amountLine}${deadlineLine}
        </div>
        <p style="margin:0 0 8px;color:#475569;line-height:1.6;">По всем вопросам обращайтесь:</p>
        <p style="margin:0;color:#475569;"><a href="tel:+74955681877" style="color:#0ea5e9;">+7 (495) 568-18-77</a> &nbsp;|&nbsp; <a href="mailto:office@razrabotka-agr.ru" style="color:#0ea5e9;">office@razrabotka-agr.ru</a></p>
      </td></tr>
      <tr><td style="background:#f8fafc;padding:16px 36px;border-top:1px solid #e2e8f0;">
        <p style="margin:0;color:#94a3b8;font-size:11px;text-align:center;">МосАГРПроект · razrabotka-agr.ru · ИНН 3234051013</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

    const transport = createTransport(cfg);
    await transport.sendMail({
      from: cfg.from,
      to: toEmail,
      replyTo: cfg.from,
      subject: `Договор № ${data.contractNumber} — МосАГРПроект`,
      html,
      attachments: [
        {
          filename: `Договор_${data.contractNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}

export async function sendEmailTest(cfg: {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  recipients: string[];
}): Promise<void> {
  const transport = createTransport(cfg);

  const testOrder: OrderData = {
    name: "Иван Иванов",
    phone: "+7 (495) 568-18-77",
    email: "test@razrabotka-agr.ru",
    address: "г. Москва, ул. Выборгская, д. 22",
    serviceType: "booklet_ag",
    notes: "Это тестовое письмо. Если вы его получили — настройка выполнена верно!",
  };

  await transport.sendMail({
    from: cfg.from,
    to: cfg.recipients.join(", "),
    subject: "✅ Тест уведомлений МосАГРПроект",
    text: buildTextBody(testOrder),
    html: buildHtmlBody(testOrder),
  });
}
