import React, { useState } from "react";
import { Star, ShoppingCart, ChevronRight, ChevronLeft, Play, Truck, Shield } from "lucide-react";

// Shared theme resolve
export function resolveTheme(theme: string | null | undefined) {
  const HEX = /^#([0-9a-f]{6})$/i;
  if (theme && HEX.test(theme)) {
    return { cta: "", badge: "", price: "", star: "", hex: theme as string, style: { backgroundColor: theme } };
  }
  const map: Record<string, { cta: string; badge: string; price: string; star: string }> = {
    amber:  { cta: "bg-amber-400",     badge: "bg-amber-400",     price: "text-amber-400",     star: "text-amber-400" },
    red:    { cta: "bg-red-500",       badge: "bg-red-500",       price: "text-red-400",       star: "text-red-400" },
    blue:   { cta: "bg-blue-500",      badge: "bg-blue-500",      price: "text-blue-400",      star: "text-blue-400" },
    green:  { cta: "bg-green-500",     badge: "bg-green-500",     price: "text-green-400",     star: "text-green-400" },
    pink:   { cta: "bg-pink-500",      badge: "bg-pink-500",      price: "text-pink-400",      star: "text-pink-400" },
    purple: { cta: "bg-purple-500",    badge: "bg-purple-500",    price: "text-purple-400",    star: "text-purple-400" },
  };
  const t = (theme && map[theme]) || map.amber;
  return { cta: t.cta, badge: t.badge, price: t.price, star: t.star, hex: null as string | null, style: undefined as any };
}

export interface TplProduct {
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
  category?: string | null;
}

export interface TplPage {
  title: string;
  headline?: string | null;
  subheadline?: string | null;
  video_url?: string | null;
  video_urls?: string[] | null;
  poster_url?: string | null;
  badge_text?: string | null;
  theme?: string | null;
  cta_label?: string | null;
  product_mode?: string | null;
  product_category?: string | null;
  template?: number;
}

const CTA = "#C8203C";
const GOLD = "#CFA227";

function useFirstVideo(page: TplPage): string | null {
  const list = page.video_urls?.filter(Boolean);
  const src = list && list.length ? (list[0] as string) : (page.video_url || null);
  return src;
}

function BuyButton({ theme, label, onClick, full = true }: { theme: any; label: string; onClick?: () => void; full?: boolean }) {
  const cls = theme.hex ? {} : {};
  return (
    <button
      onClick={onClick}
      style={theme.hex ? { backgroundColor: theme.hex } : { backgroundColor: CTA }}
      className={`${full ? "w-full" : ""} h-11 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2`}
    >
      <ShoppingCart className="h-4 w-4" /> {label}
    </button>
  );
}

// ── TEMPLATE 1: Hero Shoppable ──
export function TplHero({ page, product }: { page: TplPage; product?: TplProduct | null }) {
  const theme = resolveTheme(page.theme);
  const src = useFirstVideo(page);
  return (
    <div className="relative w-full h-full bg-[#0C0E11] overflow-hidden flex flex-col">
      <div className="relative flex-1">
        {src && <video src={src} poster={page.poster_url || undefined} autoPlay muted loop playsInline className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        <div className="absolute top-3 left-3 right-3">
          <p className="text-white font-semibold text-sm leading-tight drop-shadow max-w-[80%]">
            {page.headline || page.title}
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <Star className="h-3 w-3" style={{ color: GOLD }} fill={GOLD} />
            <span className="text-white/80 text-[11px]">4.9 • 210 ulasan</span>
            <Truck className="h-3 w-3 text-white/60 ml-1" />
          </div>
        </div>
      </div>
      <div className="p-3 bg-[#0C0E11] flex items-center gap-3">
        <div className="flex-1">
          <p className="text-white/50 text-[10px] line-through">RM{(product?.price ?? 150) + 40}</p>
          <p className="text-white font-bold text-lg" style={{ color: GOLD }}>RM{product?.price ?? 150}</p>
        </div>
        <div className="w-1/2">
          <BuyButton theme={theme} label={page.cta_label || "Beli Sekarang"} />
        </div>
      </div>
    </div>
  );
}

// ── TEMPLATE 2: Dual Split ──
export function TplDual({ page, product }: { page: TplPage; product?: TplProduct | null }) {
  const theme = resolveTheme(page.theme);
  const src = useFirstVideo(page);
  return (
    <div className="relative w-full h-full bg-black flex flex-col">
      <div className="flex-1 flex">
        <div className="flex-1 relative border-r border-white/10">
          <video src={src || undefined} autoPlay muted loop playsInline className="w-full h-full object-cover" />
          <span className="absolute top-2 left-2 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">Sebelum</span>
        </div>
        <div className="flex-1 relative">
          <video src={src || undefined} autoPlay muted loop playsInline className="w-full h-full object-cover" />
          <span className="absolute top-2 left-2 text-[10px] bg-black/60 px-1.5 py-0.5 rounded" style={{ color: GOLD }}>Lepas pasang</span>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white text-black text-[10px] font-bold flex items-center justify-center">VS</div>
      </div>
      <div className="p-3 bg-black flex items-center gap-2">
        <span className="text-[10px] text-white/50 bg-white/10 px-2 py-1 rounded">DIY, tanpa tool</span>
        <span className="text-white font-bold text-sm" style={{ color: GOLD }}>RM{product?.price ?? 150}</span>
        <div className="flex-1"><BuyButton theme={theme} label="Beli" /></div>
      </div>
    </div>
  );
}

// ── TEMPLATE 3: Snap Feed (mini) ──
export function TplSnapFeed({ page, product }: { page: TplPage; product?: TplProduct | null }) {
  const theme = resolveTheme(page.theme);
  const src = useFirstVideo(page);
  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <video src={src || undefined} autoPlay muted loop playsInline className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
      <p className="absolute top-3 left-3 text-white font-semibold text-xs max-w-[70%]">{page.headline || page.title}</p>
      <span className="absolute top-3 right-3 text-white/70 text-[10px] flex items-center gap-1">👁 1.2k</span>
      <div className="absolute bottom-3 left-3 right-3 flex items-end gap-2">
        <div className="flex-1">
          <p className="text-white text-xs font-medium truncate">{product?.name || page.title}</p>
          <p className="text-white font-bold" style={{ color: GOLD }}>RM{product?.price ?? 150}</p>
        </div>
        <BuyButton theme={theme} label="Beli" full={false} />
      </div>
    </div>
  );
}

// ── TEMPLATE 4: Thumbnail Rail ──
export function TplRail({ page, product }: { page: TplPage; product?: TplProduct | null }) {
  const theme = resolveTheme(page.theme);
  const src = useFirstVideo(page);
  const thumbs = [1, 2, 3, 4, 5];
  return (
    <div className="w-full h-full bg-black flex flex-col">
      <div className="p-2 text-[10px] text-white/60">Pilih tengok gaya yang padan kereta anda</div>
      <div className="flex gap-2.5 px-2 overflow-x-auto pb-2" style={{ scrollSnapType: "x mandatory" }}>
        {thumbs.map(i => (
          <div key={i} className="shrink-0" style={{ width: 110, scrollSnapAlign: "start" }}>
            <div className="aspect-[9/13] rounded-lg overflow-hidden bg-zinc-800">
              <video src={src || undefined} autoPlay muted loop playsInline className="w-full h-full object-cover" />
            </div>
            <p className="text-[9px] text-white/70 mt-1">{i === 1 ? "Fabric" : i === 2 ? "Leather" : `Gaya ${i}`}</p>
          </div>
        ))}
      </div>
      <div className="mt-auto p-3 bg-zinc-950 flex items-center gap-3">
        <div>
          <p className="text-white/50 text-[10px] line-through">RM{(product?.price ?? 150) + 30}</p>
          <p className="text-white font-bold" style={{ color: GOLD }}>RM{product?.price ?? 150}</p>
        </div>
        <div className="flex-1"><BuyButton theme={theme} label={page.cta_label || "Beli Sekarang"} /></div>
      </div>
    </div>
  );
}

// ── TEMPLATE 5: Split Panel ──
export function TplPanel({ page, product }: { page: TplPage; product?: TplProduct | null }) {
  const theme = resolveTheme(page.theme);
  const src = useFirstVideo(page);
  return (
    <div className="w-full h-full bg-black flex flex-col md:flex-row">
      <div className="flex-1 relative md:min-h-[280px]">
        <video src={src || undefined} autoPlay muted loop playsInline className="w-full h-full object-cover" />
        <p className="absolute top-2 left-2 text-white text-[11px] font-semibold max-w-[70%] drop-shadow">{page.headline || "Dipercayai 2,100+ pemilik kereta di Malaysia"}</p>
      </div>
      <div className="flex-1 p-4 bg-zinc-950 border-t md:border-t-0 md:border-l border-white/10 flex flex-col justify-center gap-3">
        <p className="text-white font-bold text-base">{product?.name || page.title}</p>
        <p className="text-white/60 text-[11px] leading-snug">{page.subheadline || "Sarung seat premium, pasang sendiri dalam 15 minit. Material tahan lasak."}</p>
        <div className="flex gap-1.5">
          <span className="text-[9px] bg-white/10 text-white px-2 py-0.5 rounded">Waranti 1 Tahun</span>
          <span className="text-[9px] bg-white/10 text-white px-2 py-0.5 rounded">Buatan Malaysia</span>
        </div>
        <p className="text-white font-bold text-xl" style={{ color: GOLD }}>RM{product?.price ?? 150}</p>
        <BuyButton theme={theme} label={page.cta_label || "Beli Sekarang"} />
      </div>
    </div>
  );
}

// ── TEMPLATE 6: Step Accordion ──
export function TplSteps({ page, product }: { page: TplPage; product?: TplProduct | null }) {
  const theme = resolveTheme(page.theme);
  const src = useFirstVideo(page);
  const [step, setStep] = useState(0);
  const steps = [
    { label: "Buka sarung lama", done: true },
    { label: "Sarung baru slip-on", done: false },
    { label: "Kemas & siap", done: false },
  ];
  return (
    <div className="w-full h-full bg-black flex flex-col">
      <div className="relative">
        <video key={step} src={src || undefined} autoPlay muted loop playsInline className="w-full aspect-video object-cover" />
        <p className="absolute top-2 left-2 text-white text-[11px] font-semibold">{page.headline || "Tak perlu bengkel — buat sendiri"}</p>
      </div>
      <div className="p-3 space-y-2 flex-1">
        {steps.map((s, i) => (
          <button key={i} onClick={() => setStep(i)} className={`w-full flex items-center gap-2 p-2 rounded-lg border-l-2 text-left ${i === step ? "bg-white/10" : "bg-white/5"}`} style={i === step ? { borderColor: GOLD } : { borderColor: "transparent" }}>
            <span className={`h-5 w-5 rounded-full border flex items-center justify-center text-[10px] ${i <= step ? "text-white" : "text-white/40 border-white/30"}`} style={i <= step ? { backgroundColor: GOLD, borderColor: GOLD } : {}}>{i < step ? "✓" : i + 1}</span>
            <span className="text-white text-[12px]">{s.label}</span>
          </button>
        ))}
      </div>
      <div className="p-3 bg-zinc-950 flex items-center gap-3">
        <p className="text-white font-bold" style={{ color: GOLD }}>RM{product?.price ?? 150}</p>
        <div className="flex-1"><BuyButton theme={theme} label={page.cta_label || "Beli Sekarang"} /></div>
      </div>
    </div>
  );
}

// ── TEMPLATE 7: Grid 2x2 ──
export function TplGrid({ page, product }: { page: TplPage; product?: TplProduct | null }) {
  const theme = resolveTheme(page.theme);
  const src = useFirstVideo(page);
  const [sel, setSel] = useState(0);
  const variants = [
    { name: "Hitam", price: product?.price ?? 90 },
    { name: "Merah", price: (product?.price ?? 90) + 10 },
    { name: "Kelabu", price: product?.price ?? 90 },
    { name: "Beige", price: (product?.price ?? 90) + 5 },
  ];
  return (
    <div className="w-full h-full bg-black flex flex-col">
      <div className="grid grid-cols-2 gap-2 p-2 flex-1">
        {variants.map((v, i) => (
          <button key={i} onClick={() => setSel(i)} className={`relative rounded-lg overflow-hidden border-2 ${sel === i ? "" : "border-transparent"}`} style={sel === i ? { borderColor: GOLD } : {}}>
            <video src={src || undefined} autoPlay muted loop playsInline className="w-full aspect-square object-cover" />
            <span className="absolute top-1.5 left-1.5 text-[9px] bg-black/60 text-white px-1 rounded">{v.name}</span>
          </button>
        ))}
      </div>
      <div className="p-3 bg-zinc-950 flex items-center gap-3">
        <div>
          <p className="text-white/50 text-[10px]">{variants.length > 1 ? "Dari" : ""} <span className="text-white font-bold text-lg" style={{ color: GOLD }}>RM{variants[sel].price}</span></p>
          <p className="text-white/60 text-[10px]">{variants[sel].name}</p>
        </div>
        <div className="flex-1"><BuyButton theme={theme} label={page.cta_label || "Beli Sekarang"} /></div>
      </div>
    </div>
  );
}

// ── TEMPLATE 8: Bottom Sheet ──
export function TplSheet({ page, product }: { page: TplPage; product?: TplProduct | null }) {
  const theme = resolveTheme(page.theme);
  const src = useFirstVideo(page);
  const [open, setOpen] = useState(false);
  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <video src={src || undefined} autoPlay muted loop playsInline className="w-full h-full object-cover" />
      <p className="absolute top-3 left-3 text-white text-[12px] font-semibold drop-shadow max-w-[70%]">{page.headline || "Tengok macam mana ia dipasang"}</p>
      <div className={`absolute bottom-0 left-0 right-0 bg-zinc-950 rounded-t-2xl transition-all duration-300 px-3 ${open ? "pb-3" : "pb-0"}`} style={{ maxHeight: open ? "70%" : "84px" }}>
        <button onClick={() => setOpen(o => !o)} className="w-full pt-2 pb-1 flex justify-center cursor-pointer">
          <span className="h-1 w-10 rounded-full bg-white/30" />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-white font-semibold text-sm truncate">{product?.name || page.title}</p>
            <p className="text-white font-bold" style={{ color: GOLD }}>RM{product?.price ?? 150}</p>
          </div>
        </div>
        {open && (
          <div className="mt-2 space-y-1.5">
            <div className="flex gap-1.5">
              <span className="text-[9px] bg-white/10 text-white px-2 py-0.5 rounded">Saiz 2/5/7 Seater</span>
              <span className="text-[9px] bg-white/10 text-white px-2 py-0.5 rounded">DIY</span>
            </div>
            <BuyButton theme={theme} label={page.cta_label || "Beli Sekarang"} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── TEMPLATE 9: Floating PiP ──
export function TplPip({ page, product }: { page: TplPage; product?: TplProduct | null }) {
  const theme = resolveTheme(page.theme);
  const src = useFirstVideo(page);
  const [modal, setModal] = useState(false);
  return (
    <div className="w-full h-full bg-zinc-950 overflow-y-auto relative">
      <div className="p-4 space-y-2 text-white/70 text-[11px] leading-relaxed">
        <p className="text-white font-bold text-sm">Spesifikasi</p>
        <p>Material premium, tahan calar, mudah dibasuh. Sesuai semua jenis kereta.</p>
        <p className="text-white font-bold text-sm mt-3">Cara Jagaan</p>
        <p>Lap guna kain lembap. Jangan guna bahan kimia kuat.</p>
        <p className="text-white font-bold text-sm mt-3">Saiz</p>
        <p>2 Seater • 5 Seater • 7 Seater</p>
        <div className="h-24" />
      </div>
      {!modal && (
        <button onClick={() => setModal(true)} className="fixed bottom-3 right-3 z-30 w-[100px] rounded-xl overflow-hidden shadow-2xl border border-white/20" style={{ aspectRatio: "9/16" }}>
          <video src={src || undefined} autoPlay muted loop playsInline className="w-full h-full object-cover" />
          <span className="absolute top-1 left-1 text-[8px] text-white bg-black/50 px-1 rounded">Jangan skip video ni</span>
          <span className="absolute bottom-1 left-1 right-1 text-[8px] text-white font-bold" style={{ color: GOLD }}>RM{product?.price ?? 150}</span>
        </button>
      )}
      {modal && (
        <div className="absolute inset-0 bg-black z-40 flex flex-col">
          <video src={src || undefined} autoPlay muted loop playsInline className="w-full flex-1 object-contain" />
          <div className="p-3 bg-zinc-950 flex items-center gap-2">
            <p className="text-white font-bold flex-1" style={{ color: GOLD }}>RM{product?.price ?? 150}</p>
            <BuyButton theme={theme} label="Beli" full={false} />
            <button onClick={() => setModal(false)} className="text-white/60 text-xs px-2">Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TEMPLATE 10: Scrollytelling ──
export function TplStory({ page, product }: { page: TplPage; product?: TplProduct | null }) {
  const theme = resolveTheme(page.theme);
  const src = useFirstVideo(page);
  return (
    <div className="w-full h-full bg-black overflow-y-auto">
      <div className="border-t border-white/10 p-5 flex items-start gap-3">
        <span className="text-2xl">⚠️</span>
        <p className="text-white text-sm">Seat lusuh, kotor, tak match interior?</p>
      </div>
      <div className="border-t border-white/10 relative">
        <video src={src || undefined} autoPlay muted loop playsInline className="w-full aspect-video object-cover" />
        <span className="absolute top-2 left-2 text-[10px] bg-white/80 text-black px-1.5 py-0.5 rounded font-bold">DEMO PASANG</span>
      </div>
      <div className="border-t border-white/10 p-5 flex items-start gap-3 justify-between">
        <div className="flex items-start gap-3">
          <span className="text-2xl" style={{ color: GOLD }}>✓</span>
          <div>
            <p className="text-white text-sm font-medium">Kemas, baru, siap 15 minit</p>
            <p className="text-white font-bold text-lg mt-1" style={{ color: GOLD }}>RM{product?.price ?? 150}</p>
          </div>
        </div>
        <BuyButton theme={theme} label="Beli" full={false} />
      </div>
    </div>
  );
}

export function SalePageTemplate({ template, page, product }: { template: number; page: TplPage; product?: TplProduct | null }) {
  switch (template) {
    case 2: return <TplDual page={page} product={product} />;
    case 3: return <TplSnapFeed page={page} product={product} />;
    case 4: return <TplRail page={page} product={product} />;
    case 5: return <TplPanel page={page} product={product} />;
    case 6: return <TplSteps page={page} product={product} />;
    case 7: return <TplGrid page={page} product={product} />;
    case 8: return <TplSheet page={page} product={product} />;
    case 9: return <TplPip page={page} product={product} />;
    case 10: return <TplStory page={page} product={product} />;
    default: return <TplHero page={page} product={product} />;
  }
}
