import { useState, useCallback } from "react";
import { Incident, ProblemType } from "@/lib/types";
import { toast } from "sonner";

export function useIncidentSelection(incidents: Incident[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback((pageItems: Incident[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = pageItems.length > 0 && pageItems.every((i) => next.has(i.id));
      if (allSelected) {
        pageItems.forEach((i) => next.delete(i.id));
      } else {
        pageItems.forEach((i) => next.add(i.id));
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const getSelectedReportData = useCallback(() => {
    const selected = incidents.filter((i) => selectedIds.has(i.id));
    if (selected.length === 0) return null;
    const typeCounts: Record<string, number> = {};
    selected.forEach((i) => (typeCounts[i.problemType] = (typeCounts[i.problemType] || 0) + 1));
    const typeCountsArr = Object.entries(typeCounts)
      .map(([type, count]) => ({ type: type as ProblemType, count }))
      .sort((a, b) => b.count - a.count);
    const urgencyCounts = {
      alta: selected.filter((i) => i.urgency === "Alta").length,
      media: selected.filter((i) => i.urgency === "Média").length,
      baixa: selected.filter((i) => i.urgency === "Baixa").length,
    };
    const dates = selected.map((i) => new Date(i.createdAt).getTime());
    const dateRange = { start: new Date(Math.min(...dates)), end: new Date(Math.max(...dates)) };
    return { selected, typeCountsArr, urgencyCounts, dateRange };
  }, [incidents, selectedIds]);

  const handleBatchPDF = useCallback(async () => {
    const data = getSelectedReportData();
    if (!data) return;
    const { generateReportPDF } = await import("@/lib/report-pdf");
    generateReportPDF(data.selected, data.typeCountsArr, data.urgencyCounts, data.dateRange, "week");
    toast.success(`Relatório PDF gerado com ${data.selected.length} incidente(s)`);
  }, [getSelectedReportData]);

  const handleBatchDOCX = useCallback(async () => {
    const data = getSelectedReportData();
    if (!data) return;
    const { generateReportDOCX } = await import("@/lib/report-docx");
    generateReportDOCX(data.selected, data.typeCountsArr, data.urgencyCounts, data.dateRange, "week");
    toast.success(`Relatório Word gerado com ${data.selected.length} incidente(s)`);
  }, [getSelectedReportData]);

  return {
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    handleBatchPDF,
    handleBatchDOCX,
  };
}
