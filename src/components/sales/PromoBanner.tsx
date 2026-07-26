import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Ticket, ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FeaturedCoupon {
  code: string;
  discount_amount: number;
  discount_type: string;
  valid_until: string;
}

const formatDiscount = (c: FeaturedCoupon) =>
  c.discount_type === "percentage"
    ? `${c.discount_amount}%`
    : `RM${c.discount_amount}`;

/**
 * Dynamic promo banner driven by the CRM "Kupon Utama" (is_featured_landing) coupon.
 * - Reads publicly from Supabase (publishable key, anon SELECT).
 * - Shows only when the coupon is active AND not expired (valid_until >= now).
 * - Auto-disappears if the coupon is edited to expired / deleted / unfeatured / inactive.
 * No code changes needed on the website to run a new promo — just toggle it in the CRM.
 */
export default function PromoBanner() {
  const [coupon, setCoupon] = useState<FeaturedCoupon | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const { data } = await supabase
        .from("coupons")
        .select("code, discount_amount, discount_type, valid_until")
        .eq("is_active", true)
        .eq("is_featured_landing", true)
        .maybeSingle();

      if (!active) return;

      // Req 3: hide banner if coupon is expired (tammat tempoh).
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

  return (
    <div className="w-full bg-gradient-to-r from-red-600 via-red-500 to-amber-500">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-center gap-3 flex-wrap text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
            <Sparkles className="w-3.5 h-3.5" /> Promo
          </span>
          <p className="text-sm md:text-base font-semibold text-white">
            Guna Kod{" "}
            <span className="font-extrabold underline decoration-white/60 underline-offset-2">
              {coupon.code}
            </span>{" "}
            · Jimat{" "}
            <span className="font-extrabold">{formatDiscount(coupon)}</span>{" "}
            Terus
          </p>
          <Link
            to="/order"
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-sm font-bold text-red-600 shadow-sm hover:bg-white/90 transition-colors"
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
