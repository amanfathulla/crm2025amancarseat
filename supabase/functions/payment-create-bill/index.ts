// Dispatcher edge function: creates a bill via the chosen payment gateway provider.
// Supports: toyyibpay, chip, bayarcash, bcl. (Billplz keeps its own dedicated function.)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const body = await req.json().catch(() => ({}));
    const provider: string = (body.provider || "").toLowerCase();
    if (!provider) return json({ error: "Provider tidak dinyatakan" }, 400);

    // Load gateway config
    const { data: gw } = await supabase
      .from("payment_gateways")
      .select("*")
      .eq("provider", provider)
      .single();

    if (!gw || !gw.is_enabled) {
      return json({ error: `Gateway ${provider} tidak aktif` }, 400);
    }
    const creds = (gw.credentials || {}) as Record<string, string>;
    const sandbox = !!gw.sandbox_mode;

    // Common fields from order page
    const {
      name, email, phone, product, product_variation, car_model,
      sales_amount, address, city, state, zip_code, coupon_code,
      seat_image_front, seat_image_back, seat_image_third_row,
      additional_notes, payment_type, full_price, balance_amount,
    } = body;

    if (!name || !phone || !product || !sales_amount) {
      return json({ error: "Maklumat tidak lengkap" }, 400);
    }

    // Shipping cost
    const { data: shipSettings } = await supabase
      .from("shipping_settings").select("*").limit(1).maybeSingle();
    const EAST = ["Sabah", "Sarawak", "W.P. Labuan"];
    let shippingCost = 0;
    if (shipSettings?.is_enabled && state) {
      shippingCost = EAST.includes(state)
        ? Number(shipSettings.sabah_sarawak_cost) || 0
        : Number(shipSettings.semenanjung_cost) || 0;
    }

    // Server-side price lookup
    let canonical = parseFloat(sales_amount);
    const { data: dbProduct } = await supabase
      .from("products").select("id, price").eq("name", product).limit(1).single();
    if (dbProduct) {
      if (product_variation) {
        const { data: v } = await supabase.from("product_variations")
          .select("price").eq("product_id", dbProduct.id).eq("name", product_variation).limit(1).single();
        if (v) canonical = v.price;
      } else canonical = dbProduct.price;
    }
    const priceWithShipping = Number(canonical) + Number(shippingCost);

    // Coupon
    let discount = 0;
    if (coupon_code?.trim()) {
      const { data: c } = await supabase.from("coupons")
        .select("*").eq("code", coupon_code.trim().toUpperCase()).eq("is_active", true).limit(1).single();
      if (c) {
        const now = new Date();
        if (now >= new Date(c.valid_from) && now <= new Date(c.valid_until) && c.usage_count < c.usage_limit) {
          discount = c.discount_type === "percentage"
            ? priceWithShipping * (c.discount_amount / 100)
            : c.discount_amount;
        }
      }
    }
    const fullValidated = Math.max(priceWithShipping - discount, 0.01);
    const isDeposit = payment_type === "deposit";
    const amountToPay = isDeposit
      ? Math.round(fullValidated * 0.5 * 100) / 100
      : fullValidated;
    const serverBalance = isDeposit ? Math.round((fullValidated - amountToPay) * 100) / 100 : 0;

    const clientPrice = parseFloat(sales_amount);
    if (Math.abs(clientPrice - amountToPay) > 1.0) {
      return json({ error: "Harga tidak sah." }, 400);
    }

    // Insert customer
    const uniqueEmail = email?.trim() || `${phone.replace(/[^0-9]/g, "")}+${Date.now()}@noemail.com`;
    const { data: customer, error: custErr } = await supabase
      .from("customers").insert({
        name: String(name).slice(0, 200),
        email: uniqueEmail,
        phone: String(phone).slice(0, 20),
        product, product_variation: product_variation || "",
        car_model: car_model?.slice(0, 100) || "",
        sales_amount: fullValidated,
        paid_amount: amountToPay,
        address: address?.slice(0, 500) || "",
        city: city?.slice(0, 100) || "",
        state: state?.slice(0, 100) || "",
        zip_code: zip_code?.slice(0, 10) || "",
        order_status: "processing",
        order_date: new Date().toISOString(),
        seat_image_front: seat_image_front || null,
        seat_image_back: seat_image_back || null,
        seat_image_third_row: seat_image_third_row || null,
        additional_notes: additional_notes?.slice(0, 1000) || null,
        payment_type: isDeposit ? "deposit" : "full",
        deposit_amount: isDeposit ? amountToPay : 0,
        balance_amount: serverBalance,
        payment_gateway: provider,
      }).select().single();

    if (custErr) throw new Error(`Customer insert: ${custErr.message}`);

    if (coupon_code?.trim() && discount > 0) {
      await supabase.rpc("increment_coupon_usage", { p_code: coupon_code.trim().toUpperCase() }).then(() => {}, () => {});
    }

    const origin = req.headers.get("origin") || "https://crm2025amancarseat.lovable.app";
    const redirectUrl = `${origin}/order/thank-you?customer_id=${customer.id}`;
    const callbackUrl = `${SUPABASE_URL}/functions/v1/payment-callback?provider=${provider}&customer_id=${customer.id}`;
    const amountCents = Math.round(amountToPay * 100);
    const description = `Tempahan ${product} ${product_variation || ""}`.slice(0, 100);

    let billUrl = "";
    let billId = "";

    // ===== Provider dispatch =====
    if (provider === "toyyibpay") {
      if (!creds.secret_key || !creds.category_code) {
        await supabase.from("customers").delete().eq("id", customer.id);
        return json({ error: "toyyibPay credentials belum diisi" }, 400);
      }
      const base = sandbox ? "https://dev.toyyibpay.com" : "https://toyyibpay.com";
      const fd = new FormData();
      fd.append("userSecretKey", creds.secret_key);
      fd.append("categoryCode", creds.category_code);
      fd.append("billName", description.slice(0, 30));
      fd.append("billDescription", description);
      fd.append("billPriceSetting", "1");
      fd.append("billPayorInfo", "1");
      fd.append("billAmount", String(amountCents));
      fd.append("billReturnUrl", redirectUrl);
      fd.append("billCallbackUrl", callbackUrl);
      fd.append("billExternalReferenceNo", customer.id);
      fd.append("billTo", name);
      fd.append("billEmail", uniqueEmail);
      fd.append("billPhone", phone.replace(/[^0-9]/g, ""));
      fd.append("billPaymentChannel", "2"); // FPX + Card
      const r = await fetch(`${base}/index.php/api/createBill`, { method: "POST", body: fd });
      const arr = await r.json();
      const code = Array.isArray(arr) ? arr[0]?.BillCode : null;
      if (!code) {
        await supabase.from("customers").delete().eq("id", customer.id);
        return json({ error: "toyyibPay gagal cipta bil", detail: arr }, 500);
      }
      billId = code;
      billUrl = `${base}/${code}`;
    } else if (provider === "chip") {
      if (!creds.api_key || !creds.brand_id) {
        await supabase.from("customers").delete().eq("id", customer.id);
        return json({ error: "CHIP credentials belum diisi" }, 400);
      }
      const base = sandbox ? "https://gate.chip-in.asia/api/v1" : "https://gate.chip-in.asia/api/v1";
      const r = await fetch(`${base}/purchases/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${creds.api_key}`,
        },
        body: JSON.stringify({
          brand_id: creds.brand_id,
          purchase: {
            currency: "MYR",
            products: [{ name: description, price: amountCents }],
          },
          client: { email: uniqueEmail, full_name: name, phone: phone },
          success_redirect: redirectUrl,
          failure_redirect: redirectUrl,
          success_callback: callbackUrl,
          reference: customer.id,
        }),
      });
      const data = await r.json();
      if (!r.ok || !data.checkout_url) {
        await supabase.from("customers").delete().eq("id", customer.id);
        return json({ error: "CHIP gagal cipta bil", detail: data }, 500);
      }
      billId = data.id;
      billUrl = data.checkout_url;
    } else if (provider === "bayarcash") {
      if (!creds.api_key || !creds.portal_key) {
        await supabase.from("customers").delete().eq("id", customer.id);
        return json({ error: "Bayarcash credentials belum diisi" }, 400);
      }
      const base = sandbox ? "https://console.console.bayar.cash/api/v3" : "https://console.bayar.cash/api/v3";
      const r = await fetch(`${base}/portals/${creds.portal_key}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${creds.api_key}`,
        },
        body: JSON.stringify({
          payment_channel: 1, // FPX
          order_number: customer.id.slice(0, 16),
          amount: amountToPay.toFixed(2),
          payer_name: name,
          payer_email: uniqueEmail,
          payer_telephone_number: phone.replace(/[^0-9]/g, ""),
          return_url: redirectUrl,
          callback_url: callbackUrl,
        }),
      });
      const data = await r.json();
      if (!r.ok || !data.url) {
        await supabase.from("customers").delete().eq("id", customer.id);
        return json({ error: "Bayarcash gagal cipta bil", detail: data }, 500);
      }
      billId = data.transaction_id || data.id || "";
      billUrl = data.url;
    } else if (provider === "bcl") {
      if (!creds.api_key || !creds.merchant_id) {
        await supabase.from("customers").delete().eq("id", customer.id);
        return json({ error: "BCL Pay credentials belum diisi" }, 400);
      }
      // BCL Pay routes through Bayarcash infra; this is a basic scaffold.
      const base = sandbox ? "https://sandbox.bclpay.com.my/api/v1" : "https://api.bclpay.com.my/api/v1";
      const r = await fetch(`${base}/charge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${creds.api_key}`,
        },
        body: JSON.stringify({
          merchant_id: creds.merchant_id,
          reference: customer.id,
          amount: amountToPay.toFixed(2),
          currency: "MYR",
          description,
          customer: { name, email: uniqueEmail, phone },
          return_url: redirectUrl,
          callback_url: callbackUrl,
        }),
      });
      const data = await r.json();
      const url = data.payment_url || data.url || data.checkout_url;
      if (!r.ok || !url) {
        await supabase.from("customers").delete().eq("id", customer.id);
        return json({ error: "BCL Pay gagal cipta bil", detail: data }, 500);
      }
      billId = data.transaction_id || data.id || "";
      billUrl = url;
    } else {
      await supabase.from("customers").delete().eq("id", customer.id);
      return json({ error: `Provider '${provider}' tidak disokong` }, 400);
    }

    await supabase.from("customers")
      .update({ gateway_bill_id: billId })
      .eq("id", customer.id);

    // Telegram notification (non-blocking)
    fetch(`${SUPABASE_URL}/functions/v1/telegram-notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: customer.id, payment_source: provider }),
    }).catch(() => {});

    return json({ bill_url: billUrl, bill_id: billId, customer_id: customer.id });
  } catch (err: any) {
    console.error("payment-create-bill error:", err);
    return json({ error: err.message }, 500);
  }
});
