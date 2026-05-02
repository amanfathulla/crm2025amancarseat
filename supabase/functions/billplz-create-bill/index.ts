import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Load Billplz credentials from DB (admin-configurable)
    const { data: settings } = await supabase
      .from('billplz_settings')
      .select('api_key, collection_id')
      .limit(1)
      .single();

    // Fall back to env vars if DB row is empty
    const BILLPLZ_API_KEY = (settings?.api_key && settings.api_key.trim()) 
      ? settings.api_key.trim() 
      : Deno.env.get('BILLPLZ_API_KEY');
    const BILLPLZ_COLLECTION_ID = (settings?.collection_id && settings.collection_id.trim())
      ? settings.collection_id.trim()
      : Deno.env.get('BILLPLZ_COLLECTION_ID');

    if (!BILLPLZ_API_KEY || !BILLPLZ_COLLECTION_ID) {
      throw new Error('BillPlz credentials not configured. Sila kemaskini tetapan Billplz dalam Admin Settings.');
    }

    const body = await req.json().catch(() => ({}));

    // Health-check ping from System Monitor — return 200 OK without creating a bill
    if (body && body.ping === true) {
      return new Response(JSON.stringify({ ok: true, status: 'healthy', message: 'Billplz function reachable & credentials configured' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { name, email, phone, product, product_variation, car_model, sales_amount, address, city, state, zip_code, coupon_code, seat_image_front, seat_image_back, seat_image_third_row, additional_notes, payment_type, full_price, balance_amount } = body;

    // Fetch shipping settings
    const { data: shipSettings } = await supabase
      .from('shipping_settings')
      .select('semenanjung_cost, sabah_sarawak_cost, is_enabled')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    const EAST_MALAYSIA = ['Sabah', 'Sarawak', 'W.P. Labuan'];
    let shippingCost = 0;
    if (shipSettings && (shipSettings as any).is_enabled && state) {
      shippingCost = EAST_MALAYSIA.includes(state)
        ? Number((shipSettings as any).sabah_sarawak_cost) || 0
        : Number((shipSettings as any).semenanjung_cost) || 0;
    }

    if (!name || !phone || !product || !sales_amount) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- SERVER-SIDE PRICE VALIDATION ---
    // Look up the canonical price from the database instead of trusting client
    let canonicalPrice = parseFloat(sales_amount);
    
    // Find the product by name
    const { data: dbProduct } = await supabase
      .from('products')
      .select('id, price, name')
      .eq('name', product)
      .limit(1)
      .single();

    if (dbProduct) {
      if (product_variation) {
        // Look up variation price
        const { data: dbVariation } = await supabase
          .from('product_variations')
          .select('price')
          .eq('product_id', dbProduct.id)
          .eq('name', product_variation)
          .limit(1)
          .single();

        if (dbVariation) {
          canonicalPrice = dbVariation.price;
        }
      } else {
        canonicalPrice = dbProduct.price;
      }
    }

    // Add shipping cost to canonical price
    const priceWithShipping = Number(canonicalPrice) + Number(shippingCost);

    // Apply coupon discount if applicable
    let discountAmount = 0;
    if (coupon_code && coupon_code.trim()) {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('discount_amount, discount_type, is_active, usage_count, usage_limit, valid_from, valid_until')
        .eq('code', coupon_code.trim().toUpperCase())
        .eq('is_active', true)
        .limit(1)
        .single();

      if (coupon) {
        const now = new Date();
        const validFrom = new Date(coupon.valid_from);
        const validUntil = new Date(coupon.valid_until);
        if (now >= validFrom && now <= validUntil && coupon.usage_count < coupon.usage_limit) {
          if (coupon.discount_type === 'percentage') {
            discountAmount = priceWithShipping * (coupon.discount_amount / 100);
          } else {
            discountAmount = coupon.discount_amount;
          }
        }
      }
    }

    const fullValidatedPrice = Math.max(priceWithShipping - discountAmount, 0.01);
    const isDeposit = payment_type === 'deposit';
    // Server-computed amount the buyer must pay NOW
    const expectedAmountToPay = isDeposit
      ? Math.round(fullValidatedPrice * 0.5 * 100) / 100
      : fullValidatedPrice;
    const serverBalanceAmount = isDeposit
      ? Math.round((fullValidatedPrice - expectedAmountToPay) * 100) / 100
      : 0;

    // Reject if client price differs significantly from server price (tolerance for rounding)
    const clientPrice = parseFloat(sales_amount);
    if (Math.abs(clientPrice - expectedAmountToPay) > 1.0) {
      console.error(`Price mismatch: client=${clientPrice}, server=${expectedAmountToPay} (full=${fullValidatedPrice}, deposit=${isDeposit})`);
      return new Response(JSON.stringify({ error: 'Harga tidak sah. Sila muat semula halaman dan cuba lagi.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Amount to charge via BillPlz now
    const finalPrice = expectedAmountToPay;

    // Create customer record first
    const uniqueEmail = email && email.trim()
      ? email.trim()
      : `${phone.replace(/[^0-9]/g, '')}+${Date.now()}@noemail.com`;

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        name: String(name).slice(0, 200),
        email: uniqueEmail,
        phone: String(phone).slice(0, 20),
        product,
        product_variation: product_variation || '',
        car_model: car_model ? String(car_model).slice(0, 100) : '',
        sales_amount: fullValidatedPrice,
        paid_amount: finalPrice,
        address: address ? String(address).slice(0, 500) : '',
        city: city ? String(city).slice(0, 100) : '',
        state: state ? String(state).slice(0, 100) : '',
        zip_code: zip_code ? String(zip_code).slice(0, 10) : '',
        order_status: 'processing',
        order_date: new Date().toISOString(),
        seat_image_front: seat_image_front || null,
        seat_image_back: seat_image_back || null,
        seat_image_third_row: seat_image_third_row || null,
        additional_notes: additional_notes ? String(additional_notes).slice(0, 1000) : null,
        payment_type: isDeposit ? 'deposit' : 'full',
        deposit_amount: isDeposit ? finalPrice : 0,
        balance_amount: serverBalanceAmount,
      })
      .select()
      .single();

    if (customerError) {
      console.error('Customer insert error:', customerError);
      throw new Error(`Failed to create customer record: ${customerError.message}`);
    }

    // Increment coupon usage if coupon was applied
    if (coupon_code && coupon_code.trim() && discountAmount > 0) {
      try {
        await supabase.rpc('increment_coupon_usage', { p_code: coupon_code.trim().toUpperCase() });
      } catch (rpcErr) {
        console.warn('Could not increment coupon usage:', rpcErr);
      }
    }

    // Determine redirect URL
    const origin = req.headers.get('origin') || 'https://crm2025amancarseat.lovable.app';
    const callbackUrl = `${origin}/order/thank-you?customer_id=${customer.id}`;

    // Create BillPlz bill
    const amountCents = Math.round(finalPrice * 100);
    const formData = new FormData();
    formData.append('collection_id', BILLPLZ_COLLECTION_ID);
    formData.append('email', email || `${phone}@noemail.com`);
    formData.append('mobile', phone.replace(/[^0-9]/g, ''));
    formData.append('name', name);
    formData.append('amount', String(amountCents));
    formData.append('callback_url', `https://${Deno.env.get('SUPABASE_URL')?.split('//')[1]}/functions/v1/billplz-callback`);
    formData.append('redirect_url', callbackUrl);
    formData.append('description', `Tempahan ${product} - ${product_variation || ''} | ${car_model || ''}`);
    formData.append('reference_1', customer.id);
    formData.append('reference_1_label', 'Customer ID');

    const billplzRes = await fetch('https://www.billplz.com/api/v3/bills', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(BILLPLZ_API_KEY + ':')}`,
      },
      body: formData,
    });

    const billData = await billplzRes.json();

    if (!billplzRes.ok) {
      console.error('BillPlz error:', billData);
      await supabase.from('customers').delete().eq('id', customer.id);
      throw new Error(billData.error?.message || 'Failed to create BillPlz bill');
    }

    // Update customer with bill ID
    await supabase
      .from('customers')
      .update({ zip_code: billData.id })
      .eq('id', customer.id);

    // Fire Telegram notification (non-blocking)
    const supabaseProjectUrl = Deno.env.get('SUPABASE_URL') || '';
    fetch(`${supabaseProjectUrl}/functions/v1/telegram-notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: customer.id, payment_source: 'billplz' }),
    }).catch(() => {});

    return new Response(JSON.stringify({
      bill_url: billData.url,
      bill_id: billData.id,
      customer_id: customer.id,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
