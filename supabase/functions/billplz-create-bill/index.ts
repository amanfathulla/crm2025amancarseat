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

    const body = await req.json();
    const { name, email, phone, product, product_variation, car_model, sales_amount, address, city, state, zip_code, coupon_code } = body;

    if (!name || !phone || !product || !sales_amount) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create customer record first
    // Use a unique email to avoid duplicate constraint (phone + timestamp suffix)
    const uniqueEmail = email && email.trim()
      ? email.trim()
      : `${phone.replace(/[^0-9]/g, '')}+${Date.now()}@noemail.com`;

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        name,
        email: uniqueEmail,
        phone,
        product,
        product_variation: product_variation || '',
        car_model: car_model || '',
        sales_amount: parseFloat(sales_amount),
        paid_amount: parseFloat(sales_amount),
        address: address || '',
        city: city || '',
        state: state || '',
        zip_code: zip_code || '',
        order_status: 'processing',
        order_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (customerError) {
      console.error('Customer insert error:', customerError);
      throw new Error(`Failed to create customer record: ${customerError.message}`);
    }

    // Increment coupon usage if coupon was applied - fixed: use try/catch instead of .catch()
    if (coupon_code && coupon_code.trim()) {
      try {
        await supabase.rpc('increment_coupon_usage', { p_code: coupon_code.trim().toUpperCase() });
      } catch (rpcErr) {
        console.warn('Could not increment coupon usage:', rpcErr);
        // Non-fatal, continue with order
      }
    }

    // Determine redirect URL
    const origin = req.headers.get('origin') || 'https://crm2025amancarseat.lovable.app';
    const callbackUrl = `${origin}/order/thank-you?customer_id=${customer.id}`;

    // Create BillPlz bill
    const amountCents = Math.round(parseFloat(sales_amount) * 100);
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
