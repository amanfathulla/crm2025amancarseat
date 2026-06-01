// Dispatcher callback for toyyibpay, chip, bayarcash, bcl.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const url = new URL(req.url);
    const provider = (url.searchParams.get("provider") || "").toLowerCase();
    const customerIdFromUrl = url.searchParams.get("customer_id");

    const ct = req.headers.get("content-type") || "";
    let params: Record<string, any> = {};
    if (ct.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      new URLSearchParams(text).forEach((v, k) => (params[k] = v));
    } else if (ct.includes("application/json")) {
      params = await req.json().catch(() => ({}));
    } else {
      try {
        const text = await req.text();
        new URLSearchParams(text).forEach((v, k) => (params[k] = v));
      } catch { /* noop */ }
    }

    let paid = false;
    let customerId = customerIdFromUrl;

    if (provider === "toyyibpay") {
      // status_id "1" = success
      paid = String(params.status_id) === "1";
      customerId = customerId || params.order_id || params.billExternalReferenceNo;
    } else if (provider === "chip") {
      paid = params.status === "paid" || params.event_type === "purchase.paid";
      customerId = customerId || params.reference || params?.data?.reference;
    } else if (provider === "bayarcash") {
      paid = String(params.status) === "3" || params.status_description === "Successful";
      customerId = customerId || params.order_number;
    } else if (provider === "bcl") {
      paid = params.status === "success" || params.payment_status === "paid";
      customerId = customerId || params.reference;
    }

    if (paid && customerId) {
      await supabase.from("customers")
        .update({ order_status: "completed" })
        .eq("id", customerId);
    }

    return new Response(JSON.stringify({ received: true, paid }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("payment-callback error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
