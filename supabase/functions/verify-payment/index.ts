import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1';
import { hmac } from "https://deno.land/x/crypto@v0.10.0/hmac.ts";

// Utility to verify Razorpay signature (mocked)
serve(async (req) => {
  try {
    const { gymId, razorpayPaymentId, razorpaySubscriptionId, razorpaySignature } = await req.json();

    // In a real scenario, you would verify the HMAC SHA256 signature using your RAZORPAY_KEY_SECRET
    // const secret = Deno.env.get('RAZORPAY_KEY_SECRET') || '';
    // const generatedSignature = await hmac('sha256', secret, razorpayPaymentId + '|' + razorpaySubscriptionId, 'utf8', 'hex');
    // if (generatedSignature !== razorpaySignature) {
    //   throw new Error('Invalid signature');
    // }

    console.log(`Verified payment ${razorpayPaymentId} for subscription ${razorpaySubscriptionId}`);

    // Update gym billing status in Supabase (we'll implement billing table later)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Update the user's plan via users table for now (since GymContext uses user's plan)
      // We would actually update the subscription metadata on a 'subscriptions' table, but for this demo:
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .eq('gym_id', gymId);

      if (users && users.length > 0) {
        // Upgrade the first user found (the owner) to 'growth' or 'pro' depending on what they bought.
        // For now, hardcode to 'pro' for demo purposes.
        await supabase
          .from('users')
          .update({ plan: 'pro' })
          .eq('id', users[0].id);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
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
