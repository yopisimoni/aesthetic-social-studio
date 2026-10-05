import { makeHandler } from "./handler.ts";
Deno.serve(makeHandler({
  supabaseUrl: Deno.env.get("SUPABASE_URL"),
  serviceKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
  resendKey: Deno.env.get("RESEND_API_KEY"),
  webhookSecret: Deno.env.get("LEAD_WEBHOOK_SECRET"),
  from: Deno.env.get("LEAD_NOTIFICATION_FROM"),
}));
