import PDFDocument from "pdfkit";
import { ProposalData } from "./email";

const FONT_REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";
const FONT_BOLD    = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";

const DARK   = "#1e293b";
const ACCENT = "#0ea5e9";
const GRAY   = "#64748b";
const LIGHT  = "#f8fafc";
const BORDER = "#e2e8f0";
const GREEN  = "#16a34a";
const YELLOW = "#ca8a04";
const WHITE  = "#ffffff";

function validUntilDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

function shortDate(): string {
  return new Date().toLocaleDateString("ru-RU");
}

export function generateProposalPdf(data: ProposalData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      info: {
        Title: `Коммерческое предложение — ${data.clientName}`,
        Author: "МосАГРПроект",
        Creator: "МосАГРПроект",
      },
    });

    doc.registerFont("Regular", FONT_REGULAR);
    doc.registerFont("Bold", FONT_BOLD);

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width;   // 595
    const margin = 48;
    const contentW = W - margin * 2;

    function fillRect(x: number, y: number, w: number, h: number, color: string) {
      doc.save().rect(x, y, w, h).fill(color).restore();
    }

    function hline(yPos: number, x1 = margin, x2 = W - margin, color = BORDER) {
      doc.save().moveTo(x1, yPos).lineTo(x2, yPos).strokeColor(color).lineWidth(0.5).stroke().restore();
    }

    // ── HEADER ────────────────────────────────────────────────────────────
    const headerH = 80;
    fillRect(0, 0, W, headerH, DARK);

    doc.fillColor(WHITE).font("Bold").fontSize(20).text("МосАГРПроект", margin, 22);
    doc.fillColor("#94a3b8").font("Regular").fontSize(10)
      .text("ООО «Минерал» — разработка АГР-документации", margin, 48);
    doc.fillColor("#94a3b8").font("Regular").fontSize(9)
      .text(shortDate(), 0, 34, { align: "right", width: W - margin });

    let y = headerH + 28;

    // ── TITLE BLOCK ───────────────────────────────────────────────────────
    doc.fillColor(GRAY).font("Regular").fontSize(9)
      .text("КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ", margin, y, { characterSpacing: 1 });

    y += 16;
    doc.fillColor(DARK).font("Bold").fontSize(16)
      .text(`Уважаемый(ая) ${data.clientName},`, margin, y);

    if (data.companyName?.trim()) {
      y += 20;
      doc.fillColor(GRAY).font("Bold").fontSize(11)
        .text(data.companyName, margin, y);
    }

    if (data.inn || data.kpp) {
      y += 15;
      const innKpp = [data.inn ? `ИНН: ${data.inn}` : "", data.kpp ? `КПП: ${data.kpp}` : ""].filter(Boolean).join("   ·   ");
      doc.fillColor("#94a3b8").font("Regular").fontSize(9)
        .text(innKpp, margin, y);
    }

    y += 28;
    doc.fillColor(GRAY).font("Regular").fontSize(10).text(
      "Благодарим за интерес к нашим услугам. Предлагаем вашему вниманию коммерческое предложение " +
      "по разработке архитектурно-градостроительного решения (АГР) в соответствии с требованиями Москомархитектуры.",
      margin, y, { width: contentW, lineGap: 3 }
    );

    y += 48;

    // ── SERVICES TABLE ────────────────────────────────────────────────────
    doc.fillColor(GRAY).font("Bold").fontSize(9)
      .text("СОСТАВ УСЛУГ", margin, y, { characterSpacing: 0.5 });

    y += 14;

    const col1 = margin;
    const col2 = margin + 200;
    const col3 = W - margin - 100;
    const rowH = 32;

    fillRect(col1, y, contentW, rowH, DARK);
    doc.fillColor(WHITE).font("Bold").fontSize(9);
    doc.text("Услуга",     col1 + 8, y + 11, { width: 190 });
    doc.text("Описание",   col2 + 8, y + 11, { width: 170 });
    doc.text("Стоимость",  col3,     y + 11, { width: 95, align: "right" });
    y += rowH;

    data.services.forEach((svc, i) => {
      const bg = i % 2 === 0 ? LIGHT : WHITE;
      const nameLines = Math.ceil(svc.name.length / 28);
      const descLines = svc.description ? Math.ceil(svc.description.length / 32) : 1;
      const rH = Math.max(nameLines, descLines) * 14 + 16;

      fillRect(col1, y, contentW, rH, bg);
      doc.save().rect(col1, y, contentW, rH).strokeColor(BORDER).lineWidth(0.5).stroke().restore();

      doc.fillColor(DARK).font("Bold").fontSize(9)
        .text(svc.name, col1 + 8, y + 8, { width: 185, lineGap: 2 });
      doc.fillColor(GRAY).font("Regular").fontSize(8.5)
        .text(svc.description || "—", col2 + 8, y + 8, { width: col3 - col2 - 12, lineGap: 2 });
      doc.fillColor(DARK).font("Bold").fontSize(9)
        .text(svc.price || "—", col3, y + 8, { width: 95, align: "right" });

      y += rH;
    });

    // Notes row
    if (data.notes?.trim()) {
      const nH = 36;
      fillRect(col1, y, contentW, nH, "#fffbeb");
      doc.save().rect(col1, y, contentW, nH).strokeColor(BORDER).lineWidth(0.5).stroke().restore();
      doc.fillColor(YELLOW).font("Bold").fontSize(8.5)
        .text("Примечания: ", col1 + 8, y + 11, { continued: true });
      doc.fillColor(GRAY).font("Regular").fontSize(8.5)
        .text(data.notes, { width: contentW - 16 });
      y += nH;
    }

    // Discount row
    if (data.discountAmount?.trim()) {
      const dH = 32;
      fillRect(col1, y, contentW, dH, "#f0fdf4");
      doc.save().rect(col1, y, contentW, dH).strokeColor("#bbf7d0").lineWidth(0.5).stroke().restore();
      doc.fillColor(GREEN).font("Bold").fontSize(9).text("Скидка", col1 + 8, y + 11, { width: 200 });
      doc.fillColor(GREEN).font("Bold").fontSize(9).text(`−${data.discountAmount}`, col3, y + 11, { width: 95, align: "right" });
      y += dH;
    }

    // Total row
    const totalH = 40;
    fillRect(col1, y, contentW, totalH, DARK);
    doc.fillColor(WHITE).font("Bold").fontSize(11).text("ИТОГО", col1 + 8, y + 13, { width: 200 });
    doc.fillColor(ACCENT).font("Bold").fontSize(13).text(data.totalPrice, col3, y + 11, { width: 95, align: "right" });
    y += totalH + 24;

    // ── TERMS ROW ─────────────────────────────────────────────────────────
    const boxW = (contentW - 12) / 2;
    const boxH = 52;

    fillRect(margin, y, boxW, boxH, "#f0fdf4");
    doc.save().rect(margin, y, boxW, boxH).strokeColor("#bbf7d0").lineWidth(0.5).stroke().restore();
    doc.fillColor(GREEN).font("Bold").fontSize(8)
      .text("СРОК ВЫПОЛНЕНИЯ", margin + 12, y + 10, { characterSpacing: 0.3 });
    doc.fillColor("#166534").font("Bold").fontSize(13)
      .text(data.deadline, margin + 12, y + 24);

    const box2x = margin + boxW + 12;
    fillRect(box2x, y, boxW, boxH, "#fef9c3");
    doc.save().rect(box2x, y, boxW, boxH).strokeColor("#fde68a").lineWidth(0.5).stroke().restore();
    doc.fillColor(YELLOW).font("Bold").fontSize(8)
      .text("КП ДЕЙСТВУЕТ ДО", box2x + 12, y + 10, { characterSpacing: 0.3 });
    doc.fillColor("#713f12").font("Bold").fontSize(11)
      .text(validUntilDate(data.validDays), box2x + 12, y + 26);

    y += boxH + 24;

    // ── MANAGER BLOCK ─────────────────────────────────────────────────────
    if (data.managerName) {
      const mH = 60;
      fillRect(margin, y, contentW, mH, LIGHT);
      doc.save().rect(margin, y, 3, mH).fill(DARK).restore();
      doc.save().rect(margin, y, contentW, mH).strokeColor(BORDER).lineWidth(0.5).stroke().restore();

      doc.fillColor(GRAY).font("Regular").fontSize(9).text("Ваш менеджер", margin + 16, y + 10);
      doc.fillColor(DARK).font("Bold").fontSize(12).text(data.managerName, margin + 16, y + 24);

      const contactParts: string[] = [];
      if (data.managerPhone) contactParts.push(data.managerPhone);
      contactParts.push("office@razrabotka-agr.ru");
      doc.fillColor(GRAY).font("Regular").fontSize(9)
        .text(contactParts.join("  ·  "), margin + 16, y + 42);

      y += mH + 24;
    }

    // ── REQUISITES BLOCK ──────────────────────────────────────────────────
    hline(y);
    y += 10;

    doc.fillColor(GRAY).font("Bold").fontSize(8)
      .text("РЕКВИЗИТЫ", margin, y, { characterSpacing: 0.5 });
    y += 13;

    const reqFs   = 7;    // font size
    const lineH   = 11;   // line height
    const lblW    = 78;   // label column width

    // Single-row helper: label in gray, value in dark, on the same y
    function reqRow(label: string, value: string) {
      doc.fillColor(GRAY).font("Regular").fontSize(reqFs)
        .text(label, margin, y, { width: lblW, lineBreak: false });
      doc.fillColor(DARK).font("Bold").fontSize(reqFs)
        .text(value, margin + lblW, y, { width: contentW - lblW, lineBreak: false });
      y += lineH;
    }

    reqRow("Наименование:", "ООО «Минерал»");
    reqRow("Юр. адрес:",   "125130, Москва, ул. Выборгская, д. 22 стр. 1, помещ. 1/1");
    reqRow("ИНН / КПП:",   "3234051013 / 774301001");
    reqRow("ОГРН:",        "1033265025287");
    reqRow("Директор:",    "Гурцкая Степан Сергеевич");

    y += 3; // small gap before bank accounts

    doc.fillColor(GRAY).font("Bold").fontSize(reqFs)
      .text("Расчётные счета:", margin, y, { width: contentW, lineBreak: false });
    y += lineH;

    doc.fillColor(DARK).font("Regular").fontSize(reqFs)
      .text(
        "р/с 40702810102790005920 в АО «Альфа-Банк», " +
        "к/с 30101810200000000593, БИК 044525593",
        margin, y, { width: contentW, lineBreak: false }
      );
    y += lineH;

    doc.fillColor(DARK).font("Regular").fontSize(reqFs)
      .text(
        "р/с 40702810040000120426 в ПАО Сбербанк, " +
        "к/с 30101810400000000225, БИК 044525225",
        margin, y, { width: contentW, lineBreak: false }
      );
    y += lineH + 4;

    doc.fillColor(GRAY).font("Regular").fontSize(reqFs)
      .text("Сайт: razrabotka-agr.ru  ·  E-mail: office@razrabotka-agr.ru  ·  Тел.: +7 (495) 568-18-77",
        margin, y, { width: contentW, lineBreak: false });
    y += lineH + 8;

    // ── FOOTER ────────────────────────────────────────────────────────────
    hline(y, margin, W - margin, "#cbd5e1");
    y += 8;
    doc.fillColor("#94a3b8").font("Regular").fontSize(7.5).text(
      "Настоящий документ не является счётом. Коммерческое предложение действительно в указанный срок.",
      margin, y, { width: contentW, align: "center" }
    );

    doc.end();
  });
}
