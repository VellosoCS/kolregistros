import {
  Handshake, BookOpen, LayoutGrid, Users, Briefcase, DollarSign,
  HelpCircle, FileWarning, AlertTriangle, XCircle, ClipboardList,
  CalendarX, MessageSquareWarning, UserCheck, FolderKanban, PenLine,
  EyeOff, Shield, FolderOpen,
} from "lucide-react";
import { ProblemType } from "./types";

/** Icons for professor-mode problem types (small 3.5) */
export const PROBLEM_ICONS: Record<ProblemType, React.ReactNode> = {
  "Suporte": <Handshake className="w-3.5 h-3.5" />,
  "Didático": <BookOpen className="w-3.5 h-3.5" />,
  "Plataforma": <LayoutGrid className="w-3.5 h-3.5" />,
  "Aluno": <Users className="w-3.5 h-3.5" />,
  "Administrativo": <Briefcase className="w-3.5 h-3.5" />,
  "Financeiro": <DollarSign className="w-3.5 h-3.5" />,
  "Dúvida": <HelpCircle className="w-3.5 h-3.5" />,
  "Ocorrência": <FileWarning className="w-3.5 h-3.5" />,
};

/** Icons for internal-mode problem types (small 3.5) */
export const INTERNAL_PROBLEM_ICONS: Record<string, React.ReactNode> = {
  "Mês de análise": <AlertTriangle className="w-3.5 h-3.5 shrink-0" />,
  "No-Show": <XCircle className="w-3.5 h-3.5 shrink-0" />,
  "Muitas pendências": <ClipboardList className="w-3.5 h-3.5 shrink-0" />,
  "Muitas faltas": <CalendarX className="w-3.5 h-3.5 shrink-0" />,
  "Reclamação": <MessageSquareWarning className="w-3.5 h-3.5 shrink-0" />,
  "Profissionalismo": <UserCheck className="w-3.5 h-3.5 shrink-0" />,
  "Organização": <FolderKanban className="w-3.5 h-3.5 shrink-0" />,
  "Erros de lançamento": <PenLine className="w-3.5 h-3.5 shrink-0" />,
};

/** Combined icons at size w-4 h-4 for reports and larger displays */
export const ALL_PROBLEM_ICONS: Record<string, React.ReactNode> = {
  "Suporte": <Handshake className="w-4 h-4" />,
  "Didático": <BookOpen className="w-4 h-4" />,
  "Plataforma": <LayoutGrid className="w-4 h-4" />,
  "Aluno": <Users className="w-4 h-4" />,
  "Administrativo": <Briefcase className="w-4 h-4" />,
  "Financeiro": <DollarSign className="w-4 h-4" />,
  "Dúvida": <HelpCircle className="w-4 h-4" />,
  "Ocorrência": <FileWarning className="w-4 h-4" />,
  "Mês de análise": <AlertTriangle className="w-4 h-4" />,
  "No-Show": <EyeOff className="w-4 h-4" />,
  "Muitas pendências": <ClipboardList className="w-4 h-4" />,
  "Muitas faltas": <CalendarX className="w-4 h-4" />,
  "Reclamação": <MessageSquareWarning className="w-4 h-4" />,
  "Profissionalismo": <Shield className="w-4 h-4" />,
  "Organização": <FolderOpen className="w-4 h-4" />,
  "Erros de lançamento": <PenLine className="w-4 h-4" />,
};

/** Descriptions for professor-mode problem types */
export const PROBLEM_DESCRIPTIONS: Record<ProblemType, string> = {
  "Suporte": "Incidentes relacionados ou trazidos pelo suporte ao aluno/suporte ao professor",
  "Didático": "Incidentes relacionados ao material didático ou metodologia do professor",
  "Plataforma": "Incidentes relacionados a plataforma",
  "Aluno": "Incidentes relacionados a questões dos alunos",
  "Administrativo": "Incidentes relacionados a processos internos da escola",
  "Financeiro": "Incidentes relacionados a processos financeiros ou salário dos professores",
  "Dúvida": "Incidentes relacionados a dúvidas pelo Whatsapp ou Plantão de Dúvidas",
  "Ocorrência": "Incidentes gerais para conhecimento futuro",
};

/** Descriptions for internal-mode problem types */
export const INTERNAL_PROBLEM_DESCRIPTIONS: Record<string, string> = {
  "Mês de análise": "Período de avaliação de desempenho do professor",
  "No-Show": "Professor não compareceu à aula sem aviso prévio",
  "Muitas pendências": "Acúmulo de tarefas ou entregas em atraso",
  "Muitas faltas": "Frequência de ausências acima do aceitável",
  "Reclamação": "Reclamações recebidas sobre o professor",
  "Profissionalismo": "Questões relacionadas à conduta profissional",
  "Organização": "Problemas de organização ou planejamento",
  "Erros de lançamento": "Erros em lançamentos de notas ou frequência",
};
