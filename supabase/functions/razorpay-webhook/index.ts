import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1';

serve(async (req) => {
  try {
    // A real Razorpay Webhook would send an event signature in the headers
    // const signature = req.headers.get('x-razorpay-signature');
    
    const body = await req.json();
    console.log(`Received Razorpay webhook event: ${body.event}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Handle events like subscription.charged, subscription.halted, etc.
      if (body.event === 'subscription.charged') {
        const subscriptionId = body.payload.subscription.entity.id;
        // In a real scenario we'd look up the gym by subscriptionId and update billing status
        console.log(`Subscription ${subscriptionId} successfully charged.`);
      }
    }

    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
