export type ProblemType = "Técnico" | "Didático" | "Plataforma" | "Aluno" | "Administrativo" | "Financeiro";
export type UrgencyLevel = "Baixa" | "Média" | "Alta";

export interface Incident {
  id: string;
  teacherName: string;
  problemType: ProblemType;
  urgency: UrgencyLevel;
  description: string;
  solution: string;
  needsFollowUp: boolean;
  createdAt: Date;
}

export const PROBLEM_TYPES: ProblemType[] = ["Técnico", "Didático", "Plataforma", "Aluno", "Administrativo"];
export const URGENCY_LEVELS: UrgencyLevel[] = ["Baixa", "Média", "Alta"];
