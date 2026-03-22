import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface ImageCarouselDialogProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export default function ImageCarouselDialog({ images, initialIndex = 0, onClose }: ImageCarouselDialogProps) {
  const [current, setCurrent] = useState(initialIndex);

  const prev = useCallback(() => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1)), [images.length]);
  const next = useCallback(() => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1)), [images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next, onClose]);

  // Preload adjacent images
  useEffect(() => {
    const preload = (index: number) => {
      if (index >= 0 && index < images.length) {
        const img = new Image();
        img.src = images[index];
      }
    };
    preload(current + 1);
    preload(current - 1);
  }, [current, images]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      <div className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-10 right-0 p-1 rounded-full bg-background/20 hover:bg-background/40 transition-colors">
          <X className="w-5 h-5 text-white" />
        </button>

        <img
          src={images[current]}
          alt={`Imagem ${current + 1}`}
          className="max-w-full max-h-[80vh] object-contain rounded-lg"
          loading="eager"
          decoding="async"
        />

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/30 hover:bg-background/50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/30 hover:bg-background/50 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
            <span className="mt-3 text-sm text-white/80 tabular-nums">
              {current + 1} / {images.length}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
