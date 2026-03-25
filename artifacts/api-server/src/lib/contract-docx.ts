import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  convertInchesToTwip,
  PageOrientation,
} from "docx";
import { ContractData, substituteTemplate } from "./contract-pdf";

const IS_HEADING = /^(СТАТЬЯ|§|\d+\.)/.test.bind(/^(СТАТЬЯ|§|\d+\.)/);

function isAllCaps(s: string) {
  return s.length > 3 && s === s.toUpperCase() && /[А-ЯA-Z]/.test(s);
}

function buildTemplateParagraphs(text: string): Paragraph[] {
  const lines = text.split("\n");
  const paragraphs: Paragraph[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      paragraphs.push(new Paragraph({ spacing: { after: 80 } }));
      continue;
    }

    const heading = isAllCaps(trimmed) || IS_HEADING(trimmed);

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: line,
            bold: heading,
            size: heading ? 22 : 20,
            font: "Times New Roman",
            color: heading ? "1e293b" : "374151",
          }),
        ],
        spacing: { before: heading ? 160 : 40, after: heading ? 80 : 40 },
        indent: trimmed.match(/^\d+\.\d+/) ? { left: convertInchesToTwip(0.25) } : undefined,
      })
    );
  }

  return paragraphs;
}

function dataTable(rows: Array<[string, string | undefined | null]>): Table {
  const tableRows = rows
    .filter(([, v]) => v?.trim())
    .map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: label, bold: false, size: 18, color: "6b7280", font: "Times New Roman" })],
                }),
              ],
              width: { size: 30, type: WidthType.PERCENTAGE },
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
              shading: { type: ShadingType.CLEAR, color: "auto", fill: "f8fafc" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: value ?? "", size: 18, font: "Times New Roman", color: "1e293b" })],
                }),
              ],
              width: { size: 70, type: WidthType.PERCENTAGE },
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            }),
          ],
        })
    );

  if (tableRows.length === 0) {
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [] })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }),
        ],
      })
    );
  }

  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideH: { style: BorderStyle.NONE },
      insideV: { style: BorderStyle.NONE },
    },
  });
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 20, font: "Times New Roman", color: "1e293b", allCaps: true })],
    spacing: { before: 240, after: 120 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "e2e8f0" },
    },
  });
}

function spacer(): Paragraph {
  return new Paragraph({ spacing: { after: 120 } });
}

export async function generateContractDocx(data: ContractData, template?: string | null): Promise<Buffer> {
  const headerParagraphs: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({ text: "МосАГРПроект", bold: true, size: 32, font: "Times New Roman", color: "ffffff" }),
      ],
      spacing: { before: 120, after: 40 },
      shading: { type: ShadingType.SOLID, color: "1e293b" },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "ООО «Минерал» — разработка АГР-документации", size: 18, font: "Times New Roman", color: "94a3b8" }),
      ],
      shading: { type: ShadingType.SOLID, color: "1e293b" },
      spacing: { after: 120 },
    }),
    spacer(),
    new Paragraph({
      children: [
        new TextRun({ text: `Договор № ${data.contractNumber}`, bold: true, size: 28, font: "Times New Roman", color: "1e293b" }),
      ],
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `от ${data.contractDate}`, size: 22, font: "Times New Roman", color: "64748b" }),
      ],
      spacing: { after: 240 },
    }),
  ];

  let bodyChildren: (Paragraph | Table)[];

  if (template?.trim()) {
    const filled = substituteTemplate(template, data);
    bodyChildren = buildTemplateParagraphs(filled);
  } else {
    bodyChildren = [
      sectionHeading("Стороны договора"),
      dataTable([
        ["Заказчик:", data.companyName || data.clientName],
        ["Контактное лицо:", data.clientName],
        ["Email:", data.clientEmail],
        ["ИНН / КПП:", [data.inn, data.kpp].filter(Boolean).join(" / ") || null],
        ["ОГРН:", data.ogrn],
        ["Юр. адрес:", data.legalAddress],
        ["Директор:", data.director],
      ]),
      spacer(),
      sectionHeading("Банковские реквизиты заказчика"),
      dataTable([
        ["Расч. счёт:", data.bankAccount],
        ["Банк:", data.bankName],
        ["БИК:", data.bik],
        ["Корр. счёт:", data.corrAccount],
      ]),
      spacer(),
      sectionHeading("Предмет договора"),
      dataTable([
        ["Адрес объекта:", data.objectAddress],
        ["Предмет:", data.subject],
      ]),
      spacer(),
      sectionHeading("Финансовые условия"),
      dataTable([
        ["Стоимость:", data.amount],
        ["Предоплата:", data.prepayment],
        ["Срок выполнения:", data.deadline],
      ]),
      ...(data.notes?.trim()
        ? [
            spacer(),
            sectionHeading("Примечания"),
            new Paragraph({
              children: [new TextRun({ text: data.notes, size: 18, font: "Times New Roman", color: "374151" })],
            }),
          ]
        : []),
      spacer(),
      new Paragraph({
        children: [
          new TextRun({
            text: "Шаблон договора ещё не загружен. Настройте его в разделе «Договора → Шаблон» в панели управления.",
            size: 16,
            font: "Times New Roman",
            color: "0ea5e9",
            italics: true,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 240 },
      }),
    ];
  }

  const footerParagraph = new Paragraph({
    children: [
      new TextRun({
        text: "razrabotka-agr.ru  ·  office@razrabotka-agr.ru  ·  +7 (495) 568-18-77",
        size: 14,
        font: "Times New Roman",
        color: "94a3b8",
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: 480 },
    border: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "cbd5e1" },
    },
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.2),
              right: convertInchesToTwip(1),
            },
          },
        },
        children: [
          ...headerParagraphs,
          ...(bodyChildren as Paragraph[]),
          footerParagraph,
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
