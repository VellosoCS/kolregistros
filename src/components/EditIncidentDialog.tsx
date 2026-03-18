import { useState, useRef } from "react";
import { Incident, ProblemType, UrgencyLevel, PROBLEM_TYPES, URGENCY_LEVELS } from "@/lib/types";
import { Monitor, BookOpen, LayoutGrid, Users, Briefcase, DollarSign, HelpCircle, ImagePlus, X } from "lucide-react";

const PROBLEM_ICONS: Record<ProblemType, React.ReactNode> = {
  "Técnico": <Monitor className="w-3.5 h-3.5" />,
  "Didático": <BookOpen className="w-3.5 h-3.5" />,
  "Plataforma": <LayoutGrid className="w-3.5 h-3.5" />,
  "Aluno": <Users className="w-3.5 h-3.5" />,
  "Administrativo": <Briefcase className="w-3.5 h-3.5" />,
  "Financeiro": <DollarSign className="w-3.5 h-3.5" />,
  "Dúvida": <HelpCircle className="w-3.5 h-3.5" />,
};

interface EditIncidentDialogProps {
  incident: Incident;
  onSave: (updated: Incident, newFiles: File[]) => void;
  onClose: () => void;
}

export default function EditIncidentDialog({ incident, onSave, onClose }: EditIncidentDialogProps) {
  const [teacherName, setTeacherName] = useState(incident.teacherName);
  const [coordinator, setCoordinator] = useState(incident.coordinator);
  const [problemType, setProblemType] = useState<ProblemType>(incident.problemType);
  const [urgency, setUrgency] = useState<UrgencyLevel>(incident.urgency);
  const [description, setDescription] = useState(incident.description);
  const [solution, setSolution] = useState(incident.solution);
  const [needsFollowUp, setNeedsFollowUp] = useState(incident.needsFollowUp);
  const [existingImages, setExistingImages] = useState<string[]>(incident.imageUrls || []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
    setNewFiles((prev) => [...prev, ...files]);
    files.forEach((file) => setNewPreviews((prev) => [...prev, URL.createObjectURL(file)]));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewFile = (index: number) => {
    URL.revokeObjectURL(newPreviews[index]);
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim() || !description.trim()) return;

    const updated: Incident = {
      ...incident,
      teacherName: teacherName.trim(),
      coordinator,
      problemType,
      urgency,
      description: description.trim(),
      solution: solution.trim(),
      needsFollowUp,
      imageUrls: existingImages,
    };

    onSave(updated, newFiles);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl shadow-lg w-full max-w-lg mx-4 max-h-[85vh] flex flex-col animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Editar Incidente</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Teacher Name */}
          <div className="space-y-1.5">
            <label className="label-text">Professor</label>
            <input
              type="text"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              className="w-full px-3 py-2 bg-input text-body text-foreground rounded-md focus:ring-2 ring-ring outline-none transition-all"
            />
          </div>

          {/* Responsible */}
          <div className="space-y-1.5">
            <label className="label-text">Responsável</label>
            <input
              type="text"
              value={coordinator}
              onChange={(e) => setCoordinator(e.target.value)}
              className="w-full px-3 py-2 bg-input text-body text-foreground rounded-md focus:ring-2 ring-ring outline-none transition-all placeholder:text-muted-foreground"
              placeholder="Nome do responsável"
            />
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
              className="w-full px-3 py-2 bg-input text-body text-foreground rounded-md focus:ring-2 ring-ring outline-none transition-all resize-y"
            />
          </div>

          {/* Solution */}
          <div className="space-y-1.5">
            <label className="label-text">Solução aplicada</label>
            <textarea
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-input text-body text-foreground rounded-md focus:ring-2 ring-ring outline-none transition-all resize-y"
            />
          </div>

          {/* Images */}
          <div className="space-y-1.5">
            <label className="label-text">Imagens</label>
            {existingImages.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {existingImages.map((url, i) => (
                  <div key={url} className="relative group">
                    <img src={url} alt={`Imagem ${i + 1}`} className="w-16 h-16 object-cover rounded-md border border-border" />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {newPreviews.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {newPreviews.map((src, i) => (
                  <div key={i} className="relative group">
                    <img src={src} alt={`Nova ${i + 1}`} className="w-16 h-16 object-cover rounded-md border border-border ring-2 ring-primary/30" />
                    <button
                      type="button"
                      onClick={() => removeNewFile(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFilesChange} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-all w-full justify-center"
            >
              <ImagePlus className="w-4 h-4" />
              Anexar mais imagens
            </button>
          </div>

          {/* Follow-up */}
          <div className="flex items-center justify-between py-1">
            <label className="text-body text-foreground font-medium">Precisa de acompanhamento?</label>
            <button
              type="button"
              role="switch"
              aria-checked={needsFollowUp}
              onClick={() => setNeedsFollowUp(!needsFollowUp)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${needsFollowUp ? "bg-primary" : "bg-secondary"}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-card shadow-card ring-0 transition-transform mt-0.5 ${needsFollowUp ? "translate-x-[22px]" : "translate-x-0.5"}`} />
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-md shadow-primary-glow hover:brightness-110 active:scale-[0.98] transition-all"
          >
            Salvar Alterações
          </button>
        </form>
      </div>
    </div>
  );
}
