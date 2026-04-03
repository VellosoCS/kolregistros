export type ProblemType = "Suporte" | "Didático" | "Plataforma" | "Aluno" | "Administrativo" | "Financeiro" | "Dúvida" | "Ocorrência";
export type InternalProblemType = string; // Will be defined later
export type UrgencyLevel = "Baixa" | "Média" | "Alta";
export type IncidentMode = "professor" | "interno";

export interface Incident {
  id: string;
  teacherName: string;
  coordinator: string;
  problemType: ProblemType | string;
  urgency: UrgencyLevel;
  description: string;
  solution: string;
  needsFollowUp: boolean;
  resolved: boolean;
  imageUrls: string[];
  createdAt: Date;
  resolvedAt: Date | null;
  incidentMode: IncidentMode;
}

export const PROBLEM_TYPES: ProblemType[] = ["Suporte", "Didático", "Plataforma", "Aluno", "Administrativo", "Financeiro", "Dúvida", "Ocorrência"];
export const INTERNAL_PROBLEM_TYPES: string[] = ["Mês de análise", "No-Show", "Muitas pendências", "Muitas faltas", "Reclamação", "Profissionalismo", "Organização", "Erros de lançamento"];
export const URGENCY_LEVELS: UrgencyLevel[] = ["Baixa", "Média", "Alta"];
