export type ProblemType = "Técnico" | "Didático" | "Plataforma" | "Aluno" | "Administrativo" | "Financeiro";
export type UrgencyLevel = "Baixa" | "Média" | "Alta";

export const COORDINATORS = ["Caio", "Ariel", "João Marcos"] as const;
export type Coordinator = (typeof COORDINATORS)[number];

export interface Incident {
  id: string;
  teacherName: string;
  coordinator: Coordinator;
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
