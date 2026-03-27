import { Incident, ProblemType } from "./types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TypeCount {
  type: ProblemType;
  count: number;
}

interface UrgencyCounts {
  alta: number;
  media: number;
  baixa: number;
}

export async function generateReportDOCX(
  incidents: Incident[],
  typeCounts: TypeCount[],
  urgencyCounts: UrgencyCounts,
  dateRange: { start: Date; end: Date },
  period: "week" | "month"
) {
  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    AlignmentType, WidthType, ShadingType, BorderStyle, HeadingLevel, PageBreak,
    ImageRun,
  } = await import("docx");
  const { saveAs } = await import("file-saver");

  const rangeStr = `${format(dateRange.start, "dd/MM/yyyy", { locale: ptBR })} a ${format(dateRange.end, "dd/MM/yyyy", { locale: ptBR })}`;
  const periodLabel = period === "week" ? "Semanal" : "Mensal";
  const resolved = incidents.filter((i) => i.resolved).length;
  const pending = incidents.filter((i) => !i.resolved).length;
  const followUp = incidents.filter((i) => i.needsFollowUp && !i.resolved).length;

  const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
  const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
  const cellMargins = { top: 60, bottom: 60, left: 100, right: 100 };

  const headerCell = (text: string, width: number) =>
    new TableCell({
      borders,
      width: { size: width, type: WidthType.DXA },
      shading: { fill: "3B82F6", type: ShadingType.CLEAR },
      margins: cellMargins,
      children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 18, font: "Arial" })] })],
    });

  const dataCell = (text: string, width: number) =>
    new TableCell({
      borders,
      width: { size: width, type: WidthType.DXA },
      margins: cellMargins,
      children: [new Paragraph({ children: [new TextRun({ text, size: 18, font: "Arial" })] })],
    });

  // Summary table
  const summaryHeaders = ["Total", "Resolvidos", "Pendentes", "Acompanhamento", "Alta", "Média", "Baixa"];
  const summaryValues = [
    String(incidents.length), String(resolved), String(pending), String(followUp),
    String(urgencyCounts.alta), String(urgencyCounts.media), String(urgencyCounts.baixa),
  ];
  const colW = Math.floor(9360 / 7);

  const summaryTable = new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: Array(7).fill(colW),
    rows: [
      new TableRow({ children: summaryHeaders.map((h) => headerCell(h, colW)) }),
      new TableRow({ children: summaryValues.map((v) => dataCell(v, colW)) }),
    ],
  });

  // Type ranking table
  const typeColWidths = [600, 2500, 1500, 1500];
  const typeTable = new Table({
    width: { size: 6100, type: WidthType.DXA },
    columnWidths: typeColWidths,
    rows: [
      new TableRow({ children: ["#", "Tipo", "Qtd", "%"].map((h, i) => headerCell(h, typeColWidths[i])) }),
      ...typeCounts.map((tc, i) =>
        new TableRow({
          children: [
            dataCell(String(i + 1), typeColWidths[0]),
            dataCell(tc.type, typeColWidths[1]),
            dataCell(String(tc.count), typeColWidths[2]),
            dataCell(incidents.length > 0 ? `${Math.round((tc.count / incidents.length) * 100)}%` : "0%", typeColWidths[3]),
          ],
        })
      ),
    ],
  });

  // Helper to fetch image as ArrayBuffer
  async function fetchImageBuffer(url: string): Promise<{ buffer: ArrayBuffer; type: string } | null> {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const contentType = res.headers.get("content-type") || "image/png";
      const buffer = await res.arrayBuffer();
      return { buffer, type: contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "png" };
    } catch {
      return null;
    }
  }

  // Incident detail sections (async to fetch images)
  const incidentSections: InstanceType<typeof Paragraph>[] = [];

  for (let idx = 0; idx < incidents.length; idx++) {
    const inc = incidents[idx];
    const statusText = inc.resolved ? "✅ Resolvido" : "⏳ Pendente";
    const followUpText = inc.needsFollowUp ? "Sim" : "Não";

    incidentSections.push(
      new Paragraph({
        spacing: { before: idx > 0 ? 300 : 0 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "3B82F6", space: 4 } },
        children: [
          new TextRun({ text: `Incidente ${idx + 1}: `, bold: true, size: 22, font: "Arial", color: "3B82F6" }),
          new TextRun({ text: inc.problemType, bold: true, size: 22, font: "Arial" }),
        ],
      }),
      field("Data", format(new Date(inc.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })),
      field("Professor", inc.teacherName),
      field("Responsável", inc.coordinator),
      field("Urgência", inc.urgency),
      field("Status", statusText),
      field("Acompanhamento", followUpText),
      new Paragraph({ spacing: { before: 100 }, children: [new TextRun({ text: "Descrição:", bold: true, size: 20, font: "Arial" })] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: inc.description, size: 20, font: "Arial" })] }),
      new Paragraph({ children: [new TextRun({ text: "Solução:", bold: true, size: 20, font: "Arial" })] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: inc.solution || "Nenhuma registrada", size: 20, font: "Arial" })] }),
    );

    // Add images if present
    if (inc.imageUrls && inc.imageUrls.length > 0) {
      incidentSections.push(
        new Paragraph({ spacing: { before: 100 }, children: [new TextRun({ text: `Imagens anexadas (${inc.imageUrls.length}):`, bold: true, size: 20, font: "Arial" })] }),
      );

      const imageResults = await Promise.all(inc.imageUrls.map((url) => fetchImageBuffer(url)));

      for (let imgIdx = 0; imgIdx < imageResults.length; imgIdx++) {
        const imgData = imageResults[imgIdx];
        if (imgData) {
          incidentSections.push(
            new Paragraph({
              spacing: { before: 80, after: 80 },
              children: [
                new ImageRun({
                  type: imgData.type as "jpg" | "png",
                  data: imgData.buffer,
                  transformation: { width: 300, height: 225 },
                  altText: {
                    title: `Imagem ${imgIdx + 1}`,
                    description: `Anexo ${imgIdx + 1} do incidente ${idx + 1}`,
                    name: `image-${idx}-${imgIdx}`,
                  },
                }),
              ],
            }),
          );
        } else {
          incidentSections.push(
            new Paragraph({
              children: [new TextRun({ text: `[Imagem ${imgIdx + 1} não disponível]`, italics: true, size: 18, font: "Arial", color: "94A3B8" })],
            }),
          );
        }
      }
    }

    incidentSections.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
  }

  function field(label: string, value: string) {
    return new Paragraph({
      spacing: { before: 40 },
      children: [
        new TextRun({ text: `${label}: `, bold: true, size: 20, font: "Arial" }),
        new TextRun({ text: value, size: 20, font: "Arial" }),
      ],
    });
  }

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 20 } } },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: [
          new Paragraph({
            children: [new TextRun({ text: `Relatório ${periodLabel} de Incidentes`, bold: true, size: 36, font: "Arial", color: "1E293B" })],
          }),
          new Paragraph({
            spacing: { after: 100 },
            children: [new TextRun({ text: `Período: ${rangeStr}`, size: 20, font: "Arial", color: "64748B" })],
          }),
          new Paragraph({
            spacing: { after: 300 },
            children: [new TextRun({ text: `Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, size: 20, font: "Arial", color: "64748B" })],
          }),

          new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: "Resumo", bold: true, size: 26, font: "Arial", color: "1E293B" })] }),
          summaryTable,

          new Paragraph({ spacing: { before: 400, after: 100 }, children: [new TextRun({ text: "Tipos Mais Recorrentes", bold: true, size: 26, font: "Arial", color: "1E293B" })] }),
          typeTable,

          new Paragraph({ spacing: { before: 400, after: 200 }, children: [new TextRun({ text: "Detalhes dos Incidentes", bold: true, size: 26, font: "Arial", color: "1E293B" })] }),
          ...incidentSections,

          new Paragraph({
            spacing: { before: 600 },
            children: [new TextRun({ text: "KoL - Registro de Incidentes", size: 16, font: "Arial", color: "94A3B8" })],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `relatorio-${period === "week" ? "semanal" : "mensal"}-${format(dateRange.start, "yyyy-MM-dd")}.docx`);
}
