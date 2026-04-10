import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { isVideoUrl } from "@/lib/media-utils";
import CachedImage from "@/components/CachedImage";
import { preloadImages } from "@/lib/image-cache";

interface ImageCarouselDialogProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export default function ImageCarouselDialog({ images, initialIndex = 0, onClose }: ImageCarouselDialogProps) {
  const [current, setCurrent] = useState(initialIndex);

  const prev = useCallback(() => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1)), [images.length]);
  const next = useCallback(() => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1)), [images.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next, onClose]);

  useEffect(() => {
    // Preload adjacent images into cache
    const adjacent = [current - 1, current + 1]
      .filter((i) => i >= 0 && i < images.length)
      .map((i) => images[i])
      .filter((url) => !isVideoUrl(url));
    preloadImages(adjacent);
  }, [current, images]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={onClose}>
      <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
        {/* Left arrow — outside the image */}
        {images.length > 1 && (
          <button
            onClick={prev}
            className="shrink-0 p-2.5 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        )}

        {/* Image container */}
        <div className="relative flex flex-col items-center">
          <button onClick={onClose} className="absolute -top-10 right-0 p-1 rounded-full bg-background/20 hover:bg-background/40 transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>

          {isVideoUrl(images[current]) ? (
            <video
              src={images[current]}
              controls
              autoPlay
              className="max-w-[75vw] max-h-[80vh] rounded-lg"
            />
          ) : (
            <CachedImage
              src={images[current]}
              alt={`Imagem ${current + 1}`}
              className="max-w-[75vw] max-h-[80vh] object-contain rounded-lg"
              loading="eager"
              decoding="async"
            />
          )}

          {images.length > 1 && (
            <span className="mt-3 text-sm text-white/80 tabular-nums">
              {current + 1} / {images.length}
            </span>
          )}
        </div>

        {/* Right arrow — outside the image */}
        {images.length > 1 && (
          <button
            onClick={next}
            className="shrink-0 p-2.5 rounded-full bg-white/10 hover:bg-white/25 border border-white/20 transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        )}
      </div>
    </div>
  );
}
