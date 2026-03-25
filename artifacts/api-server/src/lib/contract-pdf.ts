import PDFDocument from "pdfkit";

const FONT_REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";
const FONT_BOLD    = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";

const DARK   = "#1e293b";
const GRAY   = "#64748b";
const BORDER = "#e2e8f0";
const WHITE  = "#ffffff";
const ACCENT = "#0ea5e9";

export interface ContractData {
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
  orderId?: number;
}

const PLACEHOLDERS: Record<string, keyof ContractData> = {
  "{{НОМЕР_ДОГОВОРА}}": "contractNumber",
  "{{ДАТА_ДОГОВОРА}}": "contractDate",
  "{{КОНТАКТНОЕ_ЛИЦО}}": "clientName",
  "{{EMAIL}}": "clientEmail",
  "{{НАИМЕНОВАНИЕ}}": "companyName",
  "{{ИНН}}": "inn",
  "{{КПП}}": "kpp",
  "{{ОГРН}}": "ogrn",
  "{{ЮР_АДРЕС}}": "legalAddress",
  "{{ДИРЕКТОР}}": "director",
  "{{РАСЧ_СЧЕТ}}": "bankAccount",
  "{{БАНК}}": "bankName",
  "{{БИК}}": "bik",
  "{{КОР_СЧЕТ}}": "corrAccount",
  "{{АДРЕС_ОБЪЕКТА}}": "objectAddress",
  "{{ПРЕДМЕТ}}": "subject",
  "{{СТОИМОСТЬ}}": "amount",
  "{{ПРЕДОПЛАТА}}": "prepayment",
  "{{СРОК}}": "deadline",
  "{{ПРИМЕЧАНИЯ}}": "notes",
};

export function substituteTemplate(template: string, data: ContractData): string {
  let result = template;
  for (const [placeholder, field] of Object.entries(PLACEHOLDERS)) {
    const value = (data[field] as string | undefined) ?? "";
    result = result.split(placeholder).join(value);
  }
  return result;
}

export function generateContractPdf(data: ContractData, template?: string | null): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      info: {
        Title: `Договор ${data.contractNumber}`,
        Author: "МосАГРПроект",
        Creator: "МосАГРПроект",
      },
    });

    doc.registerFont("Regular", FONT_REGULAR);
    doc.registerFont("Bold", FONT_BOLD);

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width;
    const margin = 56;
    const contentW = W - margin * 2;

    function fillRect(x: number, y: number, w: number, h: number, color: string) {
      doc.save().rect(x, y, w, h).fill(color).restore();
    }

    function hline(yPos: number, x1 = margin, x2 = W - margin, color = BORDER) {
      doc.save().moveTo(x1, yPos).lineTo(x2, yPos).strokeColor(color).lineWidth(0.5).stroke().restore();
    }

    if (template?.trim()) {
      // ── TEMPLATE MODE: substitute and render as flowing text ──────────────
      const filled = substituteTemplate(template, data);
      const lines = filled.split("\n");

      // Header
      fillRect(0, 0, W, 70, DARK);
      doc.fillColor(WHITE).font("Bold").fontSize(16).text("МосАГРПроект", margin, 20);
      doc.fillColor("#94a3b8").font("Regular").fontSize(9)
        .text("ООО «Минерал» — разработка АГР-документации", margin, 42);
      doc.fillColor("#94a3b8").font("Regular").fontSize(9)
        .text(`Договор № ${data.contractNumber}  ·  ${data.contractDate}`, 0, 42, { align: "right", width: W - margin });

      let y = 90;

      for (const line of lines) {
        const trimmed = line.trim();

        // Detect bold/heading lines — lines that are ALL CAPS or start with "СТАТЬЯ"/"§"
        const isHeading = /^(СТАТЬЯ|§|\d+\.\s|[А-ЯA-Z\s]{6,})/.test(trimmed) && trimmed === trimmed.toUpperCase() && trimmed.length > 0;
        const isSectionNum = /^\d+\.\s/.test(trimmed);

        const font = isHeading ? "Bold" : "Regular";
        const fontSize = isHeading ? 10 : 9;
        const color = isHeading ? DARK : GRAY;
        const indent = isSectionNum ? margin + 12 : margin;
        const lineGap = isHeading ? 4 : 2;
        const topGap = isHeading ? 8 : 0;

        if (y > doc.page.height - 80) {
          doc.addPage();
          y = 56;
        }

        y += topGap;

        if (trimmed.length === 0) {
          y += 6;
          continue;
        }

        doc.fillColor(color).font(font).fontSize(fontSize)
          .text(line, indent, y, { width: contentW - (indent - margin), lineGap, lineBreak: true });

        y = (doc as any).y + lineGap;
      }

      // Footer
      const footerY = doc.page.height - 48;
      hline(footerY, margin, W - margin, "#cbd5e1");
      doc.fillColor("#94a3b8").font("Regular").fontSize(7.5)
        .text("razrabotka-agr.ru  ·  office@razrabotka-agr.ru  ·  +7 (495) 568-18-77", margin, footerY + 8, { width: contentW, align: "center" });

    } else {
      // ── DATA CARD MODE: no template yet ───────────────────────────────────
      fillRect(0, 0, W, 80, DARK);
      doc.fillColor(WHITE).font("Bold").fontSize(18).text("МосАГРПроект", margin, 22);
      doc.fillColor("#94a3b8").font("Regular").fontSize(10)
        .text("ООО «Минерал» — разработка АГР-документации", margin, 48);
      doc.fillColor("#94a3b8").font("Regular").fontSize(9)
        .text(new Date().toLocaleDateString("ru-RU"), 0, 34, { align: "right", width: W - margin });

      let y = 108;

      doc.fillColor(GRAY).font("Regular").fontSize(9)
        .text("ДОГОВОР", margin, y, { characterSpacing: 1 });
      y += 16;
      doc.fillColor(DARK).font("Bold").fontSize(18)
        .text(`№ ${data.contractNumber}`, margin, y);
      y += 28;
      doc.fillColor(GRAY).font("Regular").fontSize(10)
        .text(`от ${data.contractDate}`, margin, y);
      y += 36;

      hline(y);
      y += 16;

      const sectionFs = 8;
      const lineH = 13;
      const lblW = 120;

      function dataRow(label: string, value: string | undefined | null, bold = false) {
        if (!value?.trim()) return;
        doc.fillColor(GRAY).font("Regular").fontSize(sectionFs)
          .text(label, margin, y, { width: lblW, lineBreak: false });
        doc.fillColor(DARK).font(bold ? "Bold" : "Regular").fontSize(sectionFs)
          .text(value, margin + lblW, y, { width: contentW - lblW, lineBreak: false });
        y += lineH;
      }

      function sectionTitle(title: string) {
        y += 6;
        doc.fillColor(GRAY).font("Bold").fontSize(sectionFs)
          .text(title, margin, y, { characterSpacing: 0.5 });
        y += lineH;
      }

      // Стороны
      sectionTitle("СТОРОНЫ ДОГОВОРА");
      if (data.companyName) dataRow("Заказчик:", data.companyName, true);
      else dataRow("Заказчик:", data.clientName, true);
      dataRow("Контактное лицо:", data.clientName);
      dataRow("Email:", data.clientEmail);
      dataRow("ИНН / КПП:", [data.inn, data.kpp].filter(Boolean).join(" / "));
      dataRow("ОГРН:", data.ogrn);
      dataRow("Юр. адрес:", data.legalAddress);
      dataRow("Директор:", data.director);

      y += 4; hline(y); y += 12;

      sectionTitle("БАНКОВСКИЕ РЕКВИЗИТЫ ЗАКАЗЧИКА");
      dataRow("Расч. счёт:", data.bankAccount);
      dataRow("Банк:", data.bankName);
      dataRow("БИК:", data.bik);
      dataRow("Корр. счёт:", data.corrAccount);

      y += 4; hline(y); y += 12;

      sectionTitle("ПРЕДМЕТ ДОГОВОРА");
      dataRow("Адрес объекта:", data.objectAddress);
      dataRow("Предмет:", data.subject);

      y += 4; hline(y); y += 12;

      sectionTitle("ФИНАНСОВЫЕ УСЛОВИЯ");
      dataRow("Стоимость:", data.amount, true);
      dataRow("Предоплата:", data.prepayment);
      dataRow("Срок выполнения:", data.deadline);

      if (data.notes?.trim()) {
        y += 4; hline(y); y += 12;
        sectionTitle("ПРИМЕЧАНИЯ");
        doc.fillColor(GRAY).font("Regular").fontSize(sectionFs)
          .text(data.notes, margin, y, { width: contentW, lineGap: 2 });
        y += (doc as any).currentLineHeight(true) * Math.ceil(data.notes.length / 90) + 12;
      }

      y += 16;
      hline(y);
      y += 10;

      // Notice that template is pending
      doc.fillColor(ACCENT).font("Bold").fontSize(8)
        .text("Шаблон договора ещё не загружен. Настройте его в разделе «Договора → Шаблон» в панели управления.", margin, y, { width: contentW, align: "center" });

      // Footer
      y += 24;
      hline(y, margin, W - margin, "#cbd5e1");
      y += 8;
      doc.fillColor("#94a3b8").font("Regular").fontSize(7.5)
        .text("razrabotka-agr.ru  ·  office@razrabotka-agr.ru  ·  +7 (495) 568-18-77", margin, y, { width: contentW, align: "center" });
    }

    doc.end();
  });
}
