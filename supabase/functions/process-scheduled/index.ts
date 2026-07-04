// Supabase Edge Function: Process Scheduled Messages
// Deploy: supabase functions deploy process-scheduled
//
// This function is called by Supabase Cron every 5 minutes:
//   select cron.schedule('process-followups', '*/5 * * * *', $$
//     select net.http_post(
//       url := '<SUPABASE_URL>/functions/v1/process-scheduled',
//       headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb,
//       body := '{}'::jsonb
//     );
//   $$);

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Use service role key — this function runs as a system process, not a user
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch all pending messages that are due
    const now = new Date().toISOString();
    const { data: pendingMessages, error: fetchError } = await supabase
      .from("scheduled_messages")
      .select(`
        *,
        leads ( id, name, phone, email, goal, gym_id ),
        templates ( id, name, channel, subject, content )
      `)
      .eq("status", "pending")
      .lte("scheduled_at", now)
      .limit(50); // Process in batches

    if (fetchError) throw fetchError;
    if (!pendingMessages || pendingMessages.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: "No pending messages" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    let processed = 0;
    let failed = 0;

    for (const scheduled of pendingMessages) {
      const lead = scheduled.leads;
      const template = scheduled.templates;

      if (!lead || !template) {
        // Mark as failed if lead or template was deleted
        await supabase
          .from("scheduled_messages")
          .update({ status: "failed" })
          .eq("id", scheduled.id);
        failed++;
        continue;
      }

      // 2. Resolve gym name
      const { data: gym } = await supabase
        .from("gyms")
        .select("name")
        .eq("id", lead.gym_id)
        .single();

      const gymName = gym?.name || "Our Gym";

      // 3. Variable replacement
      let messageBody = template.content;
      messageBody = messageBody.replace(/\{\{name\}\}/g, lead.name);
      messageBody = messageBody.replace(/\{\{phone\}\}/g, lead.phone || "");
      messageBody = messageBody.replace(/\{\{email\}\}/g, lead.email || "");
      messageBody = messageBody.replace(/\{\{goal\}\}/g, lead.goal || "your fitness goals");
      messageBody = messageBody.replace(/\{\{gym_name\}\}/g, gymName);

      // 4. Create automation log
      const { data: log } = await supabase
        .from("automation_logs")
        .insert({
          gym_id: scheduled.gym_id,
          lead_id: lead.id,
          template_id: template.id,
          channel: template.channel,
          status: "Sent",
          message_preview: messageBody,
        })
        .select()
        .single();

      // 5. Dispatch to the appropriate channel
      const channel = template.channel;
      try {
        if (channel === "email" || channel === "both") {
          if (lead.email) {
            await fetch(`${supabaseUrl}/functions/v1/send-email`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                to: lead.email,
                subject: template.subject || `Message from ${gymName}`,
                html: `<p>${messageBody.replace(/\n/g, "<br>")}</p>`,
                automation_log_id: log?.id,
              }),
            });
          }
        }

        if (channel === "whatsapp" || channel === "both") {
          if (lead.phone) {
            await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                to: lead.phone,
                message: messageBody,
                automation_log_id: log?.id,
              }),
            });
          }
        }
      } catch (sendErr) {
        console.error(`Failed to send message ${scheduled.id}:`, sendErr);
        // The individual send functions handle their own log updates
      }

      // 6. Mark scheduled message as sent
      await supabase
        .from("scheduled_messages")
        .update({ status: "sent" })
        .eq("id", scheduled.id);

      processed++;
    }

    return new Response(
      JSON.stringify({ processed, failed, total: pendingMessages.length }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Scheduler error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
