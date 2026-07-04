import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1';

// Replace with a real HTTP client like fetch or Resend SDK when available
// For now, this is a mock implementation that updates the automation log.
// In a real environment, you would use:
// import { Resend } from "https://esm.sh/resend@2.0.0";
// const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  try {
    const { to, subject, html, gymId, leadId, templateId } = await req.json();

    // Mock sending email
    console.log(`Sending email to ${to} with subject "${subject}"`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update automation log to Delivered
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // We would normally look up the specific log, but here we update the most recent one for this lead/template
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
            delivery_response: { provider: 'resend', id: 'evt_123', status: 'delivered' } 
          })
          .eq('id', logs[0].id);
      }
    }

    return new Response(JSON.stringify({ success: true, message: 'Email sent' }), {
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
