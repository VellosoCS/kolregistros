export type ProblemType = "Técnico" | "Didático" | "Plataforma" | "Aluno" | "Administrativo" | "Financeiro";
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

export const PROBLEM_TYPES: ProblemType[] = ["Técnico", "Didático", "Plataforma", "Aluno", "Administrativo", "Financeiro"];
export const URGENCY_LEVELS: UrgencyLevel[] = ["Baixa", "Média", "Alta"];
