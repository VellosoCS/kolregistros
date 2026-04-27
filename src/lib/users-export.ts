import * as XLSX from "xlsx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { UserRow } from "@/hooks/use-all-users";

const ROLE_LABELS: Record<string, string> = {
  coordenacao: "Coordenação",
  suporte: "Suporte",
  suporte_aluno: "Suporte ao Aluno",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
};

function fmtDate(value: string | null): string {
  if (!value) return "";
  try {
    return format(new Date(value), "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch {
    return "";
  }
}

function buildRows(users: UserRow[]) {
  return users.map((u) => ({
    Nome: u.display_name || "",
    Email: u.email,
    Papel: u.role ? ROLE_LABELS[u.role] || u.role : "",
    Status: STATUS_LABELS[u.status] || u.status,
    "Data de cadastro": fmtDate(u.created_at),
    "Aprovado em": fmtDate(u.approved_at),
    "Aprovado por": u.approved_by_name || "",
    "Último acesso": u.last_sign_in_at ? fmtDate(u.last_sign_in_at) : "Nunca acessou",
  }));
}

function fileBaseName() {
  return `usuarios_kol_${format(new Date(), "yyyy-MM-dd")}`;
}

export function exportUsersToXlsx(users: UserRow[]) {
  const rows = buildRows(users);
  const ws = XLSX.utils.json_to_sheet(rows);

  // Larguras de coluna
  ws["!cols"] = [
    { wch: 28 }, // Nome
    { wch: 32 }, // Email
    { wch: 18 }, // Papel
    { wch: 12 }, // Status
    { wch: 18 }, // Cadastro
    { wch: 18 }, // Aprovado em
    { wch: 24 }, // Aprovado por
    { wch: 20 }, // Último acesso
  ];
  ws["!autofilter"] = { ref: ws["!ref"] || "A1" };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Usuários");
  XLSX.writeFile(wb, `${fileBaseName()}.xlsx`);
}

export function exportUsersToCsv(users: UserRow[]) {
  const rows = buildRows(users);
  const ws = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws, { FS: ";" });
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileBaseName()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
