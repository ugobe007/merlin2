// Helper utilities for Word document generation with docx library

import { Paragraph, TextRun, Table, TableRow, TableCell, WidthType } from "docx";
import type { IParagraphOptions } from "docx";
import type { CalculationBreakdown } from './calculationFormulas';

/**
 * Create a paragraph with bold text
 */
export const boldParagraph = (text: string, options?: Partial<IParagraphOptions>): Paragraph => {
  return new Paragraph({
    ...options,
    children: [
      new TextRun({
        text,
        bold: true,
      }),
    ],
  });
};

/**
 * Create a paragraph with italic text
 */
export const italicParagraph = (text: string, options?: Partial<IParagraphOptions>): Paragraph => {
  return new Paragraph({
    ...options,
    children: [
      new TextRun({
        text,
        italics: true,
      }),
    ],
  });
};

/**
 * Create a table header row with shading
 */
export const createHeaderRow = (headers: string[], shadeColor: string = "9333EA"): TableRow => {
  return new TableRow({
    children: headers.map(
      (header) =>
        new TableCell({
          children: [boldParagraph(header)],
          shading: { fill: shadeColor },
        })
    ),
  });
};

/**
 * Create a standard table data row
 */
export const createDataRow = (cells: string[]): TableRow => {
  return new TableRow({
    children: cells.map((cell) => new TableCell({ children: [new Paragraph(cell)] })),
  });
};

/**
 * Create a highlighted row (for totals, etc.)
 */
export const createHighlightRow = (cells: string[], shadeColor: string): TableRow => {
  return new TableRow({
    children: cells.map(
      (cell) =>
        new TableCell({
          children: [boldParagraph(cell)],
          shading: { fill: shadeColor },
        })
    ),
  });
};

/**
 * Create calculation appendix tables from calculation breakdown
 * Simplified version showing only formulas used
 */
export const createCalculationTables = (calculations: CalculationBreakdown[]): (Paragraph | Table)[] => {
  const content: (Paragraph | Table)[] = [];

  // Group by section
  const groupedCalcs = calculations.reduce((acc, calc) => {
    if (!acc[calc.section]) acc[calc.section] = [];
    acc[calc.section].push(calc);
    return acc;
  }, {} as Record<string, CalculationBreakdown[]>);

  // Create content for each section
  Object.entries(groupedCalcs).forEach(([section, calcs]) => {
    content.push(
      new Paragraph({
        text: section,
        heading: 2 as any,
        spacing: { before: 300, after: 150 },
      })
    );

    // Create a simple table of formulas
    const formulaRows = [
      new TableRow({
        children: [
          new TableCell({
            children: [boldParagraph("Calculation")],
            shading: { fill: "2563EB" }, // Blue-600 matching site
            width: { size: 35, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [boldParagraph("Formula")],
            shading: { fill: "2563EB" }, // Blue-600 matching site
            width: { size: 65, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
      ...calcs.map(
        (calc) =>
          new TableRow({
            children: [
              new TableCell({ 
                children: [new Paragraph(calc.category)],
              }),
              new TableCell({
                children: [new Paragraph(calc.formula)],
              }),
            ],
          })
      ),
    ];

    content.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: formulaRows,
      })
    );

    content.push(
      new Paragraph({
        text: "",
        spacing: { after: 200 },
      })
    );
  });

  return content;
};
