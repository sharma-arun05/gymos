import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1';

// Mock implementation for WhatsApp Cloud API
serve(async (req) => {
  try {
    const { to, text, gymId, leadId, templateId } = await req.json();

    console.log(`Sending WhatsApp to ${to}: ${text}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update automation log to Delivered
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: logs } = await supabase
        .from('automation_logs')
        .select('id')
        .eq('lead_id', leadId)
        .eq('template_id', templateId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (logs && logs.length > 0) {
        await supabase
          .from('automation_logs')
          .update({ 
            status: 'Delivered', 
            delivery_response: { provider: 'meta', id: 'wamid.123', status: 'delivered' } 
          })
          .eq('id', logs[0].id);
      }
    }

    return new Response(JSON.stringify({ success: true, message: 'WhatsApp sent' }), {
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
