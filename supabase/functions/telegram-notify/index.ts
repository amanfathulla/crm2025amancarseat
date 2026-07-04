import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const TELEGRAM_API_KEY = Deno.env.get("TELEGRAM_API_KEY");
    if (!TELEGRAM_API_KEY) throw new Error("TELEGRAM_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();

    // Fetch Telegram settings
    const { data: settings, error: settingsErr } = await supabase
      .from("telegram_settings" as any)
      .select("bot_token, chat_id, is_enabled, notify_new_order")
      .limit(1)
      .single();

    if (settingsErr || !settings) {
      return new Response(JSON.stringify({ ok: false, reason: "No telegram settings" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!settings.chat_id) {
      return new Response(JSON.stringify({ ok: false, reason: "No chat_id configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let message: string;

    // Test message mode
    if (body._test) {
      message = body._message || "🧪 *Ujian Notifikasi ACS Legacy CRM*\n\nTetapan Telegram berjaya disambungkan! ✅";
      const chatId = body._chat_id || settings.chat_id;

      const response = await fetch(`${GATEWAY_URL}/sendMessage`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": TELEGRAM_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "Markdown" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(`Telegram API failed [${response.status}]: ${JSON.stringify(result)}`);
      return new Response(JSON.stringify({ ok: true, test: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normal order notification
    if (!settings.is_enabled || !settings.notify_new_order) {
      return new Response(JSON.stringify({ ok: false, reason: "Notifications disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { customer_id, payment_source } = body;

    // Fetch customer data
    const { data: customer, error: custErr } = await supabase
      .from("customers")
      .select("name, phone, car_model, product, product_variation, sales_amount, order_number, state, payment_source, payment_gateway")
      .eq("id", customer_id)
      .single();

    if (custErr || !customer) {
      return new Response(JSON.stringify({ ok: false, reason: "Customer not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paymentSourceKey = String((customer as any).payment_source || payment_source || "").toLowerCase();
    const src = paymentSourceKey === "whatsapp"
      ? "whatsapp"
      : String((customer as any).payment_gateway || (customer as any).payment_source || payment_source || "manual").toLowerCase();
    const srcLabel = src === "whatsapp"
      ? "💬 WhatsApp (Manual)"
      : `💳 ${src.charAt(0).toUpperCase()}${src.slice(1)} (Online)`;
    const amount = `RM${Number((customer as any).sales_amount || 0).toFixed(2)}`;
    const variation = (customer as any).product_variation ? ` (${(customer as any).product_variation})` : "";

    message =
      `🛒 *TEMPAHAN BARU DITERIMA!*\n\n` +
      `📋 No. Tempahan: *#${(customer as any).order_number || "—"}*\n` +
      `👤 Nama: ${(customer as any).name}\n` +
      `📱 Telefon: ${(customer as any).phone}\n` +
      `🚗 Kereta: ${(customer as any).car_model || "—"}\n` +
      `📦 Produk: ${(customer as any).product || "—"}${variation}\n` +
      `📍 Negeri: ${(customer as any).state || "—"}\n` +
      `💰 Jumlah: *${amount}*\n` +
      `💳 Kaedah Bayar: ${srcLabel}\n\n` +
      `_Sila semak CRM untuk maklumat lanjut._`;

    const response = await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TELEGRAM_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: settings.chat_id,
        text: message,
        parse_mode: "Markdown",
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(`Telegram API failed [${response.status}]: ${JSON.stringify(result)}`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("telegram-notify error:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
