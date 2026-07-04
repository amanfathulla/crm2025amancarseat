import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

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

    const { data: gateway } = await supabase
      .from('payment_gateways')
      .select('credentials')
      .eq('provider', 'billplz')
      .limit(1)
      .single();

    const credentials = (gateway?.credentials || {}) as Record<string, string>;
    const BILLPLZ_X_SIGNATURE_KEY = credentials.x_signature_key?.trim();

    const contentType = req.headers.get('content-type') || '';
    let params: Record<string, string> = {};

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await req.text();
      const urlParams = new URLSearchParams(text);
      urlParams.forEach((value, key) => { params[key] = value; });
    } else {
      params = await req.json();
    }

    const billId = params['id'];
    const paidAt = params['paid_at'];
    const paid = params['paid'];
    const xSignature = params['x_signature'];

    // Verify x-signature if key is set
    if (BILLPLZ_X_SIGNATURE_KEY && xSignature) {
      const source = [
        `id${billId}`,
        `paid_at${paidAt}`,
        `paid${paid}`,
      ].join('|');
      const hmac = createHmac('sha256', BILLPLZ_X_SIGNATURE_KEY)
        .update(source)
        .digest('hex');
      if (hmac !== xSignature) {
        console.error('Invalid x-signature');
        return new Response('Invalid signature', { status: 401 });
      }
    }

    if (paid === 'true' && billId) {
      const customerId = params['reference_1'];
      if (customerId) {
        await supabase
          .from('customers')
          .update({ order_status: 'completed' })
          .eq('id', customerId);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Callback error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
