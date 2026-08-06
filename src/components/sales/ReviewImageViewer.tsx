import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { X } from "lucide-react";

/** Watermark overlay shown on every testimonial image. */
export function ImageWatermark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-end">
      <div className="bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-1 pt-4 text-center leading-tight">
        <p className={`font-bold text-white/95 ${compact ? "text-[7px]" : "text-[10px]"}`}>#sarungkusyenACS</p>
        <p className={`text-white/80 ${compact ? "text-[6px]" : "text-[9px]"}`}>www.amancarseat.com</p>
        <p className={`text-white/80 ${compact ? "text-[6px]" : "text-[9px]"}`}>019-4503184 (HQ)</p>
      </div>
    </div>
  );
}

const LightboxContext = createContext<(src: string) => void>(() => {});
export const useLightbox = () => useContext(LightboxContext);

export function LightboxProvider({ children }: { children: ReactNode }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSrc(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <LightboxContext.Provider value={setSrc}>
      {children}
      {src && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSrc(null)}
        >
          <button
            aria-label="Tutup"
            onClick={() => setSrc(null)}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="relative max-h-[85vh] max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <img
              src={src}
              alt="Testimoni pelanggan AmanCarSeat"
              onContextMenu={(e) => e.preventDefault()}
              draggable={false}
              className="max-h-[85vh] w-auto rounded-xl select-none"
            />
            <ImageWatermark />
          </div>
        </div>
      )}
    </LightboxContext.Provider>
  );
}

/** Testimonial image: no external link, watermark baked on, opens in-page viewer. */
export function ReviewImage({
  src,
  alt,
  compact = false,
  className = "",
}: {
  src: string;
  alt: string;
  compact?: boolean;
  className?: string;
}) {
  const open = useLightbox();
  return (
    <button
      type="button"
      onClick={() => open(src)}
      className={`relative aspect-square w-full overflow-hidden rounded-md bg-neutral-900 border border-white/5 ${className}`}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full object-cover select-none hover:scale-105 transition-transform"
      />
      <ImageWatermark compact={compact} />
    </button>
  );
}
