import { supabase } from "@/integrations/supabase/client";

export type PixelSettings = {
  id?: string;
  meta_pixel_id: string;
  meta_enabled: boolean;
  tiktok_pixel_id: string;
  tiktok_enabled: boolean;
  gtm_id: string;
  gtm_enabled: boolean;
  ga4_id: string;
  ga4_enabled: boolean;
};

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
    ttq?: any;
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

let loaded = false;
let cached: PixelSettings | null = null;

export async function fetchPixelSettings(): Promise<PixelSettings | null> {
  const { data } = await (supabase as any)
    .from("pixel_settings")
    .select("*")
    .limit(1)
    .maybeSingle();
  return (data as PixelSettings) || null;
}

function injectMeta(id: string) {
  if (window.fbq) return;
  /* eslint-disable */
  (function (f: any, b: Document, e: string, v: string) {
    let n: any, t: any, s: any;
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
    t = b.createElement(e) as HTMLScriptElement; t.async = true; t.src = v;
    s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */
  window.fbq!("init", id);
}

function injectTikTok(id: string) {
  if (window.ttq) return;
  /* eslint-disable */
  (function (w: any, d: Document, t: string) {
    w.TiktokAnalyticsObject = t;
    const ttq = (w[t] = w[t] || []);
    ttq.methods = ["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
    ttq.setAndDefer = function (obj: any, m: string) {
      obj[m] = function () { obj.push([m].concat(Array.prototype.slice.call(arguments, 0))); };
    };
    for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
    ttq.instance = function (id: string) {
      const e = ttq._i[id] || [];
      for (let n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
      return e;
    };
    ttq.load = function (e: string) {
      const u = "https://analytics.tiktok.com/i18n/pixel/events.js";
      ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = u;
      ttq._t = ttq._t || {}; ttq._t[e] = +new Date();
      ttq._o = ttq._o || {}; ttq._o[e] = {};
      const s = d.createElement("script");
      s.async = true; s.src = u + "?sdkid=" + e + "&lib=" + t;
      const f = d.getElementsByTagName("script")[0];
      f.parentNode!.insertBefore(s, f);
    };
  })(window, document, "ttq");
  /* eslint-enable */
  window.ttq.load(id);
}

function injectGTM(id: string) {
  if (document.getElementById("gtm-script")) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
  const s = document.createElement("script");
  s.id = "gtm-script";
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtm.js?id=${id}`;
  document.head.appendChild(s);
}

function injectGA4(id: string) {
  if (document.getElementById("ga4-script")) return;
  const s = document.createElement("script");
  s.id = "ga4-script";
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer!.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", id);
}

/** Load pixel scripts once (safe to call repeatedly). */
export async function initPixels(): Promise<PixelSettings | null> {
  if (loaded) return cached;
  loaded = true;
  try {
    const s = await fetchPixelSettings();
    cached = s;
    if (!s) return null;
    if (s.meta_enabled && s.meta_pixel_id) injectMeta(s.meta_pixel_id.trim());
    if (s.tiktok_enabled && s.tiktok_pixel_id) injectTikTok(s.tiktok_pixel_id.trim());
    if (s.gtm_enabled && s.gtm_id) injectGTM(s.gtm_id.trim());
    if (s.ga4_enabled && s.ga4_id) injectGA4(s.ga4_id.trim());
    return s;
  } catch {
    return null;
  }
}

/** Standard PageView across all installed pixels. */
export function trackPageView(path?: string) {
  try {
    window.fbq?.("track", "PageView");
    window.ttq?.page?.();
    window.dataLayer?.push({ event: "page_view", page_path: path || window.location.pathname });
    window.gtag?.("event", "page_view", { page_path: path || window.location.pathname });
  } catch {}
}

/**
 * Track a conversion-style event on every installed pixel.
 * metaEvent/tiktokEvent use each platform's standard naming.
 */
export function trackEvent(
  name: "ViewContent" | "InitiateCheckout" | "Lead" | "Purchase" | "Contact",
  params: Record<string, any> = {}
) {
  const tiktokMap: Record<string, string> = {
    ViewContent: "ViewContent",
    InitiateCheckout: "InitiateCheckout",
    Lead: "SubmitForm",
    Purchase: "CompletePayment",
    Contact: "Contact",
  };
  try {
    window.fbq?.("track", name, params);
    window.ttq?.track?.(tiktokMap[name] || name, params);
    window.dataLayer?.push({ event: name.toLowerCase(), ...params });
    window.gtag?.("event", name, params);
  } catch {}
}
