import { useState, useRef, useEffect, useCallback } from "react";
import { Incident, ProblemType, UrgencyLevel, PROBLEM_TYPES, URGENCY_LEVELS } from "@/lib/types";
import { Handshake, BookOpen, LayoutGrid, Users, Briefcase, DollarSign, HelpCircle, FileWarning, ImagePlus, X } from "lucide-react";

const PROBLEM_ICONS: Record<ProblemType, React.ReactNode> = {
  "Suporte": <Handshake className="w-3.5 h-3.5" />,
  "Didático": <BookOpen className="w-3.5 h-3.5" />,
  "Plataforma": <LayoutGrid className="w-3.5 h-3.5" />,
  "Aluno": <Users className="w-3.5 h-3.5" />,
  "Administrativo": <Briefcase className="w-3.5 h-3.5" />,
  "Financeiro": <DollarSign className="w-3.5 h-3.5" />,
  "Dúvida": <HelpCircle className="w-3.5 h-3.5" />,
  "Ocorrência": <FileWarning className="w-3.5 h-3.5" />,
};

interface IncidentFormProps {
  onSubmit: (incident: Incident, files: File[]) => void;
}

export default function IncidentForm({ onSubmit }: IncidentFormProps) {
  const [teacherName, setTeacherName] = useState("");
  const [coordinator, setCoordinator] = useState("");
  const [problemType, setProblemType] = useState<ProblemType>("Suporte");
  const [urgency, setUrgency] = useState<UrgencyLevel>("Baixa");
  const [description, setDescription] = useState("");
  const [solution, setSolution] = useState("");
  const [needsFollowUp, setNeedsFollowUp] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ teacherName?: string; coordinator?: string; description?: string }>({});
  const firstInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = useCallback(() => {
    setTeacherName("");
    setCoordinator("");
    setProblemType("Suporte");
    setUrgency("Baixa");
    setDescription("");
    setSolution("");
    setNeedsFollowUp(false);
    setSelectedFiles([]);
    setPreviews([]);
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

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    setSelectedFiles((prev) => [...prev, ...imageFiles]);

    imageFiles.forEach((file) => {
      const url = URL.createObjectURL(file);
      setPreviews((prev) => [...prev, url]);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (!teacherName.trim()) newErrors.teacherName = "Campo obrigatório";
    if (!coordinator.trim()) newErrors.coordinator = "Campo obrigatório";
    if (!description.trim()) newErrors.description = "Campo obrigatório";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const incident: Incident = {
      id: crypto.randomUUID(),
      teacherName: teacherName.trim(),
      coordinator,
      problemType,
      urgency,
      description: description.trim(),
      solution: solution.trim(),
      needsFollowUp,
      resolved: false,
      imageUrls: [],
      createdAt: new Date(),
    };

    onSubmit(incident, selectedFiles);
    resetForm();
  };

  return (
    <div className="p-1 bg-secondary rounded-xl animate-fade-in">
      <form
        onSubmit={handleSubmit}
        className="bg-card p-5 rounded-lg shadow-card space-y-4"
      >
        <div className="flex items-center justify-between mb-1 animate-slide-up">
          <h2 className="text-heading text-card-foreground">Novo Incidente</h2>
          <kbd className="text-[10px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
            ⌘N
          </kbd>
        </div>

        {/* Teacher Name */}
         <div className="space-y-1.5 animate-slide-up" style={{ animationDelay: "0.05s" }}>
          <label className="label-text">Professor<span className="text-destructive ml-0.5">*</span></label>
          <input
            ref={firstInputRef}
            type="text"
            value={teacherName}
            onChange={(e) => { setTeacherName(e.target.value); setErrors((prev) => ({ ...prev, teacherName: undefined })); }}
            className={`w-full px-3 py-2 bg-input text-body text-foreground rounded-md focus:ring-2 ring-ring outline-none transition-all duration-200 placeholder:text-muted-foreground focus:shadow-md ${errors.teacherName ? "ring-2 ring-destructive" : ""}`}
            placeholder="Ex: John Doe"
            autoComplete="off"
          />
          {errors.teacherName && <p className="text-xs text-destructive">{errors.teacherName}</p>}
        </div>

        {/* Responsible */}
        <div className="space-y-1.5 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <label className="label-text">Responsável<span className="text-destructive ml-0.5">*</span></label>
          <input
            type="text"
            value={coordinator}
            onChange={(e) => { setCoordinator(e.target.value); setErrors((prev) => ({ ...prev, coordinator: undefined })); }}
            className={`w-full px-3 py-2 bg-input text-body text-foreground rounded-md focus:ring-2 ring-ring outline-none transition-all duration-200 placeholder:text-muted-foreground focus:shadow-md ${errors.coordinator ? "ring-2 ring-destructive" : ""}`}
            placeholder="Nome do responsável"
            autoComplete="off"
          />
          {errors.coordinator && <p className="text-xs text-destructive">{errors.coordinator}</p>}
        </div>

        {/* Problem Type */}
        <div className="space-y-1.5 animate-slide-up" style={{ animationDelay: "0.15s" }}>
          <label className="label-text">Tipo de Problema</label>
          <div className="grid grid-cols-2 gap-1.5">
            {PROBLEM_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setProblemType(type)}
                className={`flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium rounded-md transition-all duration-200 hover-lift ${
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
        <div className="space-y-1.5 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <label className="label-text">Urgência</label>
          <div className="flex gap-2">
            {URGENCY_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setUrgency(level)}
                className={`flex-1 py-2 text-xs font-medium rounded-md border-2 transition-all duration-200 hover-lift ${
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
        <div className="space-y-1.5 animate-slide-up" style={{ animationDelay: "0.25s" }}>
          <label className="label-text">Descrição<span className="text-destructive ml-0.5">*</span></label>
          <textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); setErrors((prev) => ({ ...prev, description: undefined })); }}
            rows={3}
            className={`w-full px-3 py-2 bg-input text-body text-foreground rounded-md focus:ring-2 ring-ring outline-none transition-all duration-200 placeholder:text-muted-foreground resize-y focus:shadow-md ${errors.description ? "ring-2 ring-destructive" : ""}`}
            placeholder="O que aconteceu?"
          />
          {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
        </div>

        {/* Solution */}
        <div className="space-y-1.5 animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <label className="label-text">Solução aplicada</label>
          <textarea
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-input text-body text-foreground rounded-md focus:ring-2 ring-ring outline-none transition-all duration-200 placeholder:text-muted-foreground resize-y focus:shadow-md"
            placeholder="O que foi feito?"
          />
        </div>

        {/* Image Attachments */}
        <div className="space-y-1.5 animate-slide-up" style={{ animationDelay: "0.35s" }}>
          <label className="label-text">Imagens</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-all w-full justify-center"
          >
            <ImagePlus className="w-4 h-4" />
            Anexar imagens
          </button>
          {previews.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {previews.map((src, i) => (
                <div key={i} className="relative group">
                  <img
                    src={src}
                    alt={`Preview ${i + 1}`}
                    className="w-16 h-16 object-cover rounded-md border border-border"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
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
        <div className="animate-slide-up" style={{ animationDelay: "0.45s" }}>
          <button
            type="submit"
            className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-md shadow-primary-glow hover:brightness-110 active:scale-[0.97] transition-all duration-200 hover:shadow-lg"
          >
            Registrar Incidente
          </button>
        </div>
      </form>
    </div>
  );
}
