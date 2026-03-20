import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

export function generateReportPDF(
  incidents: Incident[],
  typeCounts: TypeCount[],
  urgencyCounts: UrgencyCounts,
  dateRange: { start: Date; end: Date },
  period: "week" | "month"
) {
  const doc = new jsPDF();
  const rangeStr = `${format(dateRange.start, "dd/MM/yyyy", { locale: ptBR })} a ${format(dateRange.end, "dd/MM/yyyy", { locale: ptBR })}`;
  const periodLabel = period === "week" ? "Semanal" : "Mensal";

  // Title
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text(`Relatório ${periodLabel} de Incidentes`, 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Período: ${rangeStr}`, 14, 30);
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 14, 36);

  // Summary
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59);
  doc.text("Resumo", 14, 48);

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
    margin: { left: 14, right: 14 },
  });

  // Type ranking
  const afterSummary = (doc as any).lastAutoTable?.finalY || 75;
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59);
  doc.text("Tipos Mais Recorrentes", 14, afterSummary + 12);

  autoTable(doc, {
    startY: afterSummary + 16,
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
    margin: { left: 14, right: 14 },
  });

  // Incident details
  const afterTypes = (doc as any).lastAutoTable?.finalY || 120;
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59);
  doc.text("Detalhes dos Incidentes", 14, afterTypes + 12);

  autoTable(doc, {
    startY: afterTypes + 16,
    head: [["Data", "Professor", "Tipo", "Urgência", "Descrição", "Solução", "Status"]],
    body: incidents.map((inc) => [
      format(new Date(inc.createdAt), "dd/MM HH:mm"),
      inc.teacherName,
      inc.problemType,
      inc.urgency,
      inc.description.length > 60 ? inc.description.slice(0, 60) + "…" : inc.description,
      inc.solution ? (inc.solution.length > 40 ? inc.solution.slice(0, 40) + "…" : inc.solution) : "—",
      inc.resolved ? "Resolvido" : "Pendente",
    ]),
    theme: "striped",
    headStyles: { fillColor: [59, 130, 246], fontSize: 7 },
    bodyStyles: { fontSize: 7 },
    columnStyles: {
      4: { cellWidth: 50 },
      5: { cellWidth: 35 },
    },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`KoL - Registro de Incidentes | Página ${i} de ${pageCount}`, 14, doc.internal.pageSize.height - 10);
  }

  doc.save(`relatorio-${period === "week" ? "semanal" : "mensal"}-${format(dateRange.start, "yyyy-MM-dd")}.pdf`);
}
