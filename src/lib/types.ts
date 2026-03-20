export type ProblemType = "Suporte" | "Didático" | "Plataforma" | "Aluno" | "Administrativo" | "Financeiro" | "Dúvida" | "Ocorrência";
export type UrgencyLevel = "Baixa" | "Média" | "Alta";

export interface Incident {
  id: string;
  teacherName: string;
  coordinator: string;
  problemType: ProblemType;
  urgency: UrgencyLevel;
  description: string;
  solution: string;
  needsFollowUp: boolean;
  resolved: boolean;
  imageUrls: string[];
  createdAt: Date;
}

export const PROBLEM_TYPES: ProblemType[] = ["Suporte", "Didático", "Plataforma", "Aluno", "Administrativo", "Financeiro", "Dúvida", "Ocorrência"];
export const URGENCY_LEVELS: UrgencyLevel[] = ["Baixa", "Média", "Alta"];
