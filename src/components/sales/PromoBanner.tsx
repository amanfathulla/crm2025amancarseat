import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Ticket, ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FeaturedCoupon {
  code: string;
  discount_amount: number;
  discount_type: string;
  valid_until: string;
  banner_theme: string;
}

const formatDiscount = (c: FeaturedCoupon) =>
  c.discount_type === "percentage"
    ? `${c.discount_amount}%`
    : `RM${c.discount_amount}`;

// Theme presets: [banner bg, badge bg, text color, button bg, button text]
type Theme = {
  wrap: string;
  badge: string;
  text: string;
  btnBg: string;
  btnText: string;
};

const THEMES: Record<string, Theme> = {
  orange: {
    wrap: "bg-gradient-to-r from-red-600 via-red-500 to-amber-500",
    badge: "bg-white/20 text-white",
    text: "text-white",
    btnBg: "bg-white hover:bg-white/90",
    btnText: "text-red-600",
  },
  red: {
    wrap: "bg-gradient-to-r from-red-700 via-red-600 to-red-500",
    badge: "bg-white/20 text-white",
    text: "text-white",
    btnBg: "bg-white hover:bg-white/90",
    btnText: "text-red-700",
  },
  black: {
    wrap: "bg-gradient-to-r from-zinc-900 via-zinc-800 to-black",
    badge: "bg-white/15 text-white",
    text: "text-white",
    btnBg: "bg-white hover:bg-white/90",
    btnText: "text-black",
  },
  white: {
    wrap: "bg-gradient-to-r from-gray-100 via-white to-gray-100 border-b border-gray-200",
    badge: "bg-black/10 text-black",
    text: "text-zinc-900",
    btnBg: "bg-red-600 hover:bg-red-500",
    btnText: "text-white",
  },
  yellow: {
    wrap: "bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-400",
    badge: "bg-black/10 text-black",
    text: "text-zinc-900",
    btnBg: "bg-zinc-900 hover:bg-zinc-800",
    btnText: "text-white",
  },
};

/**
 * Dynamic promo banner driven by the CRM "Kupon Utama" (is_featured_landing) coupon.
 * - Reads publicly from Supabase (publishable key, anon SELECT).
 * - Shows only when the coupon is active AND not expired (valid_until >= now).
 * - Theme (orange/red/black/white) is chosen in the CRM and applied here.
 * - Auto-disappears if the coupon is edited to expired / deleted / unfeatured / inactive.
 */
export default function PromoBanner() {
  const [coupon, setCoupon] = useState<FeaturedCoupon | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const { data } = await supabase
        .from("coupons")
        .select("code, discount_amount, discount_type, valid_until, banner_theme")
        .eq("is_active", true)
        .eq("is_featured_landing", true)
        .maybeSingle();

      if (!active) return;

      // Hide banner if coupon is expired (tammat tempoh).
      if (data && new Date((data as FeaturedCoupon).valid_until).getTime() >= Date.now()) {
        setCoupon(data as FeaturedCoupon);
      } else {
        setCoupon(null);
      }
      setLoading(false);
    };

    load();
    // Refresh periodically so expiry / CRM edits reflect without a reload.
    const interval = setInterval(load, 60_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  if (loading || !coupon) return null;

  const theme = THEMES[coupon.banner_theme] ?? THEMES.orange;

  return (
    <div className={`w-full ${theme.wrap}`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-center gap-3 flex-wrap text-center">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${theme.badge}`}>
            <Sparkles className="w-3.5 h-3.5" /> Promo
          </span>
          <p className={`text-sm md:text-base font-semibold ${theme.text}`}>
            Guna Kod{" "}
            <span className="font-extrabold underline decoration-current/40 underline-offset-2">
              {coupon.code}
            </span>{" "}
            · Jimat{" "}
            <span className="font-extrabold">{formatDiscount(coupon)}</span>{" "}
            Terus
          </p>
          <Link
            to="/order"
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold shadow-sm transition-colors ${theme.btnBg} ${theme.btnText}`}
          >
            <Ticket className="w-4 h-4" />
            Order Sekarang
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
