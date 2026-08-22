import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

interface Props {
  text: string;
  children: ReactNode;
  className?: string;
}

// Tooltip propio: hover en escritorio (group-hover) y tap en móvil (onClick
// alterna `open`). Se cierra al hacer clic fuera. El atributo nativo `title`
// no se abre con tap en táctil, por eso este reemplazo.
export function InfoTooltip({ text, children, className }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  return (
    <div
      ref={ref}
      className={`group relative cursor-help ${className ?? ""}`}
      onClick={() => setOpen((o) => !o)}
    >
      {children}
      <div
        className={`pointer-events-none absolute z-30 left-0 top-full mt-1 w-56 max-w-[80vw] rounded border border-gray-300 bg-white p-2 text-xs leading-snug text-gray-700 ${
          open ? "block" : "hidden"
        } group-hover:block`}
      >
        {text}
      </div>
    </div>
  );
}
