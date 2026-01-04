import { Paragraph, TextRun, TableRow, TableCell } from "docx";

/**
 * Helper functions for Word document generation
 */

export function boldParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true })],
  });
}

export function italicParagraph(text: string, options: any = {}): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, italics: true })],
    ...options,
  });
}

export function createHeaderRow(headers: string[], color: string = "2563EB"): TableRow {
  return new TableRow({
    children: headers.map(
      (header) =>
        new TableCell({
          children: [boldParagraph(header)],
          shading: { fill: color },
        })
    ),
  });
}

export function createDataRow(data: string[]): TableRow {
  return new TableRow({
    children: data.map((item) => new TableCell({ children: [new Paragraph(item)] })),
  });
}

export function createCalculationTables(calculations: any): Paragraph[] {
  // For now, return empty array - can be expanded with specific calculation tables
  return [
    new Paragraph({
      children: [
        new TextRun({ text: "Calculation tables will be populated here.", italics: true }),
      ],
    }),
  ];
}
