// jspdf and jspdf-autotable are dynamically imported for performance
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

async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateReportPDF(
  incidents: Incident[],
  typeCounts: TypeCount[],
  urgencyCounts: UrgencyCounts,
  dateRange: { start: Date; end: Date },
  period: "week" | "month"
) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF();
  const rangeStr = `${format(dateRange.start, "dd/MM/yyyy", { locale: ptBR })} a ${format(dateRange.end, "dd/MM/yyyy", { locale: ptBR })}`;
  const periodLabel = period === "week" ? "Semanal" : "Mensal";
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const marginLeft = 14;
  const marginRight = 14;
  const contentWidth = pageWidth - marginLeft - marginRight;

  // Title
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text(`Relatório ${periodLabel} de Incidentes`, marginLeft, 22);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Período: ${rangeStr}`, marginLeft, 30);
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, marginLeft, 36);

  // Summary
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59);
  doc.text("Resumo", marginLeft, 48);

  const resolved = incidents.filter((i) => i.resolved).length;
  const pending = incidents.filter((i) => !i.resolved).length;
  const followUp = incidents.filter((i) => i.needsFollowUp && !i.resolved).length;

  autoTable(doc, {
    startY: 52,
    head: [["Total", "Resolvidos", "Pendentes", "Acompanhamento", "Alta", "Média", "Baixa"]],
    body: [[incidents.length, resolved, pending, followUp, urgencyCounts.alta, urgencyCounts.media, urgencyCounts.baixa]],
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
    bodyStyles: { fontSize: 10, halign: "center" },
    margin: { left: marginLeft, right: marginRight },
  });

  // Type ranking
  let cursorY = (doc as any).lastAutoTable?.finalY || 75;
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59);
  doc.text("Tipos Mais Recorrentes", marginLeft, cursorY + 12);

  autoTable(doc, {
    startY: cursorY + 16,
    head: [["#", "Tipo", "Quantidade", "%"]],
    body: typeCounts.map((tc, i) => [
      i + 1,
      tc.type,
      tc.count,
      incidents.length > 0 ? `${Math.round((tc.count / incidents.length) * 100)}%` : "0%",
    ]),
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: marginLeft, right: marginRight },
  });

  // Incident details with images
  cursorY = (doc as any).lastAutoTable?.finalY || 120;
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59);
  doc.text("Detalhes dos Incidentes", marginLeft, cursorY + 12);
  cursorY += 20;

  function ensureSpace(needed: number) {
    if (cursorY + needed > pageHeight - 20) {
      doc.addPage();
      cursorY = 20;
    }
  }

  for (let idx = 0; idx < incidents.length; idx++) {
    const inc = incidents[idx];

    // Estimate space needed for text (~80px min)
    ensureSpace(80);

    // Incident header with blue line
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, cursorY, pageWidth - marginRight, cursorY);
    cursorY += 6;

    doc.setFontSize(11);
    doc.setTextColor(59, 130, 246);
    doc.text(`Incidente ${idx + 1}: ${inc.problemType}`, marginLeft, cursorY);
    cursorY += 6;

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `${format(new Date(inc.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })} | ${inc.teacherName} | ${inc.coordinator} | ${inc.urgency} | ${inc.resolved ? "Resolvido" : "Pendente"}${inc.needsFollowUp ? " | Acompanhamento" : ""}`,
      marginLeft,
      cursorY
    );
    cursorY += 7;

    // Description
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.text("Descrição:", marginLeft, cursorY);
    cursorY += 5;
    doc.setFont("helvetica", "normal");
    const descLines = doc.splitTextToSize(inc.description, contentWidth);
    for (const line of descLines) {
      ensureSpace(6);
      doc.text(line, marginLeft, cursorY);
      cursorY += 4.5;
    }
    cursorY += 3;

    // Solution
    ensureSpace(10);
    doc.setFont("helvetica", "bold");
    doc.text("Solução:", marginLeft, cursorY);
    cursorY += 5;
    doc.setFont("helvetica", "normal");
    const solText = inc.solution || "Nenhuma registrada";
    const solLines = doc.splitTextToSize(solText, contentWidth);
    for (const line of solLines) {
      ensureSpace(6);
      doc.text(line, marginLeft, cursorY);
      cursorY += 4.5;
    }
    cursorY += 3;

    // Images
    if (inc.imageUrls && inc.imageUrls.length > 0) {
      ensureSpace(15);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(`Imagens anexadas (${inc.imageUrls.length}):`, marginLeft, cursorY);
      cursorY += 6;
      doc.setFont("helvetica", "normal");

      const imageDataUrls = await Promise.all(inc.imageUrls.map((url) => fetchImageAsDataUrl(url)));

      const imgWidth = 60;
      const imgHeight = 45;
      let xOffset = marginLeft;

      for (let imgIdx = 0; imgIdx < imageDataUrls.length; imgIdx++) {
        const dataUrl = imageDataUrls[imgIdx];

        // Wrap to next row if needed
        if (xOffset + imgWidth > pageWidth - marginRight) {
          xOffset = marginLeft;
          cursorY += imgHeight + 4;
        }

        ensureSpace(imgHeight + 4);

        if (dataUrl) {
          try {
            doc.addImage(dataUrl, xOffset, cursorY, imgWidth, imgHeight);
          } catch {
            doc.setFontSize(7);
            doc.setTextColor(148, 163, 184);
            doc.text(`[Imagem ${imgIdx + 1} não disponível]`, xOffset, cursorY + 10);
          }
        } else {
          doc.setFontSize(7);
          doc.setTextColor(148, 163, 184);
          doc.text(`[Imagem ${imgIdx + 1} não disponível]`, xOffset, cursorY + 10);
        }

        xOffset += imgWidth + 6;
      }

      cursorY += imgHeight + 6;
    }

    cursorY += 6;
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`KoL - Registro de Incidentes | Página ${i} de ${pageCount}`, marginLeft, pageHeight - 10);
  }

  doc.save(`relatorio-${period === "week" ? "semanal" : "mensal"}-${format(dateRange.start, "yyyy-MM-dd")}.pdf`);
}
