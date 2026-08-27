import { supabase } from "@/integrations/supabase/client";

export type SalePageEventType =
  | "view"
  | "cta_click"
  | "info_open"
  | "buy_click"
  | "video_complete";

// Visitor key = unik per tab session (elak inflated view bila scroll balik)
function getVisitorKey(): string {
  try {
    let k = sessionStorage.getItem("sp_visitor");
    if (!k) {
      k = `v_${Math.random().toString(36).slice(2)}_${Date.now()}`;
      sessionStorage.setItem("sp_visitor", k);
    }
    return k;
  } catch {
    return `v_${Date.now()}`;
  }
}

// Track event — SILENT (jangan await, jangan throw) supaya tak rosak feed
export function trackSalePageEvent(
  pageId: string,
  type: SalePageEventType,
  meta?: { variation_id?: string }
) {
  try {
    supabase
      .from("sale_page_events")
      .insert({
        page_id: pageId,
        event_type: type,
        variation_id: meta?.variation_id ?? null,
        visitor_key: type === "view" ? getVisitorKey() : null,
      })
      .then(() => {}, () => {});
  } catch {
    /* silent */
  }
}
