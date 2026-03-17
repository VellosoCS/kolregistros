import { useState, useRef, useEffect, useCallback } from "react";
import { Incident, ProblemType, UrgencyLevel, PROBLEM_TYPES, URGENCY_LEVELS, COORDINATORS, Coordinator } from "@/lib/types";
import { Monitor, BookOpen, LayoutGrid, Users, Briefcase, DollarSign } from "lucide-react";

const PROBLEM_ICONS: Record<ProblemType, React.ReactNode> = {
  "Técnico": <Monitor className="w-3.5 h-3.5" />,
  "Didático": <BookOpen className="w-3.5 h-3.5" />,
  "Plataforma": <LayoutGrid className="w-3.5 h-3.5" />,
  "Aluno": <Users className="w-3.5 h-3.5" />,
  "Administrativo": <Briefcase className="w-3.5 h-3.5" />,
  "Financeiro": <DollarSign className="w-3.5 h-3.5" />,
};

interface IncidentFormProps {
  onSubmit: (incident: Incident) => void;
}

export default function IncidentForm({ onSubmit }: IncidentFormProps) {
  const [teacherName, setTeacherName] = useState("");
  const [coordinator, setCoordinator] = useState<Coordinator>("Caio");
  const [problemType, setProblemType] = useState<ProblemType>("Técnico");
  const [urgency, setUrgency] = useState<UrgencyLevel>("Baixa");
  const [description, setDescription] = useState("");
  const [solution, setSolution] = useState("");
  const [needsFollowUp, setNeedsFollowUp] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    setTeacherName("");
    setCoordinator("Caio");
    setProblemType("Técnico");
    setUrgency("Baixa");
    setDescription("");
    setSolution("");
    setNeedsFollowUp(false);
    firstInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        firstInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim() || !description.trim()) return;

    const incident: Incident = {
      id: crypto.randomUUID(),
      teacherName: teacherName.trim(),
      coordinator,
      problemType,
      urgency,
      description: description.trim(),
      solution: solution.trim(),
      needsFollowUp,
      createdAt: new Date(),
    };

    onSubmit(incident);
    resetForm();
  };

  return (
    <div className="p-1 bg-secondary rounded-xl">
      <form
        onSubmit={handleSubmit}
        className="bg-card p-5 rounded-lg shadow-card space-y-4"
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-heading text-card-foreground">Novo Incidente</h2>
          <kbd className="text-[10px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
            ⌘N
          </kbd>
        </div>

        {/* Teacher Name */}
        <div className="space-y-1.5">
          <label className="label-text">Professor</label>
          <input
            ref={firstInputRef}
            type="text"
            value={teacherName}
            onChange={(e) => setTeacherName(e.target.value)}
            className="w-full px-3 py-2 bg-input text-body text-foreground rounded-md focus:ring-2 ring-ring outline-none transition-all placeholder:text-muted-foreground"
            placeholder="Ex: John Doe"
            autoComplete="off"
          />
        </div>

        {/* Coordinator */}
        <div className="space-y-1.5">
          <label className="label-text">Coordenador</label>
          <div className="flex gap-2">
            {COORDINATORS.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setCoordinator(name)}
                className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
                  coordinator === name
                    ? "bg-primary text-primary-foreground shadow-primary-glow"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Problem Type */}
        <div className="space-y-1.5">
          <label className="label-text">Tipo de Problema</label>
          <div className="grid grid-cols-2 gap-1.5">
            {PROBLEM_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setProblemType(type)}
                className={`flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-md transition-all ${
                  problemType === type
                    ? "bg-primary text-primary-foreground shadow-primary-glow"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                {PROBLEM_ICONS[type]}
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Urgency */}
        <div className="space-y-1.5">
          <label className="label-text">Urgência</label>
          <div className="flex gap-2">
            {URGENCY_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setUrgency(level)}
                className={`flex-1 py-2 text-xs font-medium rounded-md border-2 transition-all ${
                  urgency === level
                    ? level === "Alta"
                      ? "border-urgency-high bg-urgency-high-bg text-urgency-high"
                      : level === "Média"
                      ? "border-urgency-medium bg-urgency-medium-bg text-urgency-medium"
                      : "border-urgency-low bg-urgency-low-bg text-urgency-low"
                    : "border-transparent bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="label-text">Descrição</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-input text-body text-foreground rounded-md focus:ring-2 ring-ring outline-none transition-all placeholder:text-muted-foreground resize-y"
            placeholder="O que aconteceu?"
          />
        </div>

        {/* Solution */}
        <div className="space-y-1.5">
          <label className="label-text">Solução aplicada</label>
          <textarea
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-input text-body text-foreground rounded-md focus:ring-2 ring-ring outline-none transition-all placeholder:text-muted-foreground resize-y"
            placeholder="O que foi feito?"
          />
        </div>

        {/* Follow-up Toggle */}
        <div className="flex items-center justify-between py-1">
          <label className="text-body text-foreground font-medium">
            Precisa de acompanhamento?
          </label>
          <button
            type="button"
            role="switch"
            aria-checked={needsFollowUp}
            onClick={() => setNeedsFollowUp(!needsFollowUp)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
              needsFollowUp ? "bg-primary" : "bg-secondary"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-card shadow-card ring-0 transition-transform mt-0.5 ${
                needsFollowUp ? "translate-x-[22px]" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-md shadow-primary-glow hover:brightness-110 active:scale-[0.98] transition-all"
        >
          Registrar Incidente
        </button>
      </form>
    </div>
  );
}
