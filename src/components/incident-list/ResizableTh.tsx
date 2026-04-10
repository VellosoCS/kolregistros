import { useState, useCallback, useRef as useReactRef } from "react";

interface ResizableThProps {
  children: React.ReactNode;
  defaultWidth: number;
  align?: "left" | "right" | "center";
  columnId?: string;
}

export default function ResizableTh({ children, defaultWidth, align = "center", columnId }: ResizableThProps) {
  const thRef = useReactRef<HTMLTableCellElement>(null);
  const startX = useReactRef(0);
  const startW = useReactRef(0);
  const storageKey = columnId ? `col-width-${columnId}` : null;
  const [width, setWidth] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) return Number(saved);
    }
    return defaultWidth;
  });

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startX.current = e.clientX;
    startW.current = width;
    const onMouseMove = (ev: MouseEvent) => {
      const diff = ev.clientX - startX.current;
      const newW = Math.max(50, startW.current + diff);
      setWidth(newW);
      if (storageKey) localStorage.setItem(storageKey, String(newW));
    };
    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [width, storageKey]);

  return (
    <th
      ref={thRef}
      style={{ width: `${width}px`, minWidth: `${Math.min(width, 50)}px`, maxWidth: `${width}px` }}
      className={`label-text px-4 py-3 relative select-none overflow-hidden text-ellipsis whitespace-nowrap ${align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"}`}
    >
      {children}
      <span
        onMouseDown={onMouseDown}
        className="absolute right-0 top-0 bottom-0 w-px cursor-col-resize bg-border hover:bg-primary/50 active:bg-primary/70 transition-colors"
      />
    </th>
  );
}
